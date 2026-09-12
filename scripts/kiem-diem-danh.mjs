/**
 * Kiểm ngăn điểm danh trên BẢN TĨNH ĐÃ DỰNG, phục vụ từ một thư mục có hình dạng đúng như
 * GitHub Pages (`/NexOP/demo/...`). Chạy trên trình duyệt thật, vì thứ cần kiểm là tương
 * tác: "mặc định có mặt, chỉ bỏ tích người vắng" không kiểm được bằng cách đọc mã.
 *
 * Cách chạy:
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-diem-danh.mjs /tmp/pages
 *
 * Cần `playwright-core` và Chromium ở `/opt/pw-browsers`. File này được giữ trong repo thay
 * vì để trong /tmp như mấy lần trước: /tmp mất khi container khởi động lại, và mất bài kiểm
 * thì lần sau phải viết lại từ đầu — kèm theo là viết lại cả mấy cái bẫy nó đã bắt được.
 *
 * HAI BẪY FILE NÀY ĐÃ BẮT ĐƯỢC, đừng bỏ:
 *   1. Mỗi phần một context mới. Bước GHI làm sai lệch bước ĐỌC đứng sau nó.
 *   2. Đổi vai bằng nút của ứng dụng, không bằng cách nhét localStorage. Xem `doiVai`.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
// playwright-core không nằm trong dependencies của dự án — đây là bài kiểm chạy tay, không
// chạy trong CI. Đổi đường dẫn nếu cài ở chỗ khác.
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'

const GOC = process.argv[2]
const CONG = 8099
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon' }

const may = createServer(async (rq, rs) => {
  try {
    let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname)
    if (p.endsWith('/')) p += 'index.html'
    const f = join(GOC, normalize(p))
    const noi = await readFile(f)
    rs.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' })
    rs.end(noi)
  } catch {
    rs.writeHead(404, { 'content-type': 'text/plain' })
    rs.end('404')
  }
})
await new Promise((ok) => may.listen(CONG, ok))

const URL_GOC = `http://localhost:${CONG}/NexOP/demo`
const tb = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

let dat = 0, hong = 0
const loiTrang = []
async function kiem(ten, f) {
  try { await f(); console.log('  ✓', ten); dat++ }
  catch (e) { console.log('  ✗', ten, '\n     →', String(e.message).split('\n')[0]); hong++ }
}

/*
 * MỖI PHẦN một context mới, không dùng lại một trang xuyên suốt.
 *
 * Vòng chạy đầu hỏng hai bài kiểm, và hỏng vì chính bài kiểm: phần "ngăn điểm danh" lưu buổi
 * 32 với một em vắng, nên tới phần "vắng 2 buổi liên tiếp" thì buổi 30–31 của Quang Huy và
 * Gia Bảo KHÔNG còn là hai buổi gần nhất nữa — luật tính đúng, dữ liệu đã khác. localStorage
 * sống xuyên các bước, nên bước ghi làm sai lệch bước đọc đứng sau nó.
 *
 * Đổi thứ tự cũng chữa được, nhưng context riêng thì chữa hẳn: bài kiểm không còn phụ thuộc
 * vào việc bài kiểm nào chạy trước.
 */
let tr
async function moPhien() {
  const ctx = await tb.newContext()
  tr = await ctx.newPage()
  tr.on('pageerror', (e) => loiTrang.push(String(e)))
  tr.on('console', (m) => { if (m.type() === 'error') loiTrang.push(m.text()) })
}

/*
 * Đổi vai bằng CHÍNH CÁI NÚT của ứng dụng, không bằng cách nhét localStorage.
 *
 * Bản đầu em viết `localStorage.setItem('oblue-demo-v2', {...cu, vai})`. Nó không chạy, và
 * không chạy im lặng: kho chỉ ghi bản lưu SAU lần ghi đầu tiên, nên lúc đó khoá còn null,
 * `cu` thành `{}`, và bản lưu ghi ra thiếu `du` — `dungHinhDang` thấy sai hình dạng nên bỏ
 * cả bản lưu. Vai vẫn là "cô".
 *
 * Hậu quả đúng kiểu đã gặp ở bản lưu cũ: ba bài kiểm XANH GIẢ. "Em không bấm điểm danh
 * được" xanh vì vai vẫn là cô — không, nó ĐỎ, và đỏ mới là chỗ lộ ra chuyện này. Hai bài
 * "trợ giảng điểm danh được" thì xanh vì cô điểm danh được, chẳng liên quan gì tới trợ giảng.
 *
 * Bấm nút thật thì không có đường nào xanh giả: nút gọi `doiVaiXem`, kho ghi bản lưu đầy đủ.
 */
async function doiVai(vai) {
  const nhan = { owner: 'Cô', assistant: 'Trợ giảng', student: 'Học viên' }[vai]
  await tr.locator('[aria-label="Đổi vai"] button', { hasText: nhan }).click()
  const ok = await tr
    .locator(`[aria-label="Đổi vai"] button[aria-pressed="true"]`)
    .textContent()
  if (ok.trim() !== nhan) throw new Error(`đổi vai thất bại: đang là ${ok}`)
}

console.log('\n── Lưới thẻ lớp: nút Điểm danh ──')
await moPhien()
await tr.goto(`${URL_GOC}/lop-hoc/`, { waitUntil: 'networkidle' })

await kiem('nút "Điểm danh" BẬT được cho cô (trước đây hiện-mà-tắt)', async () => {
  const n = tr.locator('button', { hasText: 'Điểm danh' }).first()
  if (await n.isDisabled()) throw new Error('nút vẫn bị tắt')
})

await kiem('thẻ lớp hiện "Đi học đều" tính từ điểm danh', async () => {
  const t = await tr.locator('text=Đi học đều').first().textContent()
  if (!t) throw new Error('không thấy dòng Đi học đều')
})

await kiem('lớp sắp mở KHÔNG hiện "Buổi 1/36"', async () => {
  const html = await tr.content()
  if (html.includes('Buổi 1/36')) throw new Error('lớp chưa khai giảng vẫn hiện Buổi 1/36')
})

console.log('\n── Ngăn điểm danh ──')
await tr.locator('button', { hasText: 'Điểm danh' }).first().click()
await tr.waitForSelector('[role="dialog"]')

await kiem('tiêu đề mang số buổi kế tiếp (buổi 32)', async () => {
  const t = await tr.locator('[role="dialog"] h2').textContent()
  if (!t.includes('buổi 32')) throw new Error(`tiêu đề: ${t}`)
})

await kiem('MẶC ĐỊNH mọi em có mặt — 18/18', async () => {
  const t = await tr.locator('[role="dialog"]').getByText('18/18 có mặt').first()
  if (!(await t.isVisible())) throw new Error('không thấy 18/18 có mặt')
})

await kiem('18 ô tích, tất cả đang tích', async () => {
  const o = tr.locator('[role="dialog"] input[type="checkbox"]')
  const n = await o.count()
  if (n !== 18) throw new Error(`có ${n} ô, cần 18`)
  for (let i = 0; i < n; i++) {
    if (!(await o.nth(i).isChecked())) throw new Error(`ô ${i} không được tích sẵn`)
  }
})

await kiem('em "vắng buổi trước" KHÔNG bị bỏ tích hộ cô', async () => {
  const nhac = tr.locator('[role="dialog"]').getByText('vắng buổi trước')
  if ((await nhac.count()) === 0) throw new Error('không có em nào được nhắc vắng buổi trước')
  // Nhắc thì có, nhưng ô vẫn tích: sự thật do cô nhập, máy không đoán.
  const o = tr.locator('[role="dialog"] input[type="checkbox"]')
  for (let i = 0; i < (await o.count()); i++) {
    if (!(await o.nth(i).isChecked())) throw new Error('có ô bị bỏ tích sẵn')
  }
})

await kiem('bỏ tích một em → ô "có phép" mới hiện ra', async () => {
  const truoc = await tr.locator('[role="dialog"]').getByText('có phép').count()
  if (truoc !== 0) throw new Error('ô "có phép" hiện sẵn khi chưa bỏ tích ai')
  await tr.locator('[role="dialog"] input[type="checkbox"]').first().uncheck()
  const sau = await tr.locator('[role="dialog"]').getByText('có phép').count()
  if (sau !== 1) throw new Error(`sau khi bỏ tích có ${sau} ô "có phép"`)
})

await kiem('đếm đổi thành 17/18 · 1 vắng', async () => {
  const t = await tr.locator('[role="dialog"]').getByText('17/18 có mặt').first()
  if (!(await t.isVisible())) throw new Error('không thấy 17/18')
})

await kiem('nói thẳng luật nhắc 21:00 CHƯA bật', async () => {
  const t = await tr.locator('[role="dialog"]').getByText('chưa bật').first()
  if (!(await t.isVisible())) throw new Error('không nói gì về luật chưa chạy')
})

await kiem('lưu → xác nhận đúng buổi và đúng số đã lưu', async () => {
  await tr.locator('[role="dialog"] button', { hasText: 'Lưu điểm danh' }).click()
  const t = await tr.locator('[role="dialog"]').getByText(/Đã lưu buổi 32 · 17\/18 có mặt/).first()
  if (!(await t.isVisible())) throw new Error('không thấy câu xác nhận đúng')
})

await kiem('lưu xong thì tiêu đề chuyển sang buổi 33', async () => {
  const t = await tr.locator('[role="dialog"] h2').textContent()
  if (!t.includes('buổi 33')) throw new Error(`tiêu đề: ${t}`)
})

await kiem('Esc đóng ngăn', async () => {
  await tr.keyboard.press('Escape')
  if ((await tr.locator('[role="dialog"]').count()) !== 0) throw new Error('ngăn còn mở')
})

console.log('\n── Học viên: luật vắng 2 buổi liên tiếp (dữ liệu mẫu sạch) ──')
await moPhien()
await tr.goto(`${URL_GOC}/hoc-vien/`, { waitUntil: 'networkidle' })

await kiem('bảng hiện trạng thái "Vắng 2 buổi"', async () => {
  const t = tr.getByText('Vắng 2 buổi').first()
  if (!(await t.isVisible())) throw new Error('không em nào mang trạng thái Vắng 2 buổi')
})

await kiem('tab "Cần chú ý" gồm cả em vắng liên tiếp', async () => {
  await tr.locator('button', { hasText: 'Cần chú ý' }).first().click()
  const t = tr.getByText(/Vắng \d buổi liên tiếp/).first()
  if (!(await t.isVisible())) throw new Error('tab Cần chú ý không kể lý do vắng')
})

await kiem('ngăn hồ sơ hiện ô "buổi đi học" và cảnh báo vắng liên tiếp', async () => {
  await tr.locator('button', { hasText: 'Mở hồ sơ' }).first().click()
  await tr.waitForSelector('[role="dialog"]')
  const d = tr.locator('[role="dialog"]')
  if (!(await d.getByText('buổi đi học').first().isVisible())) throw new Error('không có ô buổi đi học')
  if (!(await d.getByText(/buổi liên tiếp/).first().isVisible())) throw new Error('không có cảnh báo')
  await tr.keyboard.press('Escape')
})

console.log('\n── Trợ giảng: mức `auto` nên điểm danh được ──')
await moPhien()
await tr.goto(`${URL_GOC}/lop-hoc/`, { waitUntil: 'networkidle' })
await doiVai('assistant')
await tr.goto(`${URL_GOC}/lop-hoc/`, { waitUntil: 'networkidle' })

await kiem('trợ giảng thấy nút Điểm danh bật', async () => {
  const n = tr.locator('button', { hasText: 'Điểm danh' }).first()
  if (await n.isDisabled()) throw new Error('trợ giảng bị tắt nút — mức auto phải cho ghi')
})

await kiem('trợ giảng LƯU ĐƯỢC, không bị chặn', async () => {
  await tr.locator('button', { hasText: 'Điểm danh' }).first().click()
  await tr.waitForSelector('[role="dialog"]')
  await tr.locator('[role="dialog"] input[type="checkbox"]').first().uncheck()
  await tr.locator('[role="dialog"] button', { hasText: 'Lưu điểm danh' }).click()
  const d = tr.locator('[role="dialog"]')
  if ((await d.getByText('Chỗ này chỉ cô làm được').count()) > 0) {
    throw new Error('trợ giảng bị chặn — sai, attendance.assistant = auto')
  }
  if (!(await d.getByText(/Đã lưu buổi/).first().isVisible())) throw new Error('không lưu được')
  await tr.keyboard.press('Escape')
})

console.log('\n── Học viên: không có đường vào điểm danh ──')
await moPhien()
await tr.goto(`${URL_GOC}/lop-hoc/`, { waitUntil: 'networkidle' })
await doiVai('student')
await tr.goto(`${URL_GOC}/lop-hoc/`, { waitUntil: 'networkidle' })

await kiem('em KHÔNG có nút điểm danh bật', async () => {
  const n = tr.locator('button', { hasText: 'Điểm danh' })
  for (let i = 0; i < (await n.count()); i++) {
    if (!(await n.nth(i).isDisabled())) throw new Error('em bấm điểm danh được')
  }
})

await kiem('màn Hôm nay của em hiện số buổi đi học của CHÍNH EM', async () => {
  await tr.goto(`${URL_GOC}/em/hom-nay/`, { waitUntil: 'networkidle' })
  const t = tr.getByText('buổi đi học').first()
  if (!(await t.isVisible())) throw new Error('không thấy ô buổi đi học')
  const so = await tr.locator('b', { hasText: /^\d+\/\d+$/ }).first().textContent()
  if (!so || so === '—') throw new Error('ô buổi đi học trống')
})

await kiem('không có lỗi JavaScript nào trên mọi màn đã đi qua', async () => {
  if (loiTrang.length > 0) throw new Error(loiTrang.slice(0, 3).join(' | '))
})

await tb.close()
may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong > 0 ? 1 : 0)
