/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 next.config.ts 的基础能力与配置
 */
import type { NextConfig } from 'next'
import path from 'node:path'

const config: NextConfig = {
  agentRules: false,
  turbopack: { root: path.resolve(process.cwd(), '.') },
  output: 'export',
  images: { unoptimized: true },
}

export default config
