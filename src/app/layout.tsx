/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 16:29:51
 * @Description: 定义 layout.tsx 的基础能力与配置
 */
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Option · 卖出期权收益计算器',
  description: '手动输入美股或港股期权参数，即时计算现金担保 Put 与备兑 Call 的权利金年化收益率。',
}

/**
 * @description 设置页面语言、主题容器与全局样式
 * @param props 页面内容
 * @return 根布局
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
