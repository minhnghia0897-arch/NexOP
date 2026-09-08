-- 0013 — một cửa duy nhất để ghi vào ngân hàng đề.
--
-- Chỗ hổng lộ ra khi soát lại chặng 4. 0006 dựng bảng `exams`/`passages`/`questions` và ba
-- ràng buộc tốt. 0007 dựng `propagate_exam_edit`. Nhưng KHÔNG có hàm nào SỬA được câu hỏi,
-- nên đường duy nhất còn lại là ứng dụng ghi thẳng vào bảng bằng khoá service. Ghi thẳng thì:
--
--   1. Không có sự kiện nào. Toàn kho không có một action `exam.*` — cô sửa đáp án của một
--      câu, thứ quyết định điểm của một đứa trẻ, và không dòng nào ghi lại. Vi phạm thẳng
--      luật cứng: "Mọi hành vi ghi vào events TRƯỚC khi có hiệu lực."
--   2. `propagate_exam_edit` thành hàm phải NHỚ gọi. Quên thì đúng lại cảnh vết sẹo số 1:
--      cô thêm đoạn văn đọc hiểu, lưu, học viên mở ra không thấy, không ai báo gì.
--   3. Cảnh báo OCR không có đường tắt. Ràng buộc cho phép một câu mang CẢ đáp án lẫn cảnh
--      báo, nên cô sửa xong câu OCR đọc hụt mà không ai xoá cảnh báo thì câu đó nằm mãi
--      trong danh sách "cần xem lại". Danh sách không bao giờ rỗng thì cô thôi nhìn — và
--      cảnh báo thật chìm theo.
--
-- Cả ba đều là hỏng-không-kêu. Nên chữa bằng cách bịt đường, không bằng cách dặn dò.

-- ═══════════════════ 1. Cửa chặn ghi thẳng ═══════════════════
--
-- Nói rõ giới hạn: đây KHÔNG phải hàng rào an ninh. Khoá service làm gì cũng được, kể cả
-- tắt trigger này. Việc của nó là chặn TAI NẠN — lập trình viên gõ
-- `supabase.from('questions').update(...)` vì đó là thứ hiện ra đầu tiên trong đầu — và
-- chặn bằng một lỗi chỉ thẳng sang hàm đúng, thay vì im lặng cho qua rồi hỏng ở lớp học.
create function app.exam_write_guard() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('app.exam_write', true), 'off') <> 'on' then
    raise exception
      'Không ghi thẳng vào ngân hàng đề. Dùng app.import_digitized_exam hoặc app.save_exam_edit — chúng ghi sự kiện và lan truyền xuống bài giao.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger questions_one_door before insert or update or delete on questions
  for each row execute function app.exam_write_guard();
create trigger passages_one_door before insert or update or delete on passages
  for each row execute function app.exam_write_guard();
create trigger exams_one_door before insert or update or delete on exams
  for each row execute function app.exam_write_guard();

-- ═══════════════════ 2. Đưa kết quả số hoá vào ngân hàng ═══════════════════
/*
 * UC-03. Một lần gọi, một transaction, cả đề hoặc không gì cả.
 *
 * Hai mươi câu `insert` rời nhau mà hỏng ở câu thứ mười một thì để lại một đề nửa vời —
 * và cô không biết nó nửa vời, vì nhìn vào vẫn thấy có câu hỏi.
 *
 * Vai là `owner`, không phải `system`: máy chỉ bóc và đề xuất, cô soát rồi mới bấm lưu.
 * Kết quả OCR chưa qua tay cô thì chưa được vào đây — nó ở lớp 3, không phải lớp 2.
 *
 * Đoạn văn tham chiếu bằng `ref` do người gọi đặt, vì id chỉ sinh ra lúc chèn. Câu hỏi trỏ
 * tới đoạn bằng `passage_ref`. Trỏ tới ref không tồn tại là lỗi, không phải bỏ qua im lặng.
 */
create function app.import_digitized_exam(
  p_tenant_id uuid,
  p_owner_id  uuid,
  p_exam      jsonb,   -- name, skill, level, tags, duration_minutes, grading, ocr_confidence, source_path
  p_passages  jsonb default '[]'::jsonb,  -- [{ref, text, from_no, to_no}]
  p_questions jsonb default '[]'::jsonb   -- [{no, type, text, options, answer, explanation, passage_ref, warning, source_page, confidence}]
) returns uuid
language plpgsql as $$
declare
  v_exam_id uuid;
  v_map     jsonb := '{}'::jsonb;   -- ref → passage id
  v_p       jsonb;
  v_q       jsonb;
  v_pid     uuid;
  v_ref     text;
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'Đề phải có ít nhất một câu hỏi — lưu một đề rỗng là lưu một thứ không dùng được';
  end if;

  perform app.record_event(
    p_tenant_id, 'owner', 'exam.create', 'exam',
    null, p_owner_id, null,
    jsonb_build_object(
      'name', p_exam ->> 'name',
      'so_cau', jsonb_array_length(p_questions),
      'ocr_confidence', p_exam ->> 'ocr_confidence',
      'source_path', p_exam ->> 'source_path'
    ),
    array[p_owner_id]
  );

  perform set_config('app.exam_write', 'on', true);

  insert into exams (tenant_id, name, skill, level, tags, duration_minutes, grading,
                     ocr_confidence, source_path)
  values (
    p_tenant_id,
    p_exam ->> 'name',
    (p_exam ->> 'skill')::exam_skill,
    p_exam ->> 'level',
    coalesce((select array_agg(value #>> '{}') from jsonb_array_elements(p_exam -> 'tags')), '{}'),
    (p_exam ->> 'duration_minutes')::int,
    coalesce((p_exam ->> 'grading')::exam_grading, 'draft'),
    (p_exam ->> 'ocr_confidence')::numeric,
    p_exam ->> 'source_path'
  )
  returning id into v_exam_id;

  for v_p in select * from jsonb_array_elements(p_passages) loop
    insert into passages (exam_id, text, from_no, to_no)
    values (v_exam_id, v_p ->> 'text', (v_p ->> 'from_no')::int, (v_p ->> 'to_no')::int)
    returning id into v_pid;
    v_map := v_map || jsonb_build_object(v_p ->> 'ref', v_pid);
  end loop;

  for v_q in select * from jsonb_array_elements(p_questions) loop
    v_ref := v_q ->> 'passage_ref';
    if v_ref is not null and not (v_map ? v_ref) then
      raise exception 'Câu % trỏ tới đoạn văn "%" không có trong đề', v_q ->> 'no', v_ref;
    end if;

    insert into questions (exam_id, no, type, text, options, answer, explanation,
                           passage_id, warning, source_page, confidence)
    values (
      v_exam_id,
      (v_q ->> 'no')::int,
      (v_q ->> 'type')::question_type,
      v_q ->> 'text',
      v_q -> 'options',
      v_q ->> 'answer',
      v_q ->> 'explanation',
      case when v_ref is null then null else (v_map ->> v_ref)::uuid end,
      v_q ->> 'warning',
      (v_q ->> 'source_page')::int,
      (v_q ->> 'confidence')::numeric
    );
  end loop;

  perform set_config('app.exam_write', 'off', true);
  return v_exam_id;
end;
$$;

comment on function app.import_digitized_exam is
  'UC-03: đưa kết quả số hoá cô đã soát vào ngân hàng đề. Cả đề hoặc không gì cả.';

-- ═══════════════════ 3. Sửa đề — và lan truyền, không phải nhớ ═══════════════════
/*
 * UC-04. Ghi sự kiện → sửa → lan truyền, trong một transaction. Lan truyền không còn là
 * việc người gọi phải nhớ, vì nó nằm bên trong.
 *
 * Trả về (updated, skipped) của lan truyền, để màn hình nói được với cô: "3 lớp đã nhận
 * thay đổi, 1 lớp không — vì có em đã nộp rồi." Nuốt con số đó là lấy mất của cô quyết
 * định giao lại thành lần 2.
 *
 * Câu hỏi nhận diện bằng `no` trong đề. Có `no` rồi thì sửa, chưa có thì thêm.
 */
create function app.save_exam_edit(
  p_tenant_id   uuid,
  p_owner_id    uuid,
  p_exam_id     uuid,
  p_questions   jsonb  default '[]'::jsonb,
  p_delete_nos  int[]  default '{}',
  p_exam_fields jsonb  default null
) returns table (updated int, skipped int)
language plpgsql as $$
declare
  v_q       jsonb;
  v_warning text;
  v_da_co   boolean;
begin
  if not exists (select 1 from exams where id = p_exam_id and tenant_id = p_tenant_id) then
    raise exception 'Đề không tồn tại trong tên miền này';
  end if;

  perform app.record_event(
    p_tenant_id, 'owner', 'exam.update', 'exam',
    null, p_owner_id, p_exam_id,
    jsonb_build_object(
      'sua_cau', jsonb_array_length(p_questions),
      'xoa_cau', coalesce(array_length(p_delete_nos, 1), 0),
      'sua_thong_tin_de', p_exam_fields is not null
    ),
    array[p_owner_id]
  );

  perform set_config('app.exam_write', 'on', true);

  if p_exam_fields is not null then
    update exams
       set name             = coalesce(p_exam_fields ->> 'name', name),
           skill            = coalesce((p_exam_fields ->> 'skill')::exam_skill, skill),
           level            = coalesce(p_exam_fields ->> 'level', level),
           duration_minutes = coalesce((p_exam_fields ->> 'duration_minutes')::int, duration_minutes),
           grading          = coalesce((p_exam_fields ->> 'grading')::exam_grading, grading)
     where id = p_exam_id;
  end if;

  if array_length(p_delete_nos, 1) > 0 then
    delete from questions where exam_id = p_exam_id and no = any (p_delete_nos);
  end if;

  for v_q in select * from jsonb_array_elements(p_questions) loop
    /*
     * Cô điền đáp án cho một câu OCR đọc hụt = cô đã xử lý xong câu đó, nên cảnh báo phải
     * tự tắt. Không tắt thì danh sách "cần xem lại" không bao giờ rỗng, cô thôi nhìn nó,
     * và lần sau máy cảnh báo thật cũng chìm theo.
     *
     * Trừ khi cô CỐ Ý ghi cảnh báo — có khoá `warning` trong dữ liệu gửi lên thì nghe cô.
     */
    if v_q ? 'warning' then
      v_warning := v_q ->> 'warning';
    elsif (v_q ->> 'answer') is not null then
      v_warning := null;
    else
      select warning into v_warning
        from questions where exam_id = p_exam_id and no = (v_q ->> 'no')::int;
    end if;

    select true into v_da_co
      from questions where exam_id = p_exam_id and no = (v_q ->> 'no')::int;

    if v_da_co then
      update questions
         set type        = coalesce((v_q ->> 'type')::question_type, type),
             text        = coalesce(v_q ->> 'text', text),
             options     = case when v_q ? 'options' then v_q -> 'options' else options end,
             answer      = case when v_q ? 'answer' then v_q ->> 'answer' else answer end,
             explanation = case when v_q ? 'explanation' then v_q ->> 'explanation' else explanation end,
             warning     = v_warning
       where exam_id = p_exam_id and no = (v_q ->> 'no')::int;
    else
      insert into questions (exam_id, no, type, text, options, answer, explanation, warning)
      values (p_exam_id, (v_q ->> 'no')::int, (v_q ->> 'type')::question_type,
              v_q ->> 'text', v_q -> 'options', v_q ->> 'answer',
              v_q ->> 'explanation', v_warning);
    end if;

    v_da_co := null;
  end loop;

  perform set_config('app.exam_write', 'off', true);

  -- Vế thứ hai của luật ảnh chụp (0007). Nằm ở đây nên không quên được.
  return query select * from app.propagate_exam_edit(p_tenant_id, p_owner_id, p_exam_id);
end;
$$;

comment on function app.save_exam_edit is
  'UC-04: sửa đề. Ghi sự kiện, sửa, rồi lan truyền xuống bài giao chưa ai nộp — cả ba trong một transaction. Trả về số bài đã nhận thay đổi và số bài bỏ qua.';
