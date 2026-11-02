/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 utils.ts 的基础能力与配置
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * @description 合并条件样式并保留最后声明的同类 Tailwind 样式
 * @param inputs 待合并的样式
 * @return 最终样式字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
