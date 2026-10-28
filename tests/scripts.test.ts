import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
) as { scripts: Record<string, string> }

/**
 * ماژول‌های سمت سرور (مثل src/lib/db.ts) از بسته‌ی server-only استفاده
 * می‌کنند. بدون شرط react-server، اجرای هر اسکریپتی که پایگاه‌داده را
 * import می‌کند بلافاصله با خطا متوقف می‌شود.
 */
const DB_SCRIPTS = ['admin:create', 'worker', 'media:migrate:blob']

describe('npm scripts', () => {
  it.each(DB_SCRIPTS)('%s runs tsx with the react-server condition', (name) => {
    const command = pkg.scripts[name]

    expect(command).toBeTruthy()
    expect(command).toContain('--conditions=react-server')
  })

  it('exposes the documented helper scripts', () => {
    for (const name of ['worker', 'backup', 'admin:create', 'test', 'test:e2e']) {
      expect(pkg.scripts[name]).toBeTruthy()
    }
  })
})

it('keeps migrations readable as UTF-8 and does not silently accept data loss', () => {
  const bytes = readFileSync(path.resolve(__dirname, '../prisma/migrations/00000000000000_initial_enterprise_schema/migration.sql'))
  expect(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes)).not.toThrow()
  expect(new TextDecoder().decode(bytes)).toContain('CREATE TABLE')
  expect(pkg.scripts['db:push']).not.toContain('--accept-data-loss')
})
