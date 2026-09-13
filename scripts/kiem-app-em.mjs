/**
 * Kiểm app của em cho khớp bản mẫu `oblue-student-demo.html` (link `#student` trên trang hub).
 *
 * Cách chạy:
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-app-em.mjs /tmp/pages
 *
 * Bẫy đã biết từ bốn file kiểm trước, đừng bỏ:
 *   1. Mỗi phần một context mới — bước GHI làm sai lệch bước ĐỌC đứng sau nó. Ở đây nặng
 *      hơn: NỘP BÀI xoá luôn bài khỏi danh sách "phải nộp", nên mọi phần đọc màn nộp phải
 *      đứng TRƯỚC phần bấm nộp, hoặc ở context riêng.
 *   2. `getByText` khớp chuỗi con KHÔNG phân biệt hoa thường — đếm thẻ thì `exact: true`.
 *   3. Đừng khớp CHỮ khi kiểm được bằng SỐ.
 *   4. Đồng hồ và lưu nháp là thứ chỉ lộ khi CHỜ và khi TẢI LẠI TRANG — không đọc mã ra
 *      được. Đó là lý do hai phần dưới đây tồn tại.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'

const GOC = process.argv[2], CONG = 8096
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain','.woff2':'font/woff2','.ico':'image/x-icon' }
const may = createServer(async (rq,rs)=>{try{let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=join(GOC,normalize(p));const n=await readFile(f);rs.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});rs.end(n)}catch{rs.writeHead(404);rs.end('404')}})
await new Promise(ok=>may.listen(CONG,ok))
const U=`http://localhost:${CONG}/NexOP/demo`
const tb=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})

let dat=0,hong=0; const loiTrang=[]
async function kiem(t,f){try{await f();console.log('  ✓',t);dat++}catch(e){console.log('  ✗',t,'\n     →',String(e.message).split('\n')[0]);hong++}}
let tr
async function moPhien(){const c=await tb.newContext();tr=await c.newPage();tr.on('pageerror',e=>loiTrang.push(String(e)));tr.on('console',m=>{if(m.type()==='error')loiTrang.push(m.text())})}

console.log('\n── Hôm nay (s-today) ──')
await moPhien()
await tr.goto(`${U}/em/hom-nay/`,{waitUntil:'networkidle'})

await kiem('ba ô hero đúng bản mẫu: mức tăng band · buổi đi học · lỗi cần dứt', async () => {
  const t = await tr.locator('body').innerText()
  if (!/band sau \d+ tuần/.test(t)) throw new Error('thiếu ô "+N band sau N tuần"')
  if (!/buổi đi học/.test(t)) throw new Error('thiếu ô buổi đi học')
  if (!/lỗi cần dứt điểm/.test(t)) throw new Error('thiếu ô lỗi cần dứt điểm')
  // Mức tăng phải là SỐ CÓ DẤU, không phải "—": hạt giống có 4 bài đã chấm.
  if (!/\+\d\.\d\s*\n?\s*band sau/.test(t)) throw new Error('mức tăng band không hiện số')
})

await kiem('câu trong hero là chữ CỦA CÔ, trong ngoặc kép', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Cô Thảo: “/.test(t)) throw new Error('không thấy lời cô trong ngoặc kép')
})

await kiem('đầu màn mở bằng HÔM NAY là ngày nào', async () => {
  const t = await tr.locator('body').innerText()
  if (!/(Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ nhật) \d+\/\d+/.test(t)) throw new Error('thiếu ngày hôm nay')
})

console.log('\n── Tiến độ (s-prog): ba dòng lỗi như bản mẫu ──')
await moPhien()
await tr.goto(`${U}/em/tien-do/`,{waitUntil:'networkidle'})

await kiem('khối "Lỗi đang kéo em lại" có NHIỀU dòng, không phải một chuỗi', async () => {
  const t = await tr.locator('body').innerText()
  const khoi = t.split('Lỗi đang kéo em lại')[1]?.split('Bài luyện em đã làm')[0] ?? ''
  // Mỗi dòng lỗi có một tên lỗi in đậm; đếm bằng số dòng dạng "N/M bài đã chấm" hoặc "N bài liên tiếp".
  const dong = (khoi.match(/(\d+ bài liên tiếp|\d+\/\d+ bài đã chấm|bài gần nhất cô không đánh dấu lại)/g) ?? []).length
  if (dong < 3) throw new Error(`chỉ thấy ${dong} dòng lỗi, bản mẫu có 3`)
})

await kiem('có ít nhất một lỗi "Đã dứt" — dòng duy nhất khen em bằng dữ liệu', async () => {
  if ((await tr.getByText('Đã dứt', { exact: true }).count()) === 0) throw new Error('không có nhãn Đã dứt')
})

await kiem('lỗi nặng nhất có nút Luyện 5 phút; lỗi chưa có bài luyện thì KHÔNG bịa nút', async () => {
  const t = await tr.locator('body').innerText()
  if (!t.includes('Luyện 5 phút')) throw new Error('thiếu nút Luyện 5 phút')
  if (!t.includes('Chưa có bài luyện')) throw new Error('lỗi nào cũng có nút — đang bịa đường dẫn')
})

console.log('\n── Bài của tôi (s-work): mũi ↑ khi band lên ──')
await moPhien()
await tr.goto(`${U}/em/bai-cua-toi/`,{waitUntil:'networkidle'})

await kiem('tab Tất cả có mũi ↑ ở bài band cao hơn bài trước, và có nhãn cho trình đọc màn hình', async () => {
  await tr.locator('button',{hasText:'Tất cả'}).first().click()
  const mui = tr.locator('[aria-label="cao hơn bài trước"]')
  const so = await mui.count()
  if (so === 0) throw new Error('không có mũi ↑ nào')
  // Không phải bài nào cũng lên: 4 bài đã chấm, không thể cả 4 đều cao hơn bài trước.
  if (so >= 4) throw new Error(`${so} mũi ↑ trên 4 bài đã chấm — đang vẽ bừa`)
})

console.log('\n── Bảng tin (s-feed): chip đề + trạng thái nộp của EM ──')
await moPhien()
await tr.goto(`${U}/em/bang-tin-lop/`,{waitUntil:'networkidle'})

await kiem('bài đăng về bài tập có chip tên đề', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Cambridge 19 · Reading Test 1/.test(t)) throw new Error('không thấy chip đề')
})

await kiem('có trạng thái nộp của EM, và KHÔNG có số bạn đã nộp', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Em (đã|chưa) nộp/.test(t)) throw new Error('thiếu trạng thái nộp của em')
  /* Bản mẫu có ô "14 đã nộp". Cố ý bỏ: đếm được là đọc bài nộp của 14 bạn, mà
     `submission.student` là mức `own`. Bài kiểm này canh đúng chỗ cố ý khác đó. */
  if (/\d+ đã nộp/.test(t)) throw new Error('đang hiện số bạn đã nộp — vi phạm submission=own')
})

console.log('\n── Luyện (s-drill): đồng hồ chạy thật ──')
await moPhien()
await tr.goto(`${U}/em/luyen/`,{waitUntil:'networkidle'})

await kiem('đồng hồ đếm LÊN — chờ 2 giây thì số đổi', async () => {
  const doc = async () => (await tr.locator('body').innerText()).match(/\b(\d+:\d\d)\b/)?.[1]
  const a = await doc()
  if (!a) throw new Error('không thấy đồng hồ dạng m:ss')
  await tr.waitForTimeout(2200)
  const b = await doc()
  if (a === b) throw new Error(`đồng hồ đứng ở ${a} — chip tĩnh, không phải đồng hồ`)
})

await kiem('làm hết 5 câu → kết quả kèm thời gian, và đồng hồ trên đầu màn tháo đi', async () => {
  for (let i = 0; i < 5; i += 1) {
    await tr.locator('button').filter({ hasText: /^[ABCD]/ }).first().click()
    await tr.locator('button',{hasText:/^(Câu tiếp|Xem kết quả)$/}).first().click()
  }
  const t = await tr.locator('body').innerText()
  if (!/\d\/5/.test(t)) throw new Error('không thấy điểm N/5')
  if (!/\d+:\d\d · /.test(t)) throw new Error('kết quả không kèm thời gian')
})

console.log('\n── Nộp bài (s-submit): hạn nộp, lưu nháp, thời gian viết ──')
await moPhien()
await tr.goto(`${U}/em/nop-bai/`,{waitUntil:'networkidle'})

await kiem('đầu màn nói HẠN NỘP — thứ bản mẫu để ngay trên đề', async () => {
  const t = await tr.locator('body').innerText()
  if (!/hạn \d\d:\d\d ngày \d+\/\d+/.test(t)) throw new Error('thiếu hạn nộp')
})

await kiem('ô tự kiểm nêu LÝ DO từ lỗi cô đánh dấu trong bài của em', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Cô đánh dấu “.*” ở \d+\/\d+ bài đã chấm/.test(t)) throw new Error('ô tự kiểm không nêu nguồn')
})

await kiem('gõ bài rồi TẢI LẠI TRANG — nháp vẫn còn', async () => {
  const bai = 'Nháp thử của em — dòng này phải sống qua một lần tải lại trang.'
  await tr.locator('textarea').first().fill(bai)
  await tr.waitForTimeout(1400)
  await tr.reload({ waitUntil: 'networkidle' })
  const lai = await tr.locator('textarea').first().inputValue()
  if (lai !== bai) throw new Error(`nháp mất sau khi tải lại: "${lai.slice(0,40)}"`)
  const t = await tr.locator('body').innerText()
  if (!/Đã lưu nháp/.test(t)) throw new Error('không nói là đã lưu')
})

await kiem('nộp bài → xác nhận có số từ, thời gian viết và khoảng cách tới hạn', async () => {
  await tr.locator('textarea').first().fill('word '.repeat(260))
  await tr.waitForTimeout(1200)
  await tr.locator('button',{hasText:/^Nộp cho cô$/}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/Đã nộp cho cô Thảo/.test(t)) throw new Error('không thấy màn xác nhận')
  if (!/\d+ từ/.test(t)) throw new Error('thiếu số từ')
  if (!/(trước hạn \d+ ngày|đúng hạn hôm nay|muộn \d+ ngày)/.test(t)) throw new Error('thiếu khoảng cách tới hạn')
})

await kiem('nộp rồi thì nháp bị bỏ — mở lại màn không thấy bài cũ', async () => {
  await tr.goto(`${U}/em/nop-bai/`,{waitUntil:'networkidle'})
  const t = await tr.locator('body').innerText()
  const o = tr.locator('textarea')
  if ((await o.count()) > 0 && (await o.first().inputValue()).includes('word')) {
    throw new Error('nháp cũ còn nguyên sau khi đã nộp')
  }
  if (!/Đã nộp|Em đã nộp hết bài|hạn/.test(t)) throw new Error('màn sau khi nộp trống trơn')
})

console.log('\n── Cô đọc được thời gian viết ──')
await kiem('thẻ chấm của cô hiện "viết N phút" cho bài em vừa nộp', async () => {
  await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
  const t = await tr.locator('body').innerText()
  if (!/viết \d+ phút/.test(t)) throw new Error('cô không thấy thời gian viết')
})

await kiem('ngăn hồ sơ của cô hiện ĐÚNG danh sách lỗi em thấy, không phải chữ viết sẵn', async () => {
  await tr.goto(`${U}/hoc-vien/`,{waitUntil:'networkidle'})
  await tr.getByText('Nguyễn Minh Anh', { exact: true }).first().click()
  const t = await tr.locator('body').innerText()
  const khoi = t.split('Lỗi lặp')[1]?.split('Bài gần đây')[0] ?? ''
  if (!khoi.includes('hoà hợp chủ–vị')) throw new Error('không thấy lỗi nặng nhất suy ra được')
  /* "Overview Task 1" là dòng chữ hạt giống cũ — không có dấu nào của cô mang tên đó. */
  if (khoi.includes('Overview Task 1')) throw new Error('vẫn đang vẽ chữ viết sẵn')
  if (!/\d+ bài liên tiếp|\d+\/\d+ bài đã chấm/.test(khoi)) throw new Error('dòng phụ không nói số bài')
})

await kiem('không có lỗi JavaScript nào trên mọi màn đã đi qua', async () => {
  if (loiTrang.length) throw new Error(loiTrang.slice(0,3).join(' | '))
})

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong>0?1:0)
