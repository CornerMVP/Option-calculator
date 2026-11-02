/*
 * @Author: Codex
 * @Date: 2026-10-30 17:00:00
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:08:54
 * @Description: 组合 shadcn/ui Input、Popover 与 Calendar，支持手输和中文日期选择
 */
'use client'

import { format, isValid, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { zhCN } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id: string
  name: string
  label: string
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
}

/**
 * 将完整 ISO 日期解析为本地日历日期，拒绝自动进位，避免 UTC 转换造成日期偏移。
 */
function parseDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = parseISO(value)
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : undefined
}

/**
 * 同一输入同时支持键盘手输与日历选择；选中或按 Escape 关闭后将焦点交还触发按钮。
 */
export function DatePicker({
  id,
  name,
  label,
  value,
  onValueChange,
  invalid,
  describedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex min-h-12 min-w-0 items-center rounded-md border border-input bg-background focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring',
            invalid && 'border-destructive',
          )}
        >
          <Input
            id={id}
            name={name}
            type="text"
            placeholder="YYYY-MM-DD"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            maxLength={10}
            autoComplete="off"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-11 min-h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-0.5 shrink-0"
              aria-label={`选择${label}`}
            >
              <CalendarIcon size={17} aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
        collisionPadding={12}
        aria-label={`${label}日历`}
      >
        <Calendar
          key={value}
          mode="single"
          locale={zhCN}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) onValueChange(format(date, 'yyyy-MM-dd'))
            setOpen(false)
          }}
          labels={{ labelPrevious: () => '上个月', labelNext: () => '下个月' }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
