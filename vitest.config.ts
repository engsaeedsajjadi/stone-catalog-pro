import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  test: {
    environment: 'node',
    // فقط فایل‌های test.ts را اجرا کن (نه spec.ts مربوط به Playwright)
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
