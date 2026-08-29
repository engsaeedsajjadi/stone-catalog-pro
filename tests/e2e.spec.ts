import { expect, test } from '@playwright/test'

/**
 * تست‌های End-to-End (دودگرفتن)
 *
 * این تست‌ها به داده‌ی خاصی وابسته نیستند؛ فقط مطمئن می‌شوند که شِمای سایت
 * بالا می‌آید و مسیریابیِ داخلی (شامل دکمه‌ی برگشت مرورگر) کار می‌کند.
 *
 * اجرا:
 *   npm run test:e2e
 */

test('صفحه اصلی بالا می‌آید و راست‌به‌چپ است', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('کلیک روی آیتم منو آدرس را تغییر می‌دهد', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'کاتالوگ', exact: true }).first().click()

  await expect(page).toHaveURL(/route=catalog/)
})

test('دکمه‌ی برگشت مرورگر به صفحه اصلی برمی‌گردد', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'کاتالوگ', exact: true }).first().click()
  await expect(page).toHaveURL(/route=catalog/)

  await page.goBack()

  // آدرس به حالت اولیه برمی‌گردد و دوباره روی صفحه اصلی هستیم
  await expect(page).toHaveURL(/\/$|\/\?/)
  await expect(page.locator('footer')).toBeVisible()
})

test('فوتر در همه‌ی صفحات نمایش داده می‌شود', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('footer')).toBeVisible()
})
