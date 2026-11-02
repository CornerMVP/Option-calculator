/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 lint-staged.config.mjs 的基础能力与配置
 */
const config = {
  '*': 'prettier --ignore-unknown --write',
  '*.{ts,tsx,mjs,cjs}': 'eslint --fix',
}

export default config
