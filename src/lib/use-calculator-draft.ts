/*
 * @Author: Codex
 * @Date: 2026-10-30 16:29:51
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 16:29:51
 * @Description: 订阅本机计算草稿，支持跨标签页同步与存储不可用时的内存回退
 */
'use client'

import { useSyncExternalStore } from 'react'
import { getToday, restoreDraft, type CalculatorForm } from '@/lib/option-calculator'

const storageKey = 'option-calculator:draft:v1'
const changeEvent = 'option-calculator:draft-change'
let memoryDraft = ''
let storageUnavailable = false

/**
 * 同时订阅当前页面编辑及其他标签页的本机存储变更。
 */
function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(changeEvent, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * 使用稳定的原始字符串作为快照；禁用本机存储时仍允许当前页面计算。
 */
function readSnapshot(): string {
  if (storageUnavailable) return memoryDraft
  try {
    return window.localStorage.getItem(storageKey) ?? ''
  } catch {
    storageUnavailable = true
    return memoryDraft
  }
}

/**
 * 静态导出时不读取浏览器数据，日期待浏览器挂载后填写。
 */
function readServerSnapshot(): null {
  return null
}

/**
 * 写入或移除草稿，并通知同一页面的订阅者刷新。
 */
function writeDraft(form: CalculatorForm | null) {
  memoryDraft = form === null ? '' : JSON.stringify({ version: 1, form })
  try {
    if (form === null) window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, memoryDraft)
  } catch {
    storageUnavailable = true
    // 隐私模式或存储配额不足不应阻止试算。
  }
  window.dispatchEvent(new Event(changeEvent))
}

/**
 * 提供经过字段校验的浏览器草稿及显式清空能力，避免水合时覆盖已保存输入。
 */
export function useCalculatorDraft() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot)
  const form = restoreDraft(snapshot, snapshot === null ? '' : getToday())
  return { form, saveForm: writeDraft }
}
