/*
 * @Author: shadcn/ui
 * @Date: 2026-10-30 17:01:38
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:01:38
 * @Description: 基于 shadcn/ui input 适配项目 token 与 44px 交互目标
 * @Source: https://ui.shadcn.com/r/styles/new-york-v4/input.json
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 统一文本输入及错误样式。
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 min-h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
