import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts', // Next sinh ra, không sửa được
      // Bản mẫu đã duyệt là tài sản thiết kế, không phải mã nguồn.
      'design/_reference/**',
      'index.html',
      // Bản tĩnh do scripts/dung-ban-tinh.mjs sinh ra — soi nó là soi đầu ra của Next,
      // không phải soi mã mình viết.
      'demo/**',
      '.ban-tinh/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default config
