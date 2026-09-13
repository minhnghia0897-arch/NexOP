/**
 * Kiểm sáu chỗ vừa dựng cho khớp bản mẫu `oblue-platform-demo.html`.
 *
 * Cách chạy:
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-theo-ban-mau.mjs /tmp/pages
 *
 * Bốn bẫy đã biết từ ba file kiểm trước, đừng bỏ:
 *   1. Mỗi phần một context mới — bước GHI làm sai lệch bước ĐỌC đứng sau nó.
 *   2. Đổi vai bằng CHÍNH NÚT của ứng dụng, không nhét localStorage.
 *   3. `getByText` khớp chuỗi con KHÔNG phân biệt hoa thường — đếm thẻ phải `exact: true`.
 *   4. Đừng khớp CHỮ khi kiểm được bằng SỐ. Bài kiểm "không giao cả lớp" từng đỏ oan vì nó
 *      bắt chuỗi "cả lớp" trong đúng câu nói "KHÔNG giao cả lớp"; nay so số em với sĩ số.
 *
 * Và nhật ký RỖNG lúc mở màn, nên phần lọc nhật ký phải SINH sự kiện trước — không thì bộ
 * lọc nào cũng 0/0 và bài kiểm xanh giả.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
// playwright-core không nằm trong dependencies — bài kiểm chạy tay, không chạy CI.
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'

const GOC = process.argv[2], CONG = 8095
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain','.woff2':'font/woff2','.ico':'image/x-icon' }
const may = createServer(async (rq,rs)=>{try{let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=join(GOC,normalize(p));const n=await readFile(f);rs.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});rs.end(n)}catch{rs.writeHead(404);rs.end('404')}})
await new Promise(ok=>may.listen(CONG,ok))
const U=`http://localhost:${CONG}/NexOP/demo`
const tb=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})

let dat=0,hong=0; const loiTrang=[]
async function kiem(t,f){try{await f();console.log('  ✓',t);dat++}catch(e){console.log('  ✗',t,'\n     →',String(e.message).split('\n')[0]);hong++}}
let tr
async function moPhien(){const c=await tb.newContext();tr=await c.newPage();tr.on('pageerror',e=>loiTrang.push(String(e)));tr.on('console',m=>{if(m.type()==='error')loiTrang.push(m.text())})}

console.log('\n── Chấm bài: 3 tab như bản mẫu (g1/g2/g3) ──')
await moPhien()
await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})

await kiem('có đủ 3 tab: Chờ duyệt · Cả lớp sai chung ở đâu · Rubric của cô', async () => {
  for (const t of ['Chờ duyệt','Cả lớp sai chung ở đâu','Rubric của cô']) {
    if ((await tr.locator('button',{hasText:t}).count()) === 0) throw new Error(`thiếu tab ${t}`)
  }
})

await kiem('tab bước 6 đếm theo SỐ EM và nêu mẫu số bài đã chấm', async () => {
  await tr.locator('button',{hasText:'Cả lớp sai chung ở đâu'}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/\d+\/7 em/.test(t)) throw new Error('không thấy dạng "N/7 em"')
  if (!/Gộp lỗi của 7 bài đã chấm/.test(t)) throw new Error('không nêu mẫu số là bài đã chấm')
})

await kiem('mỗi lỗi có nút "Tạo bài luyện"', async () => {
  if ((await tr.locator('button',{hasText:'Tạo bài luyện'}).count()) < 3) throw new Error('thiếu nút')
})

await kiem('bấm Tạo bài luyện → nói rõ giao cho MẤY EM, không nói "cả lớp"', async () => {
  await tr.locator('button',{hasText:'Tạo bài luyện'}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/Đã giao bài luyện .* cho \d+ em/.test(t)) throw new Error('không xác nhận số em')
  /* Bắt chuỗi "cả lớp" là sai: câu xác nhận có chữ đó trong "KHÔNG giao cả lớp". Kiểm đúng
     thứ cần kiểm — số em đã giao phải nhỏ hơn sĩ số lớp. */
  const so = Number(t.match(/Đã giao bài luyện .* cho (\d+) em/)[1])
  if (so >= 18) throw new Error(`giao cho ${so} em — bằng cả sĩ số lớp`)
})

await kiem('tab Rubric: 4 tiêu chí, tổng 100%, và câu "không mang sang được nơi khác"', async () => {
  await tr.locator('button',{hasText:'Rubric của cô'}).first().click()
  const t = await tr.locator('body').innerText()
  for (const c of ['Task Response','Coherence & Cohesion','Lexical Resource','Grammatical Range']) {
    if (!t.includes(c)) throw new Error(`thiếu tiêu chí ${c}`)
  }
  if (!/vì nó là cô/.test(t)) throw new Error('thiếu câu chốt của bản mẫu')
  if ((await tr.getByText('25%', { exact: true }).count()) !== 4) throw new Error('không phải 4 ô 25%')
})

await kiem('sửa trọng số → cảnh báo tổng khác 100%, KHÔNG tự chia lại hộ cô', async () => {
  await tr.locator('button',{hasText:'Sửa'}).first().click()
  await tr.locator('input[type="number"]').first().fill('40')
  await tr.locator('button',{hasText:'Lưu'}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/Tổng đang là 115%/.test(t)) throw new Error(`không cảnh báo tổng; body: ${t.match(/Tổng[^\n]*/)?.[0]}`)
  if (!/máy không tự chia lại hộ cô/.test(t)) throw new Error('không nói rõ vì sao không tự chỉnh')
})

await kiem('"Cách cô hay nhận xét": bỏ được một dòng', async () => {
  const truoc = await tr.locator('button[aria-label^="Bỏ:"]').count()
  if (truoc === 0) throw new Error('không có dòng giọng chấm nào')
  await tr.locator('button[aria-label^="Bỏ:"]').first().click()
  if ((await tr.locator('button[aria-label^="Bỏ:"]').count()) !== truoc - 1) throw new Error('không bỏ được')
})

console.log('\n── Chấm bài: điểm mạnh KHÔNG nằm dưới "Lỗi cần sửa" ──')
await moPhien()
await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})

await kiem('có tiêu đề riêng "Điểm mạnh — giữ cách viết này"', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Điểm mạnh — giữ cách viết này/.test(t)) throw new Error('không tách điểm mạnh ra')
})

await kiem('câu được khen KHÔNG bị gạch ngang', async () => {
  const q = tr.locator('q')
  if ((await q.count()) === 0) throw new Error('không thấy câu khen dạng <q>')
  // Câu khen nằm trong <q>, không nằm trong <s>.
  const trongS = await tr.locator('s', { hasText: 'Consider first what service' }).count()
  if (trongS > 0) throw new Error('câu khen vẫn bị gạch ngang')
})

console.log('\n── Lộ trình: tab từng lộ trình + bảng chặng 4 cột ──')
await moPhien()
await tr.goto(`${U}/lo-trinh/`,{waitUntil:'networkidle'})

await kiem('có tab cho từng lộ trình', async () => {
  for (const t of ['IELTS 6.5','IELTS 5.5','Writing 8 tuần','IELTS 7.0']) {
    if ((await tr.locator('button',{hasText:t}).count()) === 0) throw new Error(`thiếu tab ${t}`)
  }
})

await kiem('bảng chặng 4 cột: Buổi · Nội dung · Bài về nhà · Kiểm tra', async () => {
  const t = await tr.locator('body').innerText()
  for (const c of ['Buổi','Nội dung','Bài về nhà','Kiểm tra']) {
    if (!t.includes(c)) throw new Error(`thiếu cột ${c}`)
  }
  if (!/21–28/.test(t)) throw new Error('không thấy chặng dạng "21–28"')
})

await kiem('4 ô KPI, và ô "đạt mục tiêu" có số vì lộ trình này CÓ khoá đã xong', async () => {
  const t = await tr.locator('body').innerText()
  for (const c of ['Đang dùng cho','Học viên đạt mục tiêu','Chặng khó nhất','Đề dùng được']) {
    if (!t.includes(c)) throw new Error(`thiếu ô ${c}`)
  }
  if (!/71%/.test(t)) throw new Error('không thấy 71% của 3 khoá đã kết thúc')
})

await kiem('lộ trình CHƯA khoá nào xong thì ô đạt mục tiêu là "—", không bịa số', async () => {
  await tr.locator('button',{hasText:'Speaking club'}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/chưa khoá nào kết thúc/.test(t)) throw new Error('không nói rõ là chưa có dữ liệu')
})

console.log('\n── Học phí: tab Tăng trưởng ──')
await moPhien()
await tr.goto(`${U}/hoc-phi/`,{waitUntil:'networkidle'})
await tr.locator('button',{hasText:'Tăng trưởng'}).first().click()

await kiem('phễu + thang 6 bước, và nói rõ chỗ rò', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Đường học viên đi qua lớp cô/.test(t)) throw new Error('thiếu phễu')
  if (!/Lớp cô đang ở bước nào/.test(t)) throw new Error('thiếu thang bước')
  if (!/Chỗ rò là/.test(t)) throw new Error('không nêu chỗ rò')
})

await kiem('hai bước phễu chưa có dữ liệu thì hiện "—", không bịa số', async () => {
  const t = await tr.locator('body').innerText()
  if (!/hỏi thử/.test(t) || !/học thử/.test(t)) throw new Error('thiếu hai bước đầu')
  if (/\+7/.test(t)) throw new Error('vẫn cắm số +7 của bản mẫu')
})

await kiem('thang bước nói đúng lớp đang ở bước 4 (tài khoản học viên)', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Đang ở đây/.test(t)) throw new Error('không đánh dấu bước đang ở')
  if (!/Tài khoản học viên/.test(t)) throw new Error('thiếu bước 4')
})

console.log('\n── Cấu hình: mỗi vai thấy gì (suy từ can()) ──')
await moPhien()
await tr.goto(`${U}/cau-hinh/`,{waitUntil:'networkidle'})
await tr.locator('button',{hasText:'Quyền'}).first().click()

await kiem('khối "Cùng một bài nộp — mỗi vai thấy gì" có 5 vai', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Cùng một bài nộp/.test(t)) throw new Error('thiếu khối')
  for (const v of ['Cô Thảo','Trợ giảng','Minh Anh (chủ bài)','Thu Hà (bạn cùng lớp)','Phụ huynh Minh Anh']) {
    if (!t.includes(v)) throw new Error(`thiếu vai ${v}`)
  }
})

await kiem('cô thấy 8/8 trường', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Cô Thảo thấy 8\/8 trường/.test(t)) throw new Error(`không phải 8/8: ${t.match(/thấy \d\/\d trường/)?.[0]}`)
})

await kiem('trợ giảng KHÔNG thấy ghi chú của cô và học phí — trần cứng', async () => {
  await tr.locator('button',{hasText:'Trợ giảng'}).last().click()
  const t = await tr.locator('body').innerText()
  if (!/thấy 6\/8 trường/.test(t)) throw new Error(`trợ giảng: ${t.match(/thấy \d\/\d trường/)?.[0]}`)
  if (!/trần cứng/.test(t)) throw new Error('không nói vì sao bị chặn')
})

await kiem('bạn cùng lớp thấy 0/8 — không thấy gì của bài này', async () => {
  await tr.locator('button',{hasText:'Thu Hà (bạn cùng lớp)'}).click()
  const t = await tr.locator('body').innerText()
  if (!/thấy 0\/8 trường/.test(t)) throw new Error(`bạn cùng lớp: ${t.match(/thấy \d\/\d trường/)?.[0]}`)
})

await kiem('mỗi dòng hiện đúng câu hỏi can() nó vừa hỏi', async () => {
  const t = await tr.locator('body').innerText()
  for (const o of ['submission.view','draft.view','teacher_notes.view','gradebook.view','fee.view']) {
    if (!t.includes(o)) throw new Error(`thiếu ${o}`)
  }
})

console.log('\n── Cấu hình: lọc nhật ký theo vai ──')
await tr.locator('button',{hasText:'Nhật ký hành vi'}).first().click()

await kiem('có 5 bộ lọc bản mẫu', async () => {
  for (const f of ['Tất cả','Cô','Học viên','Máy','Dính tới tiền']) {
    if ((await tr.locator('button',{hasText:f}).count()) === 0) throw new Error(`thiếu lọc ${f}`)
  }
})

await kiem('nhật ký RỖNG thì nói "chưa có dòng nào", không nói "không khớp bộ lọc"', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Chưa có dòng nào/.test(t)) throw new Error('nói sai ca nhật ký rỗng')
})

await kiem('lọc "Máy" thì danh sách ngắn lại thật', async () => {
  /* Nhật ký rỗng lúc mở màn — phải SINH sự kiện trước, không thì bộ lọc nào cũng 0/0 và bài
     kiểm xanh giả. Gửi một nhận xét ở màn Chấm bài là sinh ra cả dòng của cô lẫn của máy. */
  await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
  await tr.locator('button',{hasText:'Gửi nhận xét'}).first().click()
  await tr.goto(`${U}/cau-hinh/`,{waitUntil:'networkidle'})
  await tr.locator('button',{hasText:'Nhật ký hành vi'}).first().click()

  const tatCa = (await tr.locator('body').innerText()).match(/Nhật ký · (\d+)\/(\d+)/)
  if (!tatCa) throw new Error('không đọc được số dòng')
  if (Number(tatCa[2]) === 0) throw new Error('vẫn chưa sinh được sự kiện nào')
  await tr.locator('button',{hasText:'Máy'}).first().click()
  const sau = (await tr.locator('body').innerText()).match(/Nhật ký · (\d+)\/(\d+)/)
  if (!sau) throw new Error('không đọc được số dòng sau khi lọc')
  if (Number(sau[1]) >= Number(tatCa[1])) throw new Error(`lọc không thu hẹp: ${tatCa[0]} → ${sau[0]}`)
})

console.log('\n── Tổng quan: khối "Việc đã tự chạy tuần này" ──')
await moPhien()
await tr.goto(`${U}/tong-quan/`,{waitUntil:'networkidle'})

await kiem('có khối, và nói "chỉ để cô biết"', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Việc đã tự chạy tuần này/.test(t)) throw new Error('thiếu khối')
  if (!/Không cần cô làm — chỉ để cô biết/.test(t)) throw new Error('thiếu dòng phụ bản mẫu')
})

await kiem('mỗi dòng mang CON SỐ đếm từ dữ liệu', async () => {
  const t = await tr.locator('body').innerText()
  const khoi = t.split('Việc đã tự chạy tuần này')[1]?.slice(0, 700) ?? ''
  if (!/Nhắc lịch và hạn nộp cho \d+ học viên/.test(khoi)) throw new Error('dòng nhắc thiếu số')
  if (!/Số hoá \d+ đề/.test(khoi)) throw new Error('dòng số hoá thiếu số')
  if (!/Đăng \d+ bài giao/.test(khoi)) throw new Error('dòng đăng bài thiếu số')
})

await kiem('không có lỗi JavaScript nào trên mọi màn đã đi qua', async () => {
  if (loiTrang.length) throw new Error(loiTrang.slice(0,3).join(' | '))
})

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong>0?1:0)
