/**
 * Ba vai trò theo `OBLUE_PHAN_QUYEN_3_VAI_TRO.md`, soi trên bản tĩnh.
 *
 *   node scripts/dung-ban-tinh.mjs
 *   mkdir -p /tmp/pages/NexOP && cp -r demo /tmp/pages/NexOP/demo
 *   node scripts/kiem-phan-quyen.mjs /tmp/pages
 *
 * Bẫy đã biết, đừng bỏ:
 *   1. Mỗi phần một context mới; đổi vai bằng CHÍNH NÚT của ứng dụng.
 *   2. `getByText` khớp chuỗi con không phân biệt hoa thường — đếm thẻ thì `exact: true`.
 *   3. Đừng khớp CHỮ khi kiểm được bằng SỐ, và đừng dò chuỗi trong CẢ TRANG khi nhắm được
 *      thẳng vào phần tử (lần thứ tư mới nhớ: "hạn 19:00" từng bị đọc thành đồng hồ).
 *   4. Đổi DỮ LIỆU phân công phải qua localStorage của kho, và kho chỉ lưu SAU lần ghi đầu —
 *      nên phải để ứng dụng ghi một lần trước, rồi mới sửa bản lưu.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'

const GOC = process.argv[2], CONG = 8097
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain','.woff2':'font/woff2','.ico':'image/x-icon' }
const may = createServer(async (rq,rs)=>{try{let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=join(GOC,normalize(p));const n=await readFile(f);rs.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});rs.end(n)}catch{rs.writeHead(404);rs.end('404')}})
await new Promise(ok=>may.listen(CONG,ok))
const U=`http://localhost:${CONG}/NexOP/demo`
const tb=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})

let dat=0,hong=0; const loiTrang=[]
async function kiem(t,f){try{await f();console.log('  ✓',t);dat++}catch(e){console.log('  ✗',t,'\n     →',String(e.message).split('\n')[0]);hong++}}
let tr
async function moPhien(){const c=await tb.newContext();tr=await c.newPage();tr.on('pageerror',e=>loiTrang.push(String(e)));tr.on('console',m=>{if(m.type()==='error')loiTrang.push(m.text())})}

/** Đổi vai bằng chính nút của ứng dụng — nhét localStorage thì kho chưa lưu, vai không đổi. */
async function doiVai(ten){
  /* `getByRole({name, exact})` từng hết giờ ở đây: nhãn nút là "Cô Thảo" nhưng vai đang chọn
     có `aria-pressed`, và Playwright vẫn tìm được — chỗ hỏng là khi ĐÃ ở vai đó thì không cần
     bấm. Bấm vào nút của vai hiện tại cũng an toàn, nên chỉ cần locator mềm hơn. */
  const nut = tr.locator('button', { hasText: new RegExp(`^${ten}$`) }).first()
  await nut.waitFor({ state: 'visible', timeout: 5000 })
  await nut.click()
  await tr.waitForTimeout(250)
}

/** Sửa phân công trợ giảng trong bản lưu của kho, rồi tải lại. */
async function phanCong(lopId){
  await tr.evaluate((lop)=>{
    const raw = localStorage.getItem('oblue-demo-v2')
    if (!raw) throw new Error('kho chưa lưu — phải để ứng dụng ghi một lần trước')
    const x = JSON.parse(raw)
    const tg = x.du.vai.assistant
    for (const l of x.du.lop) l.troGiangIds = l.id === lop ? [tg] : []
    localStorage.setItem('oblue-demo-v2', JSON.stringify(x))
  }, lopId)
  await tr.reload({waitUntil:'networkidle'})
}

console.log('\n── §A · phạm vi trợ giảng đi theo QUAN HỆ ──')
await moPhien()
await tr.goto(`${U}/lop-hoc/`,{waitUntil:'networkidle'})
await doiVai('Trợ giảng')

await kiem('mặc định: trợ giảng thấy đúng lớp được phân, không thấy lớp khác', async () => {
  const t = await tr.locator('main').innerText()
  if (!t.includes('IELTS 6.5')) throw new Error('không thấy lớp được phân')
  if (t.includes('IELTS 5.5')) throw new Error('thấy cả lớp KHÔNG được phân')
})

await kiem('dải vai nói ĐÚNG tên lớp được phân, không cắm sẵn', async () => {
  const t = await tr.locator('body').innerText()
  if (!/chỉ lớp IELTS 6\.5/.test(t)) throw new Error('dải vai không nêu lớp')
})

await kiem('cô phân sang lớp 5.5 → mọi màn đổi theo', async () => {
  await phanCong('lop-55')
  const t = await tr.locator('main').innerText()
  if (!t.includes('IELTS 5.5')) throw new Error('không thấy lớp mới')
  if (t.includes('IELTS 6.5')) throw new Error('vẫn còn lớp cũ — phạm vi cắm trong mã')
  const dai = await tr.locator('body').innerText()
  if (!/chỉ lớp IELTS 5\.5/.test(dai)) throw new Error('dải vai vẫn nói lớp cũ')
})

await kiem('màn Học viên cũng đổi theo — không còn bản sao thứ hai của quan hệ', async () => {
  await tr.goto(`${U}/hoc-vien/`,{waitUntil:'networkidle'})
  const t = await tr.locator('main').innerText()
  // Mười tám em lớp 6.5 có tên thật; em lớp 5.5 mang tiền tố riêng.
  if (t.includes('Nguyễn Minh Anh')) throw new Error('vẫn hiện học viên lớp cũ')
})

console.log('\n── §H luật 8 · chưa phân lớp thì NÓI LÝ DO ──')
await kiem('bỏ hết phân công → màn Lớp học giải thích, không trống trơn', async () => {
  await tr.goto(`${U}/lop-hoc/`,{waitUntil:'networkidle'})
  await phanCong('khong-lop-nao')
  const t = await tr.locator('main').innerText()
  if (!/Cô chưa phân lớp nào/.test(t)) throw new Error('không có lời giải thích')
  if (!/Cấu hình → Trợ giảng/.test(t)) throw new Error('không nói ai mở được và mở ở đâu')
  if (!/không phải lỗi phần mềm/.test(t)) throw new Error('không nói đây là hành vi đúng')
})

await kiem('màn Học viên cũng giải thích, không để trống', async () => {
  await tr.goto(`${U}/hoc-vien/`,{waitUntil:'networkidle'})
  const t = await tr.locator('main').innerText()
  if (!/Cô chưa phân lớp nào/.test(t)) throw new Error('không có lời giải thích')
})

console.log('\n── §B · giao diện và cửa chặn nói CÙNG một điều ──')
await moPhien()
await tr.goto(`${U}/hoc-phi/`,{waitUntil:'networkidle'})
await doiVai('Trợ giảng')

await kiem('học phí: trợ giảng bị chặn, và màn nói vì sao', async () => {
  const t = await tr.locator('main').innerText()
  if (/Sắp hết hạn|Đã đóng/.test(t)) throw new Error('trợ giảng đọc được bảng học phí')
})

await kiem('chấm bài: trợ giảng KHÔNG có tab Rubric của cô', async () => {
  await tr.goto(`${U}/cham-bai/`,{waitUntil:'networkidle'})
  await doiVai('Trợ giảng')
  if ((await tr.getByRole('button',{name:'Rubric của cô',exact:true}).count()) > 0) {
    throw new Error('tab rubric vẫn hiện — trần cứng bị hở ở tầng giao diện')
  }
})

await kiem('chấm bài: nút của trợ giảng là "Gửi cho cô duyệt", không phải "Gửi nhận xét"', async () => {
  const t = await tr.locator('main').innerText()
  if (!/Gửi cho cô duyệt/.test(t)) throw new Error('không thấy nút chuyển cho cô')
  if (/Gửi nhận xét/.test(t)) throw new Error('trợ giảng thấy nút gửi thẳng cho em')
})

/* Nhãn nút vai là "Cô", không phải "Cô Thảo" — lần thứ năm cùng một họ lỗi trong bộ kiểm này
   (khớp chữ đoán từ giao diện thay vì đọc đúng nhãn thật). */
await kiem('cô thì CÓ tab Rubric và nút gửi', async () => {
  await doiVai('Cô')
  if ((await tr.getByRole('button',{name:'Rubric của cô',exact:true}).count()) === 0) {
    throw new Error('cô mất tab rubric — hỏi quyền sai chiều')
  }
  const t = await tr.locator('main').innerText()
  if (!/Gửi nhận xét/.test(t)) throw new Error('cô mất nút gửi')
})

await kiem('lộ trình: trợ giảng bị chặn kèm lý do', async () => {
  await tr.goto(`${U}/lo-trinh/`,{waitUntil:'networkidle'})
  await doiVai('Trợ giảng')
  const t = await tr.locator('main').innerText()
  if (!/tài sản của cô/.test(t)) throw new Error('không nói vì sao chặn')
})

console.log('\n── bản lưu kiểu CŨ không được làm sập màn ──')
await moPhien()

await kiem('bản lưu thiếu trường mới trong dòng → về dữ liệu mẫu, KHÔNG trang trắng', async () => {
  /*
   * Đây là lỗi đã làm trang trắng trên bản thật, và nó lọt qua CẢ 112 bài kiểm trước đó vì
   * mọi bài kiểm mở context MỚI — không có bản lưu cũ. Người dùng thật thì luôn có: họ vào
   * demo hôm qua, mình thêm `Lop.troGiangIds` hôm nay, và hôm nay họ mở lại.
   *
   * Nên bài kiểm này phải TỰ TẠO bản lưu cũ: vào một lần cho kho ghi, rồi hạ hình dạng xuống.
   */
  await tr.goto(`${U}/tong-quan/`,{waitUntil:'networkidle'})
  await doiVai('Trợ giảng')

  const ha = await tr.evaluate(() => {
    const raw = localStorage.getItem('oblue-demo-v2')
    if (!raw) return false
    const x = JSON.parse(raw)
    for (const l of x.du.lop) delete l.troGiangIds
    for (const b of x.du.baiNop) delete b.moLuc
    localStorage.setItem('oblue-demo-v2', JSON.stringify(x))
    return true
  })
  if (!ha) throw new Error('kho chưa lưu — không dựng được bản lưu cũ để thử')

  loiTrang.length = 0
  await tr.goto(`${U}/lop-hoc/`,{waitUntil:'networkidle'})
  await tr.waitForTimeout(600)

  if (loiTrang.length) throw new Error(`màn sập: ${loiTrang[0]}`)
  const t = await tr.locator('main').innerText()
  if (!t.includes('Lớp học')) throw new Error('màn không vẽ được — trang trắng')
})

await kiem('và mọi màn khác cũng mở được với bản lưu cũ đó', async () => {
  for (const man of ['hoc-vien', 'cham-bai', 'hoc-phi', 'em/hom-nay', 'em/bai-cua-toi']) {
    loiTrang.length = 0
    await tr.goto(`${U}/${man}/`,{waitUntil:'networkidle'})
    await tr.waitForTimeout(300)
    if (loiTrang.length) throw new Error(`${man} sập: ${loiTrang[0]}`)
  }
})

console.log('\n── Nút "Học viên" phải MỞ app của em, không chỉ đổi mắt ──')
await moPhien()
await tr.goto(`${U}/tong-quan/`,{waitUntil:'networkidle'})

await kiem('bấm "Học viên" là sang app của em, không đứng lại ở màn của cô', async () => {
  /* Lỗi đã xảy ra thật: nút chỉ gọi `doiVaiXem` nên vai đổi mà màn không đổi. Người xem
     thấy Tổng quan của cô gần như trống và tưởng demo hỏng — đường vào app của em lúc đó
     chỉ là một liên kết chữ nhỏ cuối dải cam. */
  await doiVai('Học viên')
  await tr.waitForURL(/\/em\/hom-nay/, { timeout: 5000 })
  const h = await tr.locator('h1').first().innerText()
  if (!/Chào/.test(h)) throw new Error(`vào app của em rồi nhưng đầu màn là "${h}"`)
})

await kiem('"Về app của cô" đưa về CẢ màn lẫn vai', async () => {
  await tr.locator('a', { hasText: 'Về app của cô' }).click()
  await tr.waitForURL(/\/tong-quan/, { timeout: 5000 })
  /* Chỉ đổi màn mà giữ vai em thì Tổng quan hiện ra nhưng rỗng — hỏng lặng lẽ, khó đoán hơn
     cả lỗi cũ. Nên kiểm bằng chính nút đang được chọn, không kiểm bằng chữ trên màn. */
  const vai = await tr.locator('[aria-label="Đổi vai"] button[aria-pressed="true"]').textContent()
  if (vai.trim() !== 'Cô') throw new Error(`về màn của cô nhưng vai vẫn là "${vai.trim()}"`)
})

await kiem('không có lỗi JavaScript nào trên mọi màn đã đi qua', async () => {
  if (loiTrang.length) throw new Error(loiTrang.slice(0,3).join(' | '))
})

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong>0?1:0)
