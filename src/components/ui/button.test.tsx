/*
 * @Author: alpha-cli
 * @Date: 2026-10-30 15:59:06
 * @LastEditors: alpha-cli
 * @LastEditTime: 2026-10-30 15:59:06
 * @Description: 定义 button.test.tsx 的基础能力与配置
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from './button'

afterEach(cleanup)

describe('Button', () => {
  it('透传点击及禁用行为', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>开始</Button>)
    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    expect(onClick).toHaveBeenCalledOnce()
    rerender(
      <Button disabled onClick={onClick}>
        开始
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('支持链接语义组合', () => {
    render(
      <Button asChild>
        <a href="/guide">查看指南</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: '查看指南' })).toHaveAttribute('href', '/guide')
  })
})
