"use client";

/**
 * `s-submit` — em viết và nộp.
 *
 * Cột phải là "trước khi nộp": bốn ô tự tích theo đúng những lỗi CỦA EM, không phải danh
 * sách chung. Ô "không có 'people is'" chỉ có ý nghĩa vì cô đã đánh dấu lỗi đó ba bài liền.
 *
 * Sau khi nộp thì không nói "cảm ơn" — nói CHUYỆN GÌ XẢY RA TIẾP THEO. Em nộp lúc 11 giờ
 * đêm rồi ngồi đoán bao giờ có kết quả là chỗ app học nào cũng làm em lo, và nó sửa được
 * bằng bốn dòng chữ.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DauManEm, WrapEm } from "@/components/em/khung";
import { DongHo, dongHoDoc } from "@/components/em/phan-tu";
import { Khoi, KhoiTrong, Nut } from "@/components/ung-dung/phan-tu";
import { useKho } from "@/lib/demo/dung-kho";
import { EM, baiCuaEm, baiTuLuanPhaiNop, loiCuaEm } from "@/lib/demo/em";
import { nopBaiHanhVi } from "@/lib/demo/hanh-vi";
import { duLieu } from "@/lib/demo/kho";
import { boNhap, docNhap, luuNhap } from "@/lib/demo/nhap-bai";

const TOI_THIEU = 250;

function Tich({ on, ten, phu }: { on: boolean; ten: string; phu?: string }) {
  return (
    <div className="flex items-start gap-2.5 border-t border-border-light py-2 text-[13px] leading-[19px] first:border-t-0 first:pt-0">
      <i
        aria-hidden
        className={`mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border text-[11px] not-italic text-surface ${
          on ? "border-st-green bg-st-green" : "border-border"
        }`}
      >
        {on ? "✓" : ""}
      </i>
      <div>
        <span className="text-text">{ten}</span>
        {phu ? (
          <small className="block text-[12px] text-text-3">{phu}</small>
        ) : null}
      </div>
    </div>
  );
}

/** "hạn 19:00 ngày 15/9" — bản mẫu để hạn ngay trên đầu màn viết, và đó là chỗ đúng của nó. */
function hanDocLa(iso: string): string {
  const d = new Date(iso);
  const gio = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `hạn ${gio} ngày ${d.getDate()}/${d.getMonth() + 1}`;
}

export default function NopBai() {
  useKho();
  const [bai, datBai] = useState("");
  const [loi, datLoi] = useState<string | null>(null);
  const [vuaNop, datVuaNop] = useState<{
    soTu: number;
    giay: number;
    truocHan: number;
  } | null>(null);
  const [daLuu, datDaLuu] = useState(false);
  // Đồng hồ ghi vào ref, không vào state: mỗi giây một lần vẽ lại cả màn thì ô viết bị
  // dựng lại và con trỏ nhảy về đầu — lỗi chỉ lộ khi gõ thật.
  const giay = useRef(0);

  const du = duLieu();
  const bg = baiTuLuanPhaiNop(EM)[0];
  const truoc = baiCuaEm(EM).find((b) => b.nhanXet !== null);
  const conMac = loiCuaEm(EM).filter((l) => !l.daDut);
  const bgId = bg?.id;

  /* Mở màn thì lấy lại nháp cũ. Chạy trong effect chứ không trong `useState(() => …)`:
     `localStorage` không có ở lần dựng trên máy chủ, và bản này xuất tĩnh. */
  useEffect(() => {
    if (!bgId) return;
    const cu = docNhap(bgId, EM);
    if (cu) {
      datBai(cu);
      datDaLuu(true);
    }
  }, [bgId]);

  /* Lưu sau 1 giây không gõ thêm. Bản mẫu hứa "mỗi 10 giây"; 1 giây thì lời hứa đó chắc
     hơn, và ghi một chuỗi vào localStorage là việc rẻ. */
  useEffect(() => {
    if (!bgId || bai === "") return;
    const t = setTimeout(() => {
      luuNhap(bgId, EM, bai);
      datDaLuu(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [bgId, bai]);

  /*
   * Màn xác nhận phải xét TRƯỚC cửa "hết bài".
   *
   * Nộp xong thì `baiTuLuanPhaiNop` không còn bài nào, nên `bg` rỗng — xét cửa kia trước
   * thì em nộp bài xong nhìn thấy "em đã nộp hết bài", còn màn xác nhận là mã chết không
   * bao giờ chạy. Đúng kiểu lỗi chỉ lộ ra khi bấm thật, không lộ khi đọc mã.
   */
  if (vuaNop) {
    return (
      <>
        <DauManEm
          ten="Đã nộp cho cô Thảo"
          quayVe={{ href: "/em/hom-nay", ten: "Hôm nay" }}
        />
        <WrapEm>
          <div className="rounded-l border border-border-light bg-surface px-6 py-8 text-center">
            <span
              aria-hidden
              className="mx-auto mb-3.5 grid h-[72px] w-[72px] place-items-center rounded-[22px] font-display text-[28px] text-surface"
              style={{
                background:
                  "linear-gradient(135deg,var(--av-green-a),var(--av-green-b))",
              }}
            >
              ✓
            </span>
            <h2 className="font-display text-[22px] font-semibold text-text">
              Đã nộp cho cô Thảo
            </h2>
            <p className="mt-1 text-text-2">
              {vuaNop.soTu} từ
              {vuaNop.giay >= 60 ? ` · viết ${dongHoDoc(vuaNop.giay)}` : ""}
              {vuaNop.truocHan > 0
                ? ` · trước hạn ${vuaNop.truocHan} ngày`
                : vuaNop.truocHan === 0
                  ? " · đúng hạn hôm nay"
                  : ` · muộn ${-vuaNop.truocHan} ngày`}
            </p>
          </div>

          <div className="mt-5">
            <Khoi
              ten="Chuyện gì xảy ra tiếp theo"
              phu="Để em biết khi nào có kết quả mà không phải hỏi cô."
            >
              {[
                [
                  "✓",
                  "Bài đã lưu vào hồ sơ của em",
                  "Cô thấy ngay, kèm số từ, thời gian em viết và giờ nộp.",
                  "xong",
                ],
                [
                  "2",
                  "Máy nháp nhận xét theo cách cô chấm — trong vài phút",
                  "Máy đọc bài, đối chiếu ba bài trước của em và rubric của cô. Em CHƯA thấy bản nháp này — chỉ cô thấy.",
                  "nay",
                ],
                [
                  "3",
                  "Cô Thảo duyệt hoặc sửa — thường trước buổi tới",
                  "Cô đọc bài, chỉnh band nếu cần, viết thêm. Không có gì tới em mà cô chưa xem.",
                  "",
                ],
                [
                  "4",
                  "Em nhận nhận xét kèm bài luyện theo lỗi",
                  "Ở mục Bài của tôi. Lỗi cũ tái phạm thì có bài luyện 5 phút đi kèm.",
                  "",
                ],
              ].map(([so, ten, phu, tt]) => (
                <div
                  key={ten as string}
                  className="flex gap-3 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                >
                  <i
                    aria-hidden
                    className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full font-display text-[12px] font-bold not-italic text-surface ${
                      tt === "xong"
                        ? "bg-st-green"
                        : tt === "nay"
                          ? "bg-primary"
                          : "bg-text-3"
                    }`}
                  >
                    {so as string}
                  </i>
                  <div>
                    <b className="block font-display font-semibold text-text">
                      {ten as string}
                    </b>
                    <small className="text-[13px] leading-[19px] text-text-2">
                      {phu as string}
                    </small>
                  </div>
                </div>
              ))}
            </Khoi>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/em/luyen">
              <Nut kieu="chinh">Làm bài luyện trong lúc chờ</Nut>
            </Link>
            <Link href="/em/hom-nay">
              <Nut>Về Hôm nay</Nut>
            </Link>
          </div>
        </WrapEm>
      </>
    );
  }

  if (!bg) {
    return (
      <>
        <DauManEm
          ten="Nộp bài"
          quayVe={{ href: "/em/hom-nay", ten: "Hôm nay" }}
        />
        <WrapEm>
          <KhoiTrong>
            Em đã nộp hết bài cô giao. Bài mới sẽ hiện ở đây và trên bảng tin
            lớp.
          </KhoiTrong>
        </WrapEm>
      </>
    );
  }

  const de = du.de.find((d) => d.id === bg.deId);
  const soTu = bai.trim() ? bai.trim().split(/\s+/).length : 0;
  const doan = bai.trim()
    ? bai
        .trim()
        .split(/\n\s*\n/)
        .filter((x) => x.trim()).length
    : 0;

  /** Lỗi cô đã đánh dấu thuộc nhóm này — dòng phụ của ô tự kiểm. */
  const loiKieu = (nhom: string): string | undefined => {
    const l = conMac.find((x) => x.nhom === nhom);
    if (!l) return undefined;
    return `Cô đánh dấu “${l.ten}” ở ${l.soBai}/${l.tongBai} bài đã chấm`;
  };

  const coMoBai =
    /\b(I (believe|think|agree|disagree)|in my (opinion|view))\b/i.test(bai);
  // Đúng lỗi cô đánh dấu của em: danh từ số nhiều mà động từ vẫn số ít.
  const dinhLoiLap =
    /\b(people|students|they|many \w+s)\s+(is|has|was)\b/i.test(bai);

  return (
    <>
      <DauManEm
        rong
        ten={bg.nhan ?? "Bài tập"}
        quayVe={{ href: "/em/hom-nay", ten: "Hôm nay" }}
        phu={`${de?.ten ?? ""} · ${hanDocLa(bg.hanNop)} · cô chấm theo rubric của cô, không phải máy chấm chung`}
        phai={
          <span className="flex items-center gap-3">
            <span className="hidden text-[12px] text-text-3 sm:inline">
              {daLuu ? "Đã lưu nháp" : "Nháp lưu tự động"}
            </span>
            <DongHo doiGiay={(g) => (giay.current = g)} />
          </span>
        }
      />
      <WrapEm rong>
        {loi ? (
          <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-text-2">
            {loi}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="rounded-l border border-border-light bg-surface px-5 py-[18px]">
              <div className="mb-1.5 font-display text-[12px] font-semibold text-text-3">
                Đề bài
              </div>
              <p className="text-[15px] leading-6 text-text">
                {bg.cauHoi[0]?.de}
              </p>
              <div className="mt-2 text-[13px] text-text-2">
                Viết ít nhất {TOI_THIEU} từ · em nộp muộn hơn được, nhưng cô sẽ
                thấy là muộn
              </div>
            </div>

            <div className="mt-3.5 overflow-hidden rounded-l border border-border bg-surface">
              <textarea
                aria-label="Bài viết của em"
                value={bai}
                onChange={(e) => datBai(e.target.value)}
                placeholder="Viết bài ở đây. Nháp được lưu ngay trên máy của em — tắt máy vẫn còn."
                className="min-h-[340px] w-full resize-y bg-transparent px-5 py-[18px] text-[15px] leading-[26px] text-text outline-none placeholder:text-text-3"
              />
              <div className="flex flex-wrap items-center gap-3.5 border-t border-border-light px-4 py-2.5 text-[13px] text-text-2">
                <span>
                  <b
                    className={`font-display tabular-nums ${
                      soTu >= TOI_THIEU ? "text-st-green-deep" : "text-st-red"
                    }`}
                  >
                    {soTu}
                  </b>{" "}
                  / {TOI_THIEU} từ
                </span>
                <span>
                  <b className="font-display tabular-nums text-text">{doan}</b>{" "}
                  đoạn
                </span>
                <span className="flex-1" />
                <Nut
                  kieu="chinh"
                  disabled={soTu < 150}
                  onClick={() => {
                    const r = nopBaiHanhVi(EM, bg.id, bai, giay.current);
                    if (r.loi) return datLoi(r.loi);
                    boNhap(bg.id, EM);
                    datVuaNop({
                      soTu,
                      giay: giay.current,
                      truocHan: Math.floor(
                        (new Date(bg.hanNop).getTime() - Date.now()) / 86_400_000,
                      ),
                    });
                  }}
                >
                  {soTu >= TOI_THIEU ? "Nộp cho cô" : "Nộp (chưa đủ 250 từ)"}
                </Nut>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Khoi
              ten="Trước khi nộp"
              phu="Tự kiểm — dựa trên lỗi của chính em."
            >
              {/*
                Dòng phụ của mỗi ô là LÝ DO ô đó có trên màn — bản mẫu ghi "Bài Environment
                thiếu — cô đã nhắc", "Lỗi lặp 3 bài". Lấy từ lỗi cô đã đánh dấu trong bài
                của chính em, nên danh sách này khác nhau giữa hai học viên; một danh sách
                tự kiểm chung cho cả lớp thì em đọc hai lần là bỏ qua.
              */}
              <Tich
                on={coMoBai}
                ten="Có câu mở bài nêu rõ ý kiến của em"
                phu={loiKieu("structure")}
              />
              <Tich
                on={bai.trim().length > 0 && !dinhLoiLap}
                ten="Không có “people is”, “students has”"
                phu={loiKieu("grammar")}
              />
              <Tich on={doan >= 4} ten="Mỗi đoạn thân có một ví dụ cụ thể" />
              <Tich
                on={soTu >= TOI_THIEU}
                ten={`Đủ ${TOI_THIEU} từ`}
                phu="Máy đếm — tự tích"
              />
            </Khoi>

            {truoc ? (
              <Khoi ten="Bài trước của em">
                <div className="text-[13px] leading-5 text-text-2">
                  <b className="block font-display font-semibold text-text">
                    {truoc.nhan} · band {truoc.band?.toFixed(1)}
                  </b>
                  Cô nhắc: “{truoc.nhanXet!.noiDung.slice(0, 150)}…”
                </div>
              </Khoi>
            ) : null}
          </div>
        </div>
      </WrapEm>
    </>
  );
}
