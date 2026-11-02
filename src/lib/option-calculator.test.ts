/*
 * @Author: Codex
 * @Date: 2026-10-30 16:29:51
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 16:29:51
 * @Description: 验证期权收益的资金口径、合约单位、日期边界和草稿恢复
 */
import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  calculateOption,
  createEmptyForm,
  restoreDraft,
  type CalculatorForm,
} from './option-calculator'

const put: CalculatorForm = {
  ...createEmptyForm('2026-01-01'),
  symbol: 'DEMO',
  expiryDate: '2026-01-31',
  strike: '100',
  premium: '1',
}

describe('卖出期权收益', () => {
  it('Put 使用全额行权现金，单利折算三十天净权利金收益', () => {
    const { result, status } = calculateOption(put)
    expect(status).toBe('ready')
    expect(result).toMatchObject({
      days: 30,
      totalShares: 100,
      grossPremium: 100,
      netPremium: 100,
      capital: 10_000,
      periodReturn: 0.01,
      breakEven: 99,
      assignedProfit: null,
    })
    expect(result?.annualizedReturn).toBeCloseTo(0.1216666667)
  })

  it('整笔费用只扣一次，不从 Put 本金中扣除权利金', () => {
    const { result } = calculateOption({ ...put, contracts: '2', fees: '2' })
    expect(result).toMatchObject({ grossPremium: 200, netPremium: 198, capital: 20_000 })
    expect(result?.periodReturn).toBeCloseTo(0.0099)
    expect(result?.breakEven).toBeCloseTo(99.01)
  })

  it('港股使用手填的每张股数及张数，费用计入每股盈亏平衡价', () => {
    const { result } = calculateOption({
      ...put,
      market: 'hk',
      symbol: '00000',
      contracts: '2',
      contractSize: '500',
      fees: '10',
    })
    expect(result).toMatchObject({
      totalShares: 1000,
      grossPremium: 1000,
      netPremium: 990,
      capital: 100_000,
      breakEven: 99.01,
    })
    expect(result?.periodReturn).toBeCloseTo(0.0099)
  })

  it('Call 的权利金收益与被行权股票盈亏分开计算', () => {
    const { result } = calculateOption({ ...put, strategy: 'call', costBasis: '95', fees: '5' })
    expect(result).toMatchObject({
      capital: 9500,
      netPremium: 95,
      periodReturn: 0.01,
      breakEven: 94.05,
      assignedProfit: 595,
      effectiveSalePrice: 100.95,
    })
    expect(result?.annualizedReturn).toBeCloseTo(0.1216666667)
  })

  it('Call 行权价低于持仓成本时如实显示行权亏损，权利金收益单独保留', () => {
    const { result } = calculateOption({
      ...put,
      strategy: 'call',
      costBasis: '100',
      strike: '90',
    })
    expect(result?.assignedProfit).toBe(-900)
    expect(result?.periodReturn).toBe(0.01)
  })

  it('费用超过权利金时显示负收益', () => {
    const { result } = calculateOption({ ...put, fees: '150' })
    expect(result?.netPremium).toBe(-50)
    expect(result?.periodReturn).toBe(-0.005)
    expect(result?.annualizedReturn).toBeCloseTo(-0.0608333333)
    expect(result?.breakEven).toBe(100.5)
  })

  it('零权利金与空白费用合法，空白权利金则仍是未完成输入', () => {
    expect(calculateOption({ ...put, premium: '0', fees: '' }).result?.periodReturn).toBe(0)
    expect(calculateOption({ ...put, premium: '' }).status).toBe('incomplete')
  })

  it('同日到期只计算本期收益，不虚构年化天数', () => {
    const { result } = calculateOption({ ...put, expiryDate: put.startDate })
    expect(result).toMatchObject({ days: 0, periodReturn: 0.01, annualizedReturn: null })
  })

  it('支持历史试算，夏令时切换不改变自然日天数', () => {
    const { result } = calculateOption({
      ...put,
      startDate: '2026-03-07',
      expiryDate: '2026-03-09',
    })
    expect(result?.days).toBe(2)
    expect(addCalendarDays('2028-02-28', 2)).toBe('2028-03-01')
    expect(addCalendarDays('2026-02-30', 1)).toBe('')
  })

  it('到期日早于开仓日或日期不存在时不输出结果', () => {
    expect(calculateOption({ ...put, expiryDate: '2025-12-31' })).toMatchObject({
      status: 'invalid',
      result: null,
      errors: { expiryDate: '到期日期不能早于开仓日期' },
    })
    expect(calculateOption({ ...put, expiryDate: '2026-02-30' }).result).toBeNull()
  })

  it.each([
    { strike: '0' },
    { premium: '-1' },
    { premium: 'NaN' },
    { premium: 'Infinity' },
    { premium: '0x10' },
    { contracts: '1.5' },
    { contracts: '0' },
    { fees: '-1' },
    { symbol: 'A A' },
  ])('拒绝无效交易输入 %j，且不保留旧结果', (invalid) => {
    expect(calculateOption({ ...put, ...invalid })).toMatchObject({
      status: 'invalid',
      result: null,
    })
  })

  it('Call 必须提供成本；港股必须提供合约股数，美股固定标准乘数', () => {
    expect(calculateOption({ ...put, strategy: 'call' }).errors).toHaveProperty('costBasis')
    expect(calculateOption({ ...put, market: 'hk', contractSize: '' }).errors).toHaveProperty(
      'contractSize',
    )
    expect(calculateOption({ ...put, contractSize: '1' }).result?.totalShares).toBe(100)
  })
})

describe('本机草稿', () => {
  it('损坏或非当前版本的草稿回退为空白表单', () => {
    for (const raw of ['not-json', 'null', '[]', '{"version":2,"form":{}}']) {
      expect(restoreDraft(raw, '2026-01-01')).toEqual(createEmptyForm('2026-01-01'))
    }
  })

  it('恢复市场、策略及手输参数，并保留清空的开仓日期', () => {
    const form: CalculatorForm = {
      ...put,
      market: 'hk',
      strategy: 'call',
      contractSize: '500',
      costBasis: '95',
      startDate: '',
    }
    expect(restoreDraft(JSON.stringify({ version: 1, form }), '2026-10-30')).toEqual(form)
  })

  it('不将损坏的港股合约股数静默恢复为美股的 100 股', () => {
    const form = { ...put, market: 'hk', contractSize: 500, premium: null }
    expect(restoreDraft(JSON.stringify({ version: 1, form }), '2026-01-01')).toMatchObject({
      market: 'hk',
      contractSize: '',
      premium: '',
    })
  })
})
