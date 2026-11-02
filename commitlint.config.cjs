/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 commitlint.config.cjs 的基础能力与配置
 */
const types = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'chore',
  'revert',
  'enhance',
  'release',
]

module.exports = {
  extends: ['@commitlint/config-conventional'],
  defaultIgnores: false,
  plugins: [
    {
      rules: {
        'scope-allowed': ({ scope }) => [
          new RegExp('^(web|repo)(?:/[a-z0-9-]+)*$').test(scope ?? ''),
          'scope 必须属于 web、repo，可附加 /子模块',
        ],
        'subject-chinese': ({ subject }) => [
          /[\u3400-\u9fff]/.test(subject ?? ''),
          '说明必须包含中文',
        ],
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', types],
    'scope-empty': [2, 'never'],
    'scope-case': [0],
    'subject-case': [0],
    'header-max-length': [2, 'always', 88],
    'scope-allowed': [2, 'always'],
    'subject-chinese': [2, 'always'],
  },
}
