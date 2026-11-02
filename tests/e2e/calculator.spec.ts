/*
 * @Author: Codex
 * @Date: 2026-10-30 16:29:51
 * @LastEditors: Codex
 * @LastEditTime: 2026-11-02 13:40:12
 * @Description: 验证多尺寸期权试算、市场策略切换、输入边界与本机草稿
 */
import { expect, test, type Page } from '@playwright/test'

/**
 * 通过真实的 Radix 选择菜单切换主题，覆盖弹层选项的交互。
 */
async function selectTheme(page: Page, label: string) {
  await page.getByRole('combobox', { name: '外观' }).click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

/**
 * 通过用户可操作的示例建立三十天试算，再固定日期让断言不依赖运行日。
 */
async function fillExample(page: Page) {
  await page.getByRole('button', { name: '试试示例' }).click()
  await page.getByLabel('开仓日期', { exact: true }).fill('2026-01-01')
  await page.getByLabel('到期日期', { exact: true }).fill('2026-01-31')
}

test('美股 Put 即时试算、主题与草稿持久化、清空输入', async ({ page }, testInfo) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBe(true)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('每一笔权利金，回报都清晰。')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await fillExample(page)
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('12.17%')
  await expect(page.getByText('USD 10,000.00', { exact: true })).toBeVisible()
  await page.getByLabel('本笔总费用（选填）', { exact: true }).fill('5')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('11.56%')

  await selectTheme(page, '深色')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('11.56%')
  await expect(page.getByLabel('本笔总费用（选填）')).toHaveValue('5')
  await selectTheme(page, '明亮')
  await expect(page.locator('html')).toHaveClass(/light/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('option-calculator.png'),
    fullPage: true,
    animations: 'disabled',
  })

  await page.getByRole('button', { name: '清空输入' }).click()
  await expect(page.getByLabel('标的代码', { exact: true })).toHaveValue('')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await page.reload()
  await expect(page.getByLabel('标的代码', { exact: true })).toHaveValue('')
  expect(await page.evaluate(() => localStorage.getItem('option-calculator:draft:v1'))).toBeNull()
})

test('港股必须填写合约股数，并按 HKD 和实际股数计算', async ({ page }) => {
  await page.goto('/')
  await fillExample(page)
  await page.getByRole('radio', { name: '港股 HKD' }).click()
  await expect(page.getByLabel('每张合约股数', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('行权价', { exact: true })).toHaveValue('')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await fillExample(page)
  await page.getByLabel('合约张数', { exact: true }).fill('2')
  await page.getByLabel('本笔总费用（选填）', { exact: true }).fill('10')
  await expect(page.getByText('HKD 100,000.00', { exact: true })).toBeVisible()
  await expect(page.getByText('HKD 990.00', { exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('12.05%')
  await page.reload()
  await expect(page.getByRole('radio', { name: '港股 HKD' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByLabel('每张合约股数', { exact: true })).toHaveValue('500')
})

test('备兑 Call 使用股票成本并单独显示行权亏损', async ({ page }) => {
  await page.goto('/')
  await fillExample(page)
  await page.getByRole('radio', { name: '卖 Call 持股备兑' }).click()
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await page.getByLabel('每股持仓成本', { exact: true }).fill('110')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('11.06%')
  await expect(page.getByText('USD 11,000.00', { exact: true })).toBeVisible()
  await expect(page.getByText('USD -900.00', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('每股持仓成本', { exact: true })).toHaveValue('110')
})

test('同日到期、无效日期、负收益和零权利金不会显示旧结果', async ({ page }) => {
  await page.goto('/')
  await fillExample(page)
  await page.getByLabel('到期日期', { exact: true }).fill('2026-01-01')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await expect(page.getByText('同日到期：仅展示本期收益，不折算年化。')).toBeVisible()
  await expect(page.getByText('1.00%', { exact: true })).toBeVisible()
  await page.getByLabel('到期日期', { exact: true }).fill('2025-12-31')
  await expect(page.getByText('到期日期不能早于开仓日期', { exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
  await page.getByLabel('到期日期', { exact: true }).fill('2026-01-31')
  await page.getByLabel('本笔总费用（选填）', { exact: true }).fill('150')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('-6.08%')
  await page.getByLabel('本笔总费用（选填）', { exact: true }).fill('')
  await page.getByLabel('每股权利金', { exact: true }).fill('0')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('0.00%')
  await page.getByLabel('每股权利金', { exact: true }).fill('-1')
  await expect(page.getByLabel('每股权利金', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
})

test('损坏草稿及无法保存时仍可试算', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('option-calculator:draft:v1', 'broken-json')
    Object.defineProperty(Storage.prototype, 'setItem', {
      value: () => {
        throw new DOMException('Storage full', 'QuotaExceededError')
      },
    })
  })
  await page.goto('/')
  await expect(page.getByLabel('标的代码', { exact: true })).toHaveValue('')
  await fillExample(page)
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('12.17%')
  await page.getByRole('button', { name: '清空输入' }).click()
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
})

test('中文日历支持主题、月份切换、选日、方向键、Escape 和焦点返回', async ({ page }, testInfo) => {
  await page.goto('/')
  await fillExample(page)
  const trigger = page.getByRole('button', { name: '选择到期日期', exact: true })
  const dialog = page.getByRole('dialog', { name: '到期日期日历', exact: true })

  for (const theme of ['深色', '明亮']) {
    await selectTheme(page, theme)
    await trigger.click()
    await expect(dialog).toBeVisible()
    const day = dialog.getByRole('button', { name: /2026年1月31日/ })
    await expect(day).toBeFocused()
    const bounds = await dialog.boundingBox()
    const dayBounds = await day.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    expect(dayBounds!.width).toBeGreaterThanOrEqual(44)
    expect(dayBounds!.height).toBeGreaterThanOrEqual(44)
    await page.screenshot({
      path: testInfo.outputPath(`calendar-${theme === '明亮' ? 'light' : 'dark'}.png`),
      animations: 'disabled',
    })
    await day.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  }

  await trigger.click()
  await dialog.getByRole('button', { name: '下个月', exact: true }).click()
  await dialog.getByRole('button', { name: /2026年2月15日/ }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.getByLabel('到期日期', { exact: true })).toHaveValue('2026-02-15')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('8.11%')
  await page.reload()
  await expect(page.getByLabel('到期日期', { exact: true })).toHaveValue('2026-02-15')

  await trigger.click()
  await dialog.getByRole('button', { name: /2026年2月15日/ }).press('ArrowRight')
  const nextDay = dialog.getByRole('button', { name: /2026年2月16日/ })
  await expect(nextDay).toBeFocused()
  await nextDay.press('Enter')
  await expect(page.getByLabel('到期日期', { exact: true })).toHaveValue('2026-02-16')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('7.93%')
  await expect(trigger).toBeFocused()
})

test('开仓日期可以从日历选择，手输不存在的日期会明确报错', async ({ page }) => {
  await page.goto('/')
  await fillExample(page)
  await page.getByRole('button', { name: '选择开仓日期', exact: true }).click()
  await page
    .getByRole('dialog', { name: '开仓日期日历', exact: true })
    .getByRole('button', { name: /2026年1月5日/ })
    .click()
  await expect(page.getByLabel('开仓日期', { exact: true })).toHaveValue('2026-01-05')
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('14.04%')
  await page.getByLabel('到期日期', { exact: true }).fill('2026-02-30')
  await expect(page.getByLabel('到期日期', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('请填写有效的到期日期', { exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: '权利金年化收益率' })).toHaveText('—')
})

test('互斥切换支持方向键，重复选择当前项不会清空策略', async ({ page }) => {
  await page.goto('/')
  const us = page.getByRole('radio', { name: '美股 USD' })
  const hk = page.getByRole('radio', { name: '港股 HKD' })
  await us.press('ArrowRight')
  await expect(hk).toBeFocused()
  await hk.press('Space')
  await expect(hk).toBeChecked()
  const put = page.getByRole('radio', { name: '卖 Put 现金担保' })
  await put.click()
  await expect(put).toBeChecked()
})
