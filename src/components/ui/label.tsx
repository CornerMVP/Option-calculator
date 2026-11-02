/*
 * @Author: shadcn/ui
 * @Date: 2026-10-30 17:01:38
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:01:38
 * @Description: 基于 shadcn/ui label 适配项目 token 与 44px 交互目标
 * @Source: https://ui.shadcn.com/r/styles/new-york-v4/label.json
 */
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label as LabelPrimitive } from 'radix-ui'

/**
 * 关联表单标签。
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
