import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const tokens = readFileSync('design/tokens.css', 'utf8')
const globals = readFileSync('app/globals.css', 'utf8')

const THU_MUC_BAN_MAU = 'design/_reference'

/** Dạng rút gọn ba ký tự và dạng đầy đủ sáu ký tự là một màu — trải ra trước khi so. */
function traiHex(hex: string): string {
  const h = hex.toLowerCase()
  return h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h
}

function timHex(css: string): string[] {
  return (css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map(traiHex)
}

/** Biến do next/font sinh lúc chạy, không nằm trong tokens.css. */
const FROM_NEXT_FONT = new Set(['--font-be-vietnam-pro', '--font-inter'])

function declared(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!))
}

function referenced(css: string): Set<string> {
  return new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]!))
}

describe('design tokens', () => {
  it('mọi var() trong globals.css đều có định nghĩa', () => {
    const known = new Set([...declared(tokens), ...declared(globals), ...FROM_NEXT_FONT])
    const missing = [...referenced(globals)].filter((name) => !known.has(name))

    // Gõ sai tên biến thì CSS im lặng bỏ qua và màu biến mất — bắt ở đây thay vì bắt bằng mắt.
    expect(missing).toEqual([])
  })

  it('tokens.css định nghĩa các token nền mà bố cục dựa vào', () => {
    const names = declared(tokens)
    for (const required of ['--primary', '--text', '--surface', '--border', '--rail', '--panel', '--topbar']) {
      expect(names).toContain(required)
    }
  })
})

describe('bản mẫu đã duyệt', () => {
  // design/DESIGN.md: bản mẫu thắng khi mâu thuẫn, và tokens.css là nguồn hex duy nhất.
  // Hai câu đó chỉ cùng đúng khi mọi màu trong bản mẫu đều có tên ở tokens.css.
  // Không có test này thì màu mới lặng lẽ vào bản mẫu và không ai dựng lại được
  // giao diện mà không viết hex.
  it('không màu nào trong bản mẫu thiếu tên trong tokens.css', () => {
    const daDatTen = new Set(timHex(tokens))

    const thieu = new Map<string, string[]>()
    for (const file of readdirSync(THU_MUC_BAN_MAU).filter((f) => f.endsWith('.html'))) {
      for (const hex of timHex(readFileSync(join(THU_MUC_BAN_MAU, file), 'utf8'))) {
        if (daDatTen.has(hex)) continue
        thieu.set(hex, [...(thieu.get(hex) ?? []), file])
      }
    }

    expect(Object.fromEntries(thieu)).toEqual({})
  })
})
