/**
 * Dựng bản demo tĩnh cho GitHub Pages, xuất ra `demo/` ở gốc kho.
 *
 * Vì sao phải dựng từ bản sao chứ không xuất thẳng: `output: 'export'` của Next không chấp
 * nhận middleware, và cũng không chấp nhận trang nào gọi `headers()` — mà bản thật có cả
 * hai (middleware giải tên miền phụ, `/dang-nhap` đọc tên miền từ header). Cả hai đều là
 * thứ PHẢI giữ ở bản thật, nên không gỡ chúng khỏi kho; thay vào đó chép sang một thư mục
 * tạm chỉ gồm phần demo, rồi dựng ở đó.
 *
 * Hệ quả cố ý: bản tĩnh CHỈ có phần demo — app của cô và app của em. Màn đăng nhập và lời
 * mời không nằm trong đó, vì chúng cần máy chủ để có nghĩa.
 *
 *   node scripts/dung-ban-tinh.mjs
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const TAM = join(GOC, '.ban-tinh')
const RA = join(GOC, 'demo')

/** Đường dẫn con trên GitHub Pages: <user>.github.io/<repo>/demo */
const DUONG_CON = process.env.OBLUE_BASE_PATH ?? '/NexOP/demo'

function chep(tuong) {
  const tu = join(GOC, tuong)
  if (!existsSync(tu)) return
  cpSync(tu, join(TAM, tuong), { recursive: true })
}

rmSync(TAM, { recursive: true, force: true })
mkdirSync(TAM, { recursive: true })

// Phần dùng chung với bản thật — chép nguyên, không sửa. Đây là điều giữ cho bản tĩnh
// không trôi khỏi bản thật: cùng một `can()`, cùng một kho, cùng một bộ thành phần.
for (const t of [
  'components',
  'lib/auth',
  'lib/demo',
  'design',
  'docs/permissions.json',
  'app/globals.css',
  'app/icon.svg',
  'package.json',
  'pnpm-lock.yaml',
  'postcss.config.mjs',
  'tsconfig.json',
]) {
  chep(t)
}

// Hai khung demo — app của cô `(gv)` và app của em `(em)`. Giữ nguyên đường dẫn để link
// giữa hai bên (dải vai → "Mở app của em") vẫn đúng ở bản tĩnh.
mkdirSync(join(TAM, 'app'), { recursive: true })
for (const khung of ['app/(gv)', 'app/(em)']) {
  cpSync(join(GOC, khung), join(TAM, khung), { recursive: true })
}

// Layout gốc: y hệt bản thật, chỉ bỏ phần không dùng được ở bản tĩnh.
writeFileSync(join(TAM, 'app/layout.tsx'), readFileSync(join(GOC, 'app/layout.tsx'), 'utf8'))

// Trang chủ của bản tĩnh: chuyển thẳng vào Tổng quan.
writeFileSync(
  join(TAM, 'app/page.tsx'),
  `import { redirect } from 'next/navigation'

export default function TrangChu() {
  redirect('/tong-quan')
}
`,
)

writeFileSync(
  join(TAM, 'next.config.ts'),
  `import type { NextConfig } from 'next'

/** Sinh bởi scripts/dung-ban-tinh.mjs — không sửa tay. */
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '${DUONG_CON}',
  // GitHub Pages phục vụ thư mục, nên mỗi màn cần một index.html riêng.
  trailingSlash: true,
  images: { unoptimized: true },
  typedRoutes: true,
}

export default nextConfig
`,
)

console.log('Dựng bản tĩnh…')
execSync('npx next build', { cwd: TAM, stdio: 'inherit' })

rmSync(RA, { recursive: true, force: true })
cpSync(join(TAM, 'out'), RA, { recursive: true })

// Jekyll bỏ qua thư mục có gạch dưới. Chính lỗi này từng làm mọi tab 404 hồi tháng trước.
writeFileSync(join(RA, '.nojekyll'), '')

rmSync(TAM, { recursive: true, force: true })
console.log(`Xong: ${RA}`)
