/**
 * Kiểm bản mẫu ĐỀ XUẤT của app học viên — `design/_reference/oblue-student-v2.html`.
 *
 *   node scripts/kiem-ban-mau-em-v2.mjs .
 *
 * Bản mẫu là HTML tĩnh đứng riêng, không qua Next, nên chạy thẳng từ gốc repo.
 *
 * Ba bẫy gặp ngay lần chạy đầu, đừng bỏ:
 *   1. `innerText` chỉ đọc màn ĐANG hiện — soi nhãn chú thích phải sang đúng màn có nhãn đó.
 *   2. Bản mẫu nạp phông từ Google Fonts; hộp chạy chặn mạng ngoài nên console đỏ vì
 *      `Failed to load resource`. Đó là môi trường, không phải lỗi trang.
 *   3. Đo tràn ngang phải quét CẢ TRANG, không chỉ `.screen.on` — chỗ tràn là thanh trên
 *      cùng (`.tb-right` 310px), nằm ngoài mọi màn.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '/tmp/node_modules/playwright-core/index.mjs'
const GOC=process.argv[2], CONG=8100
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json','.txt':'text/plain'}
const may=createServer(async(rq,rs)=>{try{let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=join(GOC,normalize(p));const n=await readFile(f);rs.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});rs.end(n)}catch{rs.writeHead(404);rs.end('404')}})
await new Promise(ok=>may.listen(CONG,ok))
const tb=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})
let dat=0,hong=0; const loi=[]
const c=await tb.newContext(); const tr=await c.newPage()
tr.on('pageerror',e=>loi.push(String(e)))
/* Bản mẫu nạp phông từ Google Fonts. Hộp chạy này chặn mạng ngoài nên console đỏ vì
   ERR_CONNECTION_RESET — đó là môi trường, không phải lỗi trang. Chỉ nhặt lỗi của TRANG. */
tr.on('console',m=>{const t=m.text();if(m.type()==='error' && !/Failed to load resource/.test(t))loi.push(t)})
async function kiem(t,f){try{await f();console.log('  ✓',t);dat++}catch(e){console.log('  ✗',t,'\n     →',String(e.message).split('\n')[0]);hong++}}

await tr.goto(`http://localhost:${CONG}/design/_reference/oblue-student-v2.html`,{waitUntil:'networkidle'})

await kiem('năm màn đổi được bằng rail', async()=>{
  for(const [s,tit] of [['vocab','Sổ từ của em'],['work','Bài của tôi'],['prog','Tiến độ'],['feed','Bảng tin lớp'],['today','Chào Minh Anh']]){
    await tr.locator(`[data-s="${s}"]`).first().click()
    await tr.waitForTimeout(120)
    const h = await tr.locator('.screen.on h1').innerText()
    if(h.trim()!==tit) throw new Error(`màn ${s} ra "${h}" chứ không phải "${tit}"`)
  }
})

await kiem('Sổ từ: lật thẻ → hiện chữ CÔ SỬA, rồi Đã nhớ sang thẻ sau', async()=>{
  await tr.locator('[data-s="vocab"]').first().click()
  const t1 = await tr.locator('.card .sent').innerText()
  if(!/make/.test(t1)) throw new Error('thẻ đầu không phải câu em viết sai')
  if(await tr.locator('#rv.on').count()) throw new Error('lộ đáp án trước khi bấm')
  await tr.locator('#xem').click()
  const sua = await tr.locator('#rv .fixline').innerText()
  if(!/makes/.test(sua)) throw new Error('không hiện chữ cô sửa')
  await tr.locator('#da').click()
  const t2 = await tr.locator('.card .sent').innerText()
  if(t2===t1) throw new Error('không sang thẻ mới')
})

await kiem('thẻ TÁI PHẠM nói rõ vì sao quay lại', async()=>{
  for(let k=0;k<3;k++){
    const co = await tr.locator('.again-box').count()
    if(co){ const t = await tr.locator('.again-box').innerText()
      if(!/quay lại/.test(t)) throw new Error('không giải thích')
      if(!/Bar chart/.test(t)) throw new Error('không nói tái phạm ở bài nào'); return }
    if(await tr.locator('#xem').count()){ await tr.locator('#xem').click(); await tr.locator('#da').click() }
  }
  throw new Error('không gặp thẻ tái phạm nào')
})

await kiem('hết thẻ → màn tổng kết, ôn lại được', async()=>{
  for(let k=0;k<4;k++){
    if(await tr.locator('#xem').count()){ await tr.locator('#xem').click(); await tr.locator('#da').click() } else break
  }
  const t = await tr.locator('.vdone').innerText()
  if(!/\/3/.test(t)) throw new Error('không có điểm tổng kết')
  await tr.locator('#lam-lai').click()
  if(!(await tr.locator('#xem').count())) throw new Error('ôn lại không quay về thẻ đầu')
})

await kiem('Bài của tôi: lọc 4 trạng thái ra đúng số dòng', async()=>{
  await tr.locator('[data-s="work"]').first().click()
  const dem = async () => (await tr.locator('#tbl .tr:visible').count())
  if(await dem() !== 7) throw new Error(`Tất cả ra ${await dem()} dòng, phải 7`)
  for(const [f,n] of [['todo',1],['writing',1],['wait',1],['done',4]]){
    await tr.locator(`[data-f="${f}"]`).click(); await tr.waitForTimeout(80)
    if(await dem() !== n) throw new Error(`lọc ${f} ra ${await dem()} dòng, phải ${n}`)
  }
})

await kiem('chú thích ẩn mặc định, bật lên thì hiện MỚI / KHÔNG LẤY / CẦN CÔ CHỐT', async()=>{
  if(await tr.locator('.nt:visible').count()) throw new Error('chú thích hiện sẵn — màn bị rối ngay khi mở')
  await tr.locator('#noteToggle').click()
  await tr.waitForTimeout(120)
  if(!(await tr.locator('.nt:visible').count())) throw new Error('bật mà không hiện')
  /* `innerText` chỉ đọc màn ĐANG hiện, nên phải sang đúng màn của từng nhãn. Lần đầu bài
     kiểm này đỏ vì đang đứng ở "Bài của tôi" — màn không có nhãn KHÔNG LẤY nào. */
  for(const [s,chu] of [['today','MỚI'],['today','KHÔNG LẤY'],['prog','CẦN CÔ CHỐT']]){
    await tr.locator('.rail [data-s="'+s+'"]').click(); await tr.waitForTimeout(100)
    const t = await tr.locator('.screen.on').innerText()
    if(!t.includes(chu)) throw new Error(`màn ${s} thiếu nhãn "${chu}"`)
  }
})

await kiem('không có "23 bạn đang làm" hay ảnh khoe điểm ở đâu cả', async()=>{
  const t = await tr.locator('body').innerText()
  for(const cam of ['bạn đang làm','ĐÃ ĐẠT BAND']){
    // Chỉ được xuất hiện trong CHÚ THÍCH giải thích vì sao không lấy, không phải trong giao diện.
    const trongNt = (await tr.locator('.nt').allInnerTexts()).join(' ')
    if(t.includes(cam) && !trongNt.includes(cam)) throw new Error(`"${cam}" nằm trong giao diện thật`)
  }
})

await kiem('dùng được ở 375px — tab đáy hiện, không tràn ngang', async()=>{
  await tr.setViewportSize({width:375,height:780})
  await tr.locator('[data-s="vocab"]').last().click()
  await tr.waitForTimeout(150)
  if(!(await tr.locator('.bottombar:visible').count())) throw new Error('không có tab đáy')
  const rong = await tr.evaluate(()=>document.documentElement.scrollWidth)
  if(rong > 380) throw new Error(`tràn ngang: ${rong}px`)
  await tr.setViewportSize({width:1440,height:900})
})

await kiem('trang hub liệt kê bản mới', async()=>{
  await tr.goto(`http://localhost:${CONG}/index.html`,{waitUntil:'networkidle'})
  const t = await tr.locator('body').innerText()
  if(!t.includes('Học viên · đề xuất')) throw new Error('hub chưa có mục mới')
})

await kiem('không có lỗi JavaScript nào', async()=>{ if(loi.length) throw new Error(loi.slice(0,2).join(' | ')) })

await tb.close(); may.close()
console.log(`\n${dat} đạt · ${hong} hỏng`)
process.exit(hong?1:0)
