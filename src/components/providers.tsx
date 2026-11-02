/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 providers.tsx 的基础能力与配置
 */
'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

/**
 * @description 提供明亮、深色及系统主题，并持久化用户选择
 * @param props 页面内容
 * @return 具备主题上下文的页面内容
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
