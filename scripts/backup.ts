import 'dotenv/config'

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * تهیه نسخه پشتیبان از پایگاه‌داده با pg_dump
 *
 * استفاده:
 *   PG_DUMP_PATH=/usr/bin/pg_dump npm run backup
 *
 * متغیرها:
 *   PG_DUMP_PATH   مسیر اجرایی pg_dump (الزامی)
 *   DATABASE_URL   رشته اتصال (الزامی)
 *   BACKUP_DIR     پوشه‌ی مقصد (پیش‌فرض: backups)
 */

function fail(message: string): never {
  console.error(`backup: ${message}`)
  process.exit(1)
}

const pgDumpPath = process.env.PG_DUMP_PATH
const databaseUrl = process.env.DATABASE_URL

if (!pgDumpPath) {
  fail('متغیر PG_DUMP_PATH تنظیم نشده است')
}

if (!existsSync(pgDumpPath)) {
  fail(`فایل اجرایی pg_dump در مسیر «${pgDumpPath}» وجود ندارد`)
}

if (!databaseUrl) {
  fail('متغیر DATABASE_URL تنظیم نشده است')
}

const backupDir = process.env.BACKUP_DIR || 'backups'

try {
  mkdirSync(backupDir, { recursive: true })
} catch {
  fail(`ایجاد پوشه‌ی «${backupDir}» ناموفق بود`)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const output = path.join(backupDir, `stone-catalog-${stamp}.sql`)

console.log(`backup: writing ${output}`)

const child = spawn(
  pgDumpPath,
  [
    '--no-owner',
    '--no-acl',
    '--format=custom',
    `--file=${output}`,
    `--dbname=${databaseUrl}`,
  ],
  { stdio: 'inherit' }
)

child.on('error', (error) => fail(error.message))

child.on('exit', (code) => {
  if (code === 0) {
    console.log('backup: done')
    return
  }
  fail(`pg_dump با کد ${code} خارج شد`)
})
