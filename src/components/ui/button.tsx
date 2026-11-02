/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:08:54
 * @Description: 定义 button.tsx 的基础能力与配置
 */
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-border bg-background text-foreground hover:bg-muted',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
      },
      size: {
        default: '',
        icon: 'size-11 min-w-11 rounded-md px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

/**
 * @description 渲染统一主按钮，支持 Radix Slot 组合及键盘焦点
 * @param props 原生按钮与变体属性
 * @return 基础按钮或透传到子元素的控件
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
