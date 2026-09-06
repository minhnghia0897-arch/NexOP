-- 0005 — nhận action ba đoạn như `fee.message.send`.
--
-- 0001 ép action theo mẫu <object>.<verb>, đúng ARCHITECTURE §4. Nhưng
-- permissions.json liệt kê `fee.message.send` trong send_actions_owner_only — ba đoạn.
-- Hệ quả: bước 7 của OPERATIONS.md (tin học phí) không ghi nổi sự kiện, nên theo luật
-- "ghi sự kiện trước, hỏng thì hành vi không xảy ra", tin học phí không bao giờ gửi được.
--
-- Lộ ra khi rà cả vòng vận hành, không lộ khi test từng mảnh rời.
alter table events drop constraint events_action_shape;

alter table events
  add constraint events_action_shape
  check (action ~ '^[a-z_]+(\.[a-z_]+){1,2}(:[a-z_]+)?$');

-- Cửa chặn máy phải soi ĐOẠN CUỐI, không phải đoạn thứ hai. Với `fee.message.send`
-- thì split_part(...,2) ra 'message' — không phải verb — nên luật cũ cho lọt.
alter table events drop constraint events_system_may_only_draft;

alter table events
  add constraint events_system_may_only_draft
  check (
    actor_role <> 'system'
    or regexp_replace(action, '^.*\.', '') in ('draft', 'propose')
    or action like '%.auto:%'
  );
