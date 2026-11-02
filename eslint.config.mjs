/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:08:54
 * @Description: 定义 eslint.config.mjs 的基础能力与配置
 */
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig(
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ['src/app/**/*.{js,jsx,ts,tsx}', 'src/components/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/components/ui/**', '**/*.test.*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXOpeningElement[name.type="JSXIdentifier"][name.name=/^(button|input|select|textarea|label)$/]',
          message:
            '业务 UI 请使用 @/components/ui 中的基础组件；缺失时按 DESIGN.md 补齐。原生控件封装仅放在 src/components/ui。',
        },
        {
          selector:
            'JSXOpeningElement[name.name="Input"] > JSXAttribute[name.name="type"][value.value="date"]',
          message: '日期选择请使用 DatePicker（Popover + Calendar），避免回退为浏览器原生日历。',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
)
