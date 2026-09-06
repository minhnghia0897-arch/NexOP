import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const tokens = readFileSync('design/tokens.css', 'utf8')
const globals = readFileSync('app/globals.css', 'utf8')

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
