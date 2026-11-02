/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 prepare.mjs 的基础能力与配置
 */
import { existsSync } from 'node:fs'

// 只为当前项目启用 hooks，避免安装时修改上层仓库配置。
if (existsSync('.git') && process.env.HUSKY !== '0') {
  const { default: install } = await import('husky')
  const error = install()
  if (error) throw new Error(error)
}
