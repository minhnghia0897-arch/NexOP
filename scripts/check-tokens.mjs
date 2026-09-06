#!/usr/bin/env node
/**
 * Luật cứng trong CLAUDE.md: không có hex màu ngoài design/tokens.css.
 *
 * Bỏ qua:
 *   design/tokens.css      — nguồn duy nhất, chỗ hex được phép nằm
 *   design/_reference/     — bản mẫu đã duyệt, là tài sản thiết kế chứ không phải mã nguồn
 *   *.md                   — tài liệu có trích giá trị token để giải thích
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'coverage', '_reference'])
const SCAN_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|html)$/
const ALLOW = new Set(['design/tokens.css'])
const HEX = /#[0-9a-fA-F]{3,8}\b/g

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out)
    } else if (SCAN_EXT.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const offenders = []
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file)
  if (ALLOW.has(rel)) continue
  for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
    for (const hit of line.match(HEX) ?? []) {
      offenders.push(`${rel}:${index + 1}  ${hit}  →  ${line.trim()}`)
    }
  }
}

if (offenders.length > 0) {
  console.error(`\nCó ${offenders.length} hex màu nằm ngoài design/tokens.css:\n`)
  for (const line of offenders) console.error('  ' + line)
  console.error('\nThêm token vào design/tokens.css rồi dùng var(--tên) thay vì viết hex.\n')
  process.exit(1)
}

console.log('Màu: không có hex nào ngoài design/tokens.css.')
