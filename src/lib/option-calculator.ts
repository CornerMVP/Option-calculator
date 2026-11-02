/*
 * @Author: Codex
 * @Date: 2026-10-30 16:29:51
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 16:29:51
 * @Description: 验证手动交易参数并计算现金担保 Put 与备兑 Call 的收益
 */

export type Market = 'us' | 'hk'
export type Strategy = 'put' | 'call'

export interface CalculatorForm {
  market: Market
  strategy: Strategy
  symbol: string
  startDate: string
  expiryDate: string
  strike: string
  premium: string
  contracts: string
  contractSize: string
  fees: string
  costBasis: string
}

export type FormField = Exclude<keyof CalculatorForm, 'market' | 'strategy'>
export type FormErrors = Partial<Record<FormField, string>>

export interface CalculationResult {
  days: number
  totalShares: number
  grossPremium: number
  netPremium: number
  fees: number
  capital: number
  periodReturn: number
  annualizedReturn: number | null
  breakEven: number
  assignedProfit: number | null
  effectiveSalePrice: number | null
}

export interface Calculation {
  status: 'incomplete' | 'invalid' | 'ready'
  errors: FormErrors
  result: CalculationResult | null
}

/**
 * 获取北京与香港时区的当前日期，避免浏览器或构建机器时区改变默认开仓日。
 */
export function getToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * 生成未填入价格的表单；港股合约股数必须由使用者核对填写。
 */
export function createEmptyForm(today: string): CalculatorForm {
  return {
    market: 'us',
    strategy: 'put',
    symbol: '',
    startDate: today,
    expiryDate: '',
    strike: '',
    premium: '',
    contracts: '1',
    contractSize: '100',
    fees: '0',
    costBasis: '',
  }
}

/**
 * 将真实存在的公历日期转换成 UTC 日序号，仅比较日期，不引入夏令时小时差。
 */
function getDayNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1900) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date.getTime() / 86_400_000
}

/**
 * 给示例生成固定长度的自然日周期，不改变本地时区。
 */
export function addCalendarDays(date: string, days: number): string {
  const dayNumber = getDayNumber(date)
  if (dayNumber === null) return ''
  return new Date((dayNumber + days) * 86_400_000).toISOString().slice(0, 10)
}

/**
 * 验证金额与数量的十进制输入，空值和零分开处理，费用可以超过权利金。
 */
function readNumber(
  form: CalculatorForm,
  field: FormField,
  errors: FormErrors,
  options: { allowZero?: boolean; integer?: boolean } = {},
): number {
  const text = form[field].trim()
  if (!text) {
    errors[field] = '请填写此项'
    return 0
  }
  const number = Number(text)
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(number)) {
    errors[field] = '请输入有效的非负数'
  } else if (number < 0 || (!options.allowZero && number === 0)) {
    errors[field] = '请输入大于 0 的数值'
  } else if (options.integer && !Number.isSafeInteger(number)) {
    errors[field] = '请输入有效的正整数'
  }
  return number
}

/**
 * 按总本金计算净权利金收益；Call 的股票价差只计入被行权总盈亏。
 * 同日到期仍计算本期收益，但不以零天或虚构的一天折算年化。
 */
export function calculateOption(form: CalculatorForm): Calculation {
  const errors: FormErrors = {}
  if (!form.symbol.trim()) errors.symbol = '请填写标的代码'
  else if (form.symbol.trim().length > 24 || /\s/.test(form.symbol.trim())) {
    errors.symbol = '请输入不含空格的标的代码（最多 24 个字符）'
  }

  const start = getDayNumber(form.startDate)
  const expiry = getDayNumber(form.expiryDate)
  if (start === null) errors.startDate = '请填写有效的开仓日期'
  if (expiry === null) errors.expiryDate = '请填写有效的到期日期'
  if (start !== null && expiry !== null && expiry < start) {
    errors.expiryDate = '到期日期不能早于开仓日期'
  }

  const strike = readNumber(form, 'strike', errors)
  const premium = readNumber(form, 'premium', errors, { allowZero: true })
  const contracts = readNumber(form, 'contracts', errors, { integer: true })
  const contractSize =
    form.market === 'us' ? 100 : readNumber(form, 'contractSize', errors, { integer: true })
  const fees = form.fees.trim() ? readNumber(form, 'fees', errors, { allowZero: true }) : 0
  const costBasis = form.strategy === 'call' ? readNumber(form, 'costBasis', errors) : 0
  const totalShares = contracts * contractSize

  if (!errors.contracts && !errors.contractSize && !Number.isSafeInteger(totalShares)) {
    errors.contracts = '总股数超出可计算范围'
  }
  if (Object.keys(errors).length > 0) {
    const hasInvalidValue = Object.entries(errors).some(
      ([field]) => form[field as FormField].trim() !== '',
    )
    return { status: hasInvalidValue ? 'invalid' : 'incomplete', errors, result: null }
  }

  const days = expiry! - start!
  const grossPremium = premium * totalShares
  const netPremium = grossPremium - fees
  const capital = (form.strategy === 'put' ? strike : costBasis) * totalShares
  const periodReturn = netPremium / capital
  const annualizedReturn = days > 0 ? (periodReturn * 365) / days : null
  const breakEven = (form.strategy === 'put' ? strike : costBasis) - netPremium / totalShares
  const assignedProfit =
    form.strategy === 'call' ? (strike - costBasis) * totalShares + netPremium : null
  const effectiveSalePrice = form.strategy === 'call' ? strike + netPremium / totalShares : null

  if (
    capital <= 0 ||
    ![grossPremium, netPremium, capital, periodReturn, breakEven].every(Number.isFinite) ||
    (annualizedReturn !== null && !Number.isFinite(annualizedReturn)) ||
    (assignedProfit !== null && !Number.isFinite(assignedProfit)) ||
    (effectiveSalePrice !== null && !Number.isFinite(effectiveSalePrice))
  ) {
    return { status: 'invalid', errors: { premium: '数值超出可计算范围' }, result: null }
  }

  return {
    status: 'ready',
    errors,
    result: {
      days,
      totalShares,
      grossPremium,
      netPremium,
      fees,
      capital,
      periodReturn,
      annualizedReturn,
      breakEven,
      assignedProfit,
      effectiveSalePrice,
    },
  }
}

/**
 * 从不可信的浏览器草稿恢复允许的字段，旧版本或损坏数据回退为空白表单。
 */
export function restoreDraft(raw: string | null, today: string): CalculatorForm {
  const empty = createEmptyForm(today)
  if (!raw) return empty
  try {
    const saved: unknown = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null || !('version' in saved)) return empty
    if (saved.version !== 1 || !('form' in saved)) return empty
    const data = saved.form
    if (typeof data !== 'object' || data === null) return empty
    const restored = { ...empty }
    for (const field of Object.keys(empty) as (keyof CalculatorForm)[]) {
      if (field === 'market' || field === 'strategy') continue
      if (field in data) {
        const value: unknown = data[field as keyof typeof data]
        if (typeof value === 'string' && value.length <= 100) restored[field] = value
      }
    }
    restored.market = 'market' in data && data.market === 'hk' ? 'hk' : 'us'
    restored.strategy = 'strategy' in data && data.strategy === 'call' ? 'call' : 'put'
    if (restored.market === 'us') restored.contractSize = '100'
    else if (!('contractSize' in data) || typeof data.contractSize !== 'string') {
      restored.contractSize = ''
    }
    return restored
  } catch {
    return empty
  }
}
