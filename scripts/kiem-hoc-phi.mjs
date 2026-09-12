/**
 * Kiểm tin học phí trên bản tĩnh — bước 7 của vòng vận hành.
 *
 * Cách chạy:
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-hoc-phi.mjs /tmp/pages
 *
 * Ba bẫy đã biết từ hai file kiểm trước, đừng bỏ: mỗi phần một context mới (bước GHI làm sai
 * lệch bước ĐỌC đứng sau); đổi vai bằng CHÍNH NÚT của ứng dụng, không nhét localStorage; và
 * `getByText` khớp chuỗi con không phân biệt hoa thường nên đếm thẻ phải `exact: true`.
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
async function doiVai(v){const n={owner:'Cô',assistant:'Trợ giảng',student:'Học viên'}[v];await tr.locator('[aria-label="Đổi vai"] button',{hasText:n}).click();const ok=await tr.locator('[aria-label="Đổi vai"] button[aria-pressed="true"]').textContent();if(ok.trim()!==n)throw new Error(`đổi vai thất bại: ${ok}`)}

console.log('\n── Ba tin, ba chuyện khác nhau ──')
await moPhien()
await tr.goto(`${U}/hoc-phi/`,{waitUntil:'networkidle'})

await kiem('tab "Sắp đến hạn" có đúng 3 tin', async () => {
  const t = await tr.locator('button',{hasText:'Sắp đến hạn'}).first().textContent()
  if (!t.includes('3')) throw new Error(`tab đọc: ${t}`)
})

await kiem('ba nhãn tình trạng KHÁC nhau', async () => {
  for (const n of ['Tiến bộ','Đang buông','Vượt mục tiêu']) {
    if ((await tr.getByText(n, { exact: true }).count()) === 0) throw new Error(`thiếu nhãn ${n}`)
  }
})

await kiem('ba nội dung tin khác nhau hẳn, không phải một mẫu điền tên', async () => {
  const ps = await tr.locator('article p').allInnerTexts()
  if (ps.length < 3) throw new Error(`chỉ có ${ps.length} tin`)
  if (new Set(ps).size !== ps.length) throw new Error('có hai tin trùng nội dung')
})

await kiem('tin em ĐANG BUÔNG không nhắc học phí', async () => {
  const bai = tr.locator('article').filter({ hasText: 'Đang buông' })
  const t = await bai.locator('p').first().innerText()
  if (!t.includes('không nhắc học phí')) throw new Error('không nói rõ là không nhắc tiền')
  const conLai = t.replace('Cô không nhắc học phí', '')
  for (const c of ['gia hạn','đóng tiền','thanh toán']) {
    if (conLai.toLowerCase().includes(c)) throw new Error(`vẫn nhắc "${c}"`)
  }
})

await kiem('tin VƯỢT MỤC TIÊU đề nghị lên lớp, không gia hạn lớp cũ', async () => {
  const t = await tr.locator('article').filter({ hasText: 'Vượt mục tiêu' }).locator('p').first().innerText()
  if (!t.includes('không gia hạn lớp này')) throw new Error('không đề nghị bỏ gia hạn')
  if (!/7\.0\+/.test(t)) throw new Error('không nêu tên lớp mới')
})

await kiem('mỗi tin có dòng "vì sao gửi bây giờ"', async () => {
  const n = await tr.locator('article small').count()
  if (n < 3) throw new Error(`chỉ ${n} dòng vì sao`)
})

await kiem('nút ghi "Gửi 9:00", không ghi "Gửi"', async () => {
  if ((await tr.locator('button',{hasText:'Gửi 9:00'}).count()) !== 3) throw new Error('không đủ 3 nút Gửi 9:00')
})

console.log('\n── Cô sửa tin rồi gửi ──')
await kiem('bấm Sửa → hiện ô nhập, sửa được, lưu được', async () => {
  await tr.locator('article').first().locator('button',{hasText:'Sửa'}).click()
  const o = tr.locator('article').first().locator('textarea')
  if (!(await o.isVisible())) throw new Error('không hiện ô nhập')
  await o.fill('Cô viết lại tin này theo ý cô.')
  await tr.locator('article').first().locator('button',{hasText:'Lưu'}).click()
  const t = await tr.locator('article').first().locator('p').first().innerText()
  if (t !== 'Cô viết lại tin này theo ý cô.') throw new Error(`tin sau khi lưu: ${t}`)
})

await kiem('"Duyệt cả 3" → xếp lịch hết, hiện màn trống nói rõ việc tiếp theo', async () => {
  await tr.locator('button',{hasText:'Duyệt cả 3'}).click()
  const t = await tr.locator('body').innerText()
  if (!/Đã xếp lịch gửi cả 3 tin lúc 9:00/.test(t)) throw new Error('không xác nhận đã xếp lịch')
  if (!/sau 3 ngày mới nhắc lần hai/.test(t)) throw new Error('không nói việc tiếp theo')
})

console.log('\n── Trợ giảng: trần cứng ──')
await moPhien()
await tr.goto(`${U}/hoc-phi/`,{waitUntil:'networkidle'})
await doiVai('assistant')

await kiem('trợ giảng không thấy màn học phí, và màn nói RÕ vì sao', async () => {
  const t = await tr.locator('body').innerText()
  if (!/trần cứng/.test(t)) throw new Error('không nói vì sao bị chặn')
  if ((await tr.locator('button',{hasText:'Gửi 9:00'}).count()) > 0) throw new Error('trợ giảng thấy nút gửi')
})

console.log('\n── Em: chỉ học phí của mình ──')
await moPhien()
await tr.goto(`${U}/hoc-phi/`,{waitUntil:'networkidle'})
await doiVai('student')

await kiem('em không thấy học phí của lớp', async () => {
  const t = await tr.locator('body').innerText()
  if (!/chỉ thấy học phí của chính em/.test(t)) throw new Error('em vào được màn học phí của lớp')
})

await kiem('không có lỗi JavaScript nào', async () => {
  if (loiTrang.length) throw new Error(loiTrang.slice(0,3).join(' | '))
})

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong>0?1:0)
