import { ChuNho, HopViSao, NutChinh, O, The, TenLop, ThanhDiaChi } from './khung'

/**
 * Màn nhận lời mời, theo bản mẫu k-stu và k-ta.
 *
 * UC-02: "mở link thấy tên cô + tên lớp TRƯỚC khi nhập gì". Nên đây là thành phần
 * thuần hiển thị, tách khỏi chỗ tra cứu — cái gì em thấy trước khi gõ thì kiểm được
 * bằng mắt, không cần dựng cả cơ sở dữ liệu.
 */
export interface LoiMoi {
  subdomain: string
  token: string
  /** Chưa có bảng lớp cho tới chặng 3, nên có thể chưa biết tên lớp. */
  tenLop?: string
  tenCo: string
  vai: 'student' | 'assistant'
  /** SĐT cô đã lưu, ĐÃ che sẵn từ DB. Số đầy đủ không rời khỏi cơ sở dữ liệu. */
  soDaLuuDaChe: string
  siSo?: number
  buoiToi?: string
}

export function ManLoiMoi({ loiMoi }: { loiMoi: LoiMoi }) {
  const laTroGiang = loiMoi.vai === 'assistant'

  return (
    <main className="px-6 py-16">
      <ThanhDiaChi duong={`${loiMoi.subdomain}.oblue.vn/m/${loiMoi.token}`} />
      <The>
        <TenLop
          ten={`Lớp của ${loiMoi.tenCo}`}
          phu={laTroGiang ? 'Lời mời làm trợ giảng' : 'Lời mời vào lớp'}
        />

        <HopViSao sacThai={laTroGiang ? 'cam' : 'xanh-la'} nhan={laTroGiang ? 'TG' : 'HV'}>
          <b className="font-display font-semibold text-text">
            {laTroGiang
              ? `${loiMoi.tenCo} mời bạn làm trợ giảng${loiMoi.tenLop ? ` lớp ${loiMoi.tenLop}` : ''}`
              : `${loiMoi.tenCo} mời em vào lớp${loiMoi.tenLop ? ` ${loiMoi.tenLop}` : ''}`}
          </b>
          <br />
          {laTroGiang ? (
            <>
              Bạn sẽ được: nháp nhận xét tự luận (cô duyệt trước khi gửi) · trả lời bảng tin ·
              điểm danh.
              <br />
              Bạn sẽ không thấy: học phí · rubric của cô · ghi chú riêng của cô · lớp khác.
            </>
          ) : (
            <>
              {loiMoi.siSo ? `${loiMoi.siSo} bạn` : null}
              {loiMoi.siSo && loiMoi.buoiToi ? ' · ' : null}
              {loiMoi.buoiToi ? `buổi tới ${loiMoi.buoiToi}` : null}
              {loiMoi.siSo || loiMoi.buoiToi ? ' · ' : null}
              link dành cho số{' '}
              <span className="whitespace-nowrap">{loiMoi.soDaLuuDaChe}</span>
            </>
          )}
        </HopViSao>

        <h1 className="mb-1.5 font-display text-xl font-semibold text-text">
          {laTroGiang ? 'Xác nhận số điện thoại' : 'Xác nhận đây là số của em'}
        </h1>
        <p className="mb-[18px] text-sm leading-[21px] text-text-2">
          {laTroGiang ? (
            <>
              Số cô đã nhập:{' '}
              <span className="whitespace-nowrap">{loiMoi.soDaLuuDaChe}</span>. Mã gửi
              qua Zalo.
            </>
          ) : (
            'Nhập đủ số điện thoại cô đã lưu. Mã sẽ gửi qua Zalo. Không cần tạo mật khẩu.'
          )}
        </p>

        <form action={`/api/m/${loiMoi.token}`} method="post">
          <O nhan="Số điện thoại" name="phone" type="tel" placeholder="0901 234 567" autoComplete="tel" />
          {laTroGiang ? (
            <O nhan="Tên hiển thị cho học viên" name="name" autoComplete="name" />
          ) : null}
          <NutChinh type="submit">
            {laTroGiang ? 'Nhận mã & bắt đầu' : 'Nhận mã & vào lớp'}
          </NutChinh>
        </form>

        <ChuNho>
          {laTroGiang ? (
            <>
              Quyền hiện ở đây là quyền cô đặt lúc mời. Cô đổi quyền sau, bạn thấy ngay — không
              cần đăng nhập lại.
            </>
          ) : (
            <>
              Số không khớp với số cô lưu → không vào được, và cô sẽ nhận thông báo để kiểm tra.
              Link chỉ dùng 1 lần, hết hạn sau 7 ngày.
            </>
          )}
        </ChuNho>
      </The>
    </main>
  )
}

/** Link hỏng, đã dùng, hoặc quá hạn — nói thẳng, không đổ lỗi cho em. */
export function ManLoiMoiHong({
  subdomain,
  token,
  lyDo,
}: {
  subdomain: string | null
  token: string
  lyDo: 'not_found' | 'already_used' | 'expired'
}) {
  const noiDung = {
    not_found: {
      tieuDe: 'Link này không còn nữa',
      than: 'Có thể em đã mở nhầm link cũ. Nhắn cho cô để cô gửi lại link mới.',
    },
    already_used: {
      tieuDe: 'Link đã được dùng rồi',
      than: 'Mỗi link chỉ dùng một lần. Nếu em đã vào lớp, hãy đăng nhập bằng số điện thoại.',
    },
    expired: {
      tieuDe: 'Link đã quá hạn',
      than: 'Link mời sống 7 ngày. Nhắn cho cô để cô gửi lại link mới.',
    },
  }[lyDo]

  return (
    <main className="px-6 py-16">
      <ThanhDiaChi duong={`${subdomain ?? 'oblue.vn'}${subdomain ? '.oblue.vn' : ''}/m/${token}`} />
      <The>
        <TenLop ten="OBLUE" phu="Lời mời vào lớp" />
        <HopViSao sacThai="cam" nhan="!">
          <b className="font-display font-semibold text-text">{noiDung.tieuDe}</b>
          <br />
          {noiDung.than}
        </HopViSao>
        <a
          href="/dang-nhap"
          className="block h-11 rounded-m bg-primary text-center font-display text-[15px] font-semibold leading-[44px] text-surface hover:bg-primary-hover"
        >
          Đăng nhập bằng số điện thoại
        </a>
      </The>
    </main>
  )
}
