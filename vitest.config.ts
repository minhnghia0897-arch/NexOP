import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Khớp với paths trong tsconfig.json — nếu lệch thì test import được mà tsc thì không.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      /*
       * `server-only` là một gói cố ý ném lỗi khi bị nạp ngoài React Server Component.
       * Đó là việc của nó và không nên gỡ khỏi mã nguồn — nó chính là thứ chặn kho dữ
       * liệu lọt xuống trình duyệt. Ở đây trỏ sang một module rỗng để test node chạy
       * được logic, mà bản dựng thật vẫn giữ nguyên cửa chặn.
       */
      'server-only': fileURLToPath(new URL('tests/stub/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Test DB cùng dựng lại schema trên một cơ sở dữ liệu, nên chạy song song thì
    // tranh nhau ("schema public already exists"). Cả bộ chạy dưới một giây, đổi
    // sang tuần tự rẻ hơn nhiều so với việc mỗi file phải tự tách schema riêng.
    fileParallelism: false,
  },
})
