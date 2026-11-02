/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:08:54
 * @Description: 定义 playwright.config.ts 的基础能力与配置
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { viewport: { width: 834, height: 1112 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: [{ command: 'pnpm preview:e2e', url: 'http://127.0.0.1:3100', timeout: 180000 }],
})
