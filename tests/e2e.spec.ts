import {test,expect} from '@playwright/test'
test('public site is accessible',async({page})=>{await page.goto(process.env.E2E_BASE_URL||'http://127.0.0.1:3000');await expect(page.locator('body')).toBeVisible()})
