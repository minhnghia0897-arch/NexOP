/**
 * Kiểm bảng chốt điểm trắc nghiệm trên BẢN TĨNH ĐÃ DỰNG — bước 4 của vòng vận hành.
 *
 * Cách chạy:
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-trac-nghiem.mjs /tmp/pages
 *
 * Ba cái bẫy file này đã bắt được, đừng bỏ:
 *   1. Mỗi phần một context mới — bước GHI làm sai lệch bước ĐỌC đứng sau nó.
 *   2. Đổi vai bằng CHÍNH NÚT của ứng dụng, không nhét localStorage (kho chỉ ghi bản lưu sau
 *      lần ghi đầu, nên nhét vào là ghi ra bản thiếu `du` rồi bị bỏ — vai không đổi).
 *   3. `getByText` khớp chuỗi con KHÔNG phân biệt hoa thường: "Đã chốt" khớp luôn dòng tiến
 *      độ "17/18 bài đã chốt". Đếm thẻ nhãn thì phải `exact: true`.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
// playwright-core không nằm trong dependencies — đây là bài kiểm chạy tay, không chạy CI.
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'

const GOC = process.argv[2], CONG = 8097
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain','.woff2':'font/woff2','.ico':'image/x-icon' }
const may = createServer(async (rq,rs)=>{try{let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=join(GOC,normalize(p));const n=await readFile(f);rs.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});rs.end(n)}catch{rs.writeHead(404);rs.end('404')}})
await new Promise(ok=>may.listen(CONG,ok))
const U = `http://localhost:${CONG}/NexOP/demo`
const tb = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})

let dat=0, hong=0
const loiTrang=[]
async function kiem(ten,f){try{await f();console.log('  ✓',ten);dat++}catch(e){console.log('  ✗',ten,'\n     →',String(e.message).split('\n')[0]);hong++}}

let tr
async function moPhien(){
  const ctx = await tb.newContext()
  tr = await ctx.newPage()
  tr.on('pageerror',e=>loiTrang.push(String(e)))
  tr.on('console',m=>{if(m.type()==='error')loiTrang.push(m.text())})
}
async function doiVai(vai){
  const nhan = {owner:'Cô',assistant:'Trợ giảng',student:'Học viên'}[vai]
  await tr.locator('[aria-label="Đổi vai"] button',{hasText:nhan}).click()
  const ok = await tr.locator('[aria-label="Đổi vai"] button[aria-pressed="true"]').textContent()
  if (ok.trim()!==nhan) throw new Error(`đổi vai thất bại: ${ok}`)
}
const moTn = async () => {
  await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
  await tr.locator('button',{hasText:'Trắc nghiệm'}).first().click()
}

console.log('\n── Đường "Trắc nghiệm" ở màn Chấm bài ──')
await moPhien()
await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})

await kiem('có đường "Trắc nghiệm · máy chấm xong" với đúng 18 bài', async () => {
  const p = tr.locator('button',{hasText:'Trắc nghiệm · máy chấm xong'}).first()
  const t = await p.textContent()
  if (!t.includes('18')) throw new Error(`pill đọc: ${t}`)
})

await kiem('dòng phụ đầu màn nói cả hai nửa của bước 4', async () => {
  const t = await tr.locator('body').innerText()
  if (!/tự luận cần mắt cô/.test(t) || !/trắc nghiệm đã chấm xong/.test(t)) {
    throw new Error('không nói đủ hai nửa')
  }
})

console.log('\n── Bảng chốt điểm: bị chặn bởi MỘT câu thiếu đáp án ──')
await moTn()

await kiem('bảng 5 cột đúng bản mẫu', async () => {
  const t = await tr.locator('body').innerText()
  for (const c of ['Học viên','Điểm','Tin cậy','Sai ở đâu','Trạng thái']) {
    if (!t.includes(c)) throw new Error(`thiếu cột ${c}`)
  }
})

await kiem('18 dòng, tất cả đang "Xem lại 1 câu"', async () => {
  const n = await tr.getByText('Xem lại 1 câu').count()
  if (n !== 18) throw new Error(`có ${n} dòng cam, cần 18`)
})

await kiem('KHÔNG có nút chốt lô khi chưa có đáp án', async () => {
  if ((await tr.locator('button',{hasText:'Chốt '}).count()) > 0) {
    throw new Error('vẫn mở nút chốt dù đề thiếu đáp án')
  }
})

await kiem('nói rõ câu nào thiếu và bao nhiêu bài đang chờ vì nó', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Câu 12 chưa có đáp án — 18 bài đang chờ/.test(t)) throw new Error('không nêu tên câu + số bài')
})

await kiem('"Sai ở đâu" gọi TÊN lỗi, không chỉ đọc số câu', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Câu \d+(, \d+)* — [a-zà-ỹ]/.test(t)) throw new Error('cột Sai ở đâu không có tên lỗi')
})

await kiem('mẫu số là 19, không phải 20 — câu thiếu đáp án không tính là sai', async () => {
  const t = await tr.locator('body').innerText()
  if (!/\/19/.test(t)) throw new Error('không thấy mẫu số 19')
  if (/\/20/.test(t)) throw new Error('vẫn tính cả câu chưa có đáp án')
})

console.log('\n── Cô điền một đáp án → mở lô 17 bài ──')
await kiem('chọn đáp án rồi lưu', async () => {
  await tr.locator('button',{hasText:'will have finished'}).first().click()
  await tr.locator('button',{hasText:'Lưu đáp án'}).first().click()
})

await kiem('nút chốt xuất hiện và nói đúng con số: "Chốt 17 & mở 1"', async () => {
  const n = tr.locator('button',{hasText:'Chốt 17 & mở 1'}).first()
  if (!(await n.isVisible())) {
    throw new Error(`không thấy nút; body có: ${(await tr.locator('body').innerText()).match(/Chốt[^\n]*/)?.[0]}`)
  }
})

await kiem('mẫu số lên 20 sau khi có đáp án', async () => {
  const t = await tr.locator('body').innerText()
  if (!/\/20/.test(t)) throw new Error('mẫu số chưa lên 20')
})

await kiem('còn đúng 1 dòng cam, và đó là dòng điểm thấp', async () => {
  if ((await tr.getByText('Cần chú ý').count()) !== 1) throw new Error('số dòng cam không phải 1')
  if ((await tr.getByText('Xem lại 1 câu').count()) !== 0) throw new Error('vẫn còn dòng chờ đáp án')
})

await kiem('cô bấm chốt → 17 em nhận điểm, dòng đã chốt VẪN còn trong bảng', async () => {
  await tr.locator('button',{hasText:'Chốt 17 & mở 1'}).first().click()
  const t = await tr.locator('body').innerText()
  if (!/Đã gửi điểm cho 17 em/.test(t)) throw new Error('không xác nhận số em đã gửi')
  /* `getByText('Đã chốt')` khớp CHUỖI CON không phân biệt hoa thường, nên nó khớp luôn
     dòng tiến độ "17/18 bài đã chốt" → đếm ra 18. `exact: true` chỉ lấy thẻ nhãn. */
  const n = await tr.getByText('Đã chốt', { exact: true }).count()
  if (n !== 17) throw new Error(`thẻ "Đã chốt": ${n}, cần 17`)
  if ((await tr.getByText('Cần chú ý').count()) !== 1) throw new Error('dòng cam biến mất')
})

console.log('\n── Em: điểm của mình, không thấy bảng cả lớp ──')
await moPhien()
await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
await doiVai('student')

await kiem('em KHÔNG thấy màn chấm bài', async () => {
  const t = await tr.locator('body').innerText()
  if (!/Em không thấy màn này/.test(t)) throw new Error('em vào được màn chấm bài')
})

console.log('\n── Trợ giảng: thấy bảng, KHÔNG chốt được ──')
await moPhien()
await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
await doiVai('assistant')
await tr.locator('button',{hasText:'Trắc nghiệm'}).first().click()

await kiem('trợ giảng ĐỌC được bảng (mức read cho draft)', async () => {
  if ((await tr.getByText('Tin cậy').count()) === 0) throw new Error('trợ giảng không thấy bảng')
})

await kiem('trợ giảng KHÔNG có nút chốt nào — review.send chỉ của cô', async () => {
  for (const s of ['Chốt ','Lưu đáp án']) {
    if ((await tr.locator('button',{hasText:s}).count()) > 0) {
      throw new Error(`trợ giảng thấy nút "${s}"`)
    }
  }
})

console.log('\n── Công tắc chot-mcq ──')
await moPhien()
await tr.goto(`${U}/cau-hinh/`,{waitUntil:'networkidle'})

await kiem('tắt công tắc "Chốt điểm trắc nghiệm" → không còn lô nào', async () => {
  // Màn Cấu hình mở ở tab "Vòng vận hành tuần"; công tắc nằm ở tab "Luật của cô".
  await tr.locator('button', { hasText: 'Luật của cô' }).first().click()
  /* Công tắc giờ mang `aria-label` là TÊN LUẬT, nên nhắm được thẳng.
     Trước đây nhãn chỉ ghi "đang bật" cho cả năm công tắc — viết bài kiểm này mới lộ ra,
     và đó cũng là lỗi trợ năng thật: trình đọc màn hình đọc năm lần một câu giống nhau. */
  await tr.locator('[role="switch"][aria-label^="Chốt điểm trắc nghiệm"]').click()
  await moTn()
  const t = await tr.locator('body').innerText()
  if (/Chốt 1?\d & mở/.test(t)) throw new Error('tắt công tắc mà vẫn còn lô chốt')
  if ((await tr.getByText('Cần chú ý').count()) !== 18) {
    throw new Error(`cần 18 dòng cô xem tay, có ${await tr.getByText('Cần chú ý').count()}`)
  }
})

await kiem('không có lỗi JavaScript nào', async () => {
  if (loiTrang.length) throw new Error(loiTrang.slice(0,3).join(' | '))
})

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong>0?1:0)
