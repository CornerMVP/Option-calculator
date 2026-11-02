/*
 * @Author: Codex
 * @Date: 2026-10-30 16:29:51
 * @LastEditors: Codex
 * @LastEditTime: 2026-10-30 17:08:54
 * @Description: 美股与港股卖出期权的即时收益试算页面
 */
'use client'

import { ArrowUpRight, Calculator, ChevronDown, Info, Monitor, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  addCalendarDays,
  calculateOption,
  createEmptyForm,
  getToday,
  type Calculation,
  type CalculatorForm,
  type FormField,
  type Market,
} from '@/lib/option-calculator'
import { useCalculatorDraft } from '@/lib/use-calculator-draft'

/**
 * 保持主题控件的服务端输出稳定，挂载后读取使用者的主题偏好。
 */
function subscribeTheme() {
  return () => {}
}

/**
 * 格式化展示金额，内部计算始终保留原始精度。
 */
function formatAmount(value: number, currency: string, perShare = false): string {
  return `${currency} ${new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: perShare ? 4 : 2,
  }).format(value)}`
}

/**
 * 将计算结果中的小数比率格式化为百分数。
 */
function formatPercent(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * 展示可持久化的明亮、深色和跟随系统外观选择。
 */
function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeTheme,
    () => true,
    () => false,
  )
  return (
    <div className="theme-select">
      <Monitor size={15} aria-hidden="true" />
      <Select value={mounted ? theme : 'system'} onValueChange={setTheme}>
        <SelectTrigger aria-label="外观" size="sm" className="theme-trigger">
          <SelectValue placeholder="跟随系统" />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          <SelectItem value="system">跟随系统</SelectItem>
          <SelectItem value="light">明亮</SelectItem>
          <SelectItem value="dark">深色</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

interface FieldProps {
  name: FormField
  label: string
  form: CalculatorForm
  calculation: Calculation
  onChange: (name: FormField, value: string) => void
  hint?: string
  suffix?: string
  placeholder?: string
  type?: 'text' | 'date'
  numeric?: boolean
  readOnly?: boolean
}

/**
 * 将标签、单位、帮助文字和输入错误关联，空白必填项不提前显示红色错误。
 */
function Field({
  name,
  label,
  form,
  calculation,
  onChange,
  hint,
  suffix,
  placeholder,
  type = 'text',
  numeric = false,
  readOnly = false,
}: FieldProps) {
  const error = form[name].trim() ? calculation.errors[name] : undefined
  const description = error || hint
  return (
    <div className={`field${type === 'date' ? ' date-field' : ''}`}>
      <Label htmlFor={name}>{label}</Label>
      {type === 'date' ? (
        <DatePicker
          id={name}
          name={name}
          label={label}
          value={form[name]}
          onValueChange={(value) => onChange(name, value)}
          invalid={Boolean(error)}
          describedBy={description ? `${name}-description` : undefined}
        />
      ) : (
        <div className={`input-wrap${error ? ' input-error' : ''}`}>
          <Input
            id={name}
            name={name}
            type={type}
            inputMode={numeric ? 'decimal' : undefined}
            value={form[name]}
            onChange={(event) => onChange(name, event.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            maxLength={name === 'symbol' ? 24 : 100}
            aria-invalid={error ? true : undefined}
            aria-describedby={description ? `${name}-description` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
      )}
      {description && (
        <p id={`${name}-description`} className={error ? 'field-error' : 'field-hint'}>
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * 以定义列表中的一组标签与数值展示收益明细，负收益同时保留符号。
 */
function Metric({
  label,
  children,
  negative = false,
  note,
}: {
  label: string
  children: ReactNode
  negative?: boolean
  note?: string
}) {
  return (
    <div className="metric">
      <dt>{label}</dt>
      <dd className={negative ? 'negative-value' : undefined}>{children}</dd>
      {note && <dd className="metric-note">{note}</dd>}
    </div>
  )
}

/**
 * 同步展示有效计算结果；缺失或错误输入时清除旧结果，避免沿用上一笔数值。
 */
function Results({ form, calculation }: { form: CalculatorForm; calculation: Calculation }) {
  const { result } = calculation
  const currency = form.market === 'us' ? 'USD' : 'HKD'
  const isCall = form.strategy === 'call'
  const negative = result !== null && result.netPremium < 0
  const visibleErrors = Object.entries(calculation.errors)
    .filter(([name]) => form[name as FormField].trim())
    .map(([, error]) => error)
  return (
    <aside className="results-column" aria-label="计算结果">
      <section className="yield-panel" aria-labelledby="yield-title">
        <div className="result-topline">
          <span className="section-eyebrow">你的收益试算</span>
          <span className="calculation-badge">单利 · 365 天</span>
        </div>
        <h2 id="yield-title">权利金年化收益率</h2>
        <div className={`yield-number${negative ? ' negative-value' : ''}`}>
          <output aria-label="权利金年化收益率" aria-live="polite" aria-atomic="true">
            {result?.annualizedReturn !== null && result?.annualizedReturn !== undefined
              ? formatPercent(result.annualizedReturn)
              : '—'}
          </output>
        </div>
        <p className="yield-description">
          {result
            ? result.days === 0
              ? '同日到期：仅展示本期收益，不折算年化。'
              : `基于${isCall ? '股票持仓成本' : '全额行权本金'}，扣除本笔费用后计算。`
            : visibleErrors.length > 0
              ? '修正输入后，收益会在这里即时更新。'
              : '填好交易参数，让回报一目了然。'}
        </p>
        <dl className="period-metrics">
          <Metric label="本期收益率" negative={negative}>
            {result ? formatPercent(result.periodReturn) : '—'}
          </Metric>
          <Metric label="持有天数">{result ? `${result.days} 天` : '—'}</Metric>
        </dl>
        <div className="formula-strip">
          <Info size={15} aria-hidden="true" />
          <span>净权利金 ÷ 本金 × 365 ÷ 持有天数</span>
        </div>
      </section>

      <section className="breakdown-panel" aria-labelledby="breakdown-title">
        <div className="breakdown-heading">
          <h2 id="breakdown-title">这笔交易的数字</h2>
          <span>{currency}</span>
        </div>
        <dl className="breakdown-metrics">
          <Metric label={isCall ? '对应股票持仓成本' : '行权所需现金'}>
            {result ? formatAmount(result.capital, currency) : '—'}
          </Metric>
          <Metric label="总权利金收入">
            {result ? formatAmount(result.grossPremium, currency) : '—'}
          </Metric>
          <Metric label="本笔总费用">{result ? formatAmount(result.fees, currency) : '—'}</Metric>
          <Metric label="净权利金收入" negative={negative}>
            {result ? formatAmount(result.netPremium, currency) : '—'}
          </Metric>
          <Metric label="盈亏平衡价" note="每股，已计入本笔净权利金">
            {result ? formatAmount(result.breakEven, currency, true) : '—'}
          </Metric>
          {isCall && (
            <>
              <Metric label="被行权时每股净卖出价">
                {result?.effectiveSalePrice !== null && result?.effectiveSalePrice !== undefined
                  ? formatAmount(result.effectiveSalePrice, currency, true)
                  : '—'}
              </Metric>
              <Metric
                label="被行权时总盈亏"
                negative={result?.assignedProfit !== null && (result?.assignedProfit ?? 0) < 0}
                note="相对所填持仓成本，包含股票价差与净权利金"
              >
                {result?.assignedProfit !== null && result?.assignedProfit !== undefined
                  ? formatAmount(result.assignedProfit, currency)
                  : '—'}
              </Metric>
            </>
          )}
        </dl>
        {result && (
          <p className="trade-summary">
            {form.symbol.trim().toUpperCase()} · {Number(form.contracts).toLocaleString('zh-CN')} 张
            · 共 {result.totalShares.toLocaleString('zh-CN')} 股
          </p>
        )}
      </section>
      <p className="result-footnote">
        年化将本笔权利金收益按天折算，不代表实际全年回报。股票价格变动的盈亏另计。
      </p>
    </aside>
  )
}

/**
 * 展示可展开的口径说明及官方合约资料，方便使用者核对资金和报价单位。
 */
function Methodology() {
  return (
    <details className="methodology">
      <summary>
        <span>
          <Info size={17} aria-hidden="true" /> 计算口径与使用说明
        </span>
        <ChevronDown size={18} className="details-chevron" aria-hidden="true" />
      </summary>
      <div className="methodology-content">
        <div>
          <h3>本金与权利金</h3>
          <p>总股数 = 每张合约股数 × 张数。净权利金 = 每股权利金 × 总股数 − 本笔总费用。</p>
          <p>
            Put 本金 = 行权价 × 总股数，采用全额行权现金口径，不扣减权利金。Call 本金 = 每股持仓成本
            × 总股数，采用持仓成本口径。
          </p>
          <p>权利金收益不包含股息、现金利息、股票浮动盈亏或未填写的税费。</p>
        </div>
        <div>
          <h3>收益与日期</h3>
          <p>
            本期收益率 = 净权利金 ÷ 本金。单利年化 = 本期收益率 × 365 ÷ 自然日天数，不作复利假设。
            开仓日默认北京 / 香港时间的今天，可改为实际开仓日；支持历史试算。
          </p>
          <p>
            Call 被行权总盈亏 =（行权价 − 每股持仓成本）× 总股数 +
            净权利金。该数值相对持仓成本计算，不用本笔期权天数对历史股票盈亏折算年化。
          </p>
        </div>
        <div>
          <h3>市场与合约</h3>
          <p>
            美股使用 USD，标准股票 / ETF 合约每张 100 股；港股使用 HKD，每张股数需按合约填写。
            本页适用于常规未调整合约，标的代码仅作记录；价格与日期均由你输入。
          </p>
          <div className="source-links">
            <a
              href="https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications"
              target="_blank"
              rel="noreferrer"
            >
              OCC 美股合约规格 <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.hkex.com.hk/Products/Listed-Derivatives/Single-Stock/Stock-Options?sc_lang=en"
              target="_blank"
              rel="noreferrer"
            >
              港交所合约股数 <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </details>
  )
}

/**
 * 组织单笔期权试算的市场、策略、表单和收益展示，修改参数后即时重算并保存草稿。
 */
export function OptionCalculator() {
  const { form, saveForm } = useCalculatorDraft()
  const calculation = calculateOption(form)
  const currency = form.market === 'us' ? 'USD' : 'HKD'
  const isCall = form.strategy === 'call'

  /**
   * 更新手动输入值，标的代码统一大写以便核对。
   */
  function updateField(name: FormField, value: string) {
    saveForm({ ...form, [name]: name === 'symbol' ? value.toUpperCase() : value })
  }

  /**
   * 切换市场时清除跨币种金额，保留试算日期及策略，避免把美元当港元沿用。
   */
  function changeMarket(market: Market) {
    if (market === form.market) return
    saveForm({
      ...createEmptyForm(getToday()),
      market,
      strategy: form.strategy,
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      contractSize: market === 'us' ? '100' : '',
    })
  }

  /**
   * 填写当前市场与策略的虚构三十天示例，提供可直接验证的计算结果。
   */
  function fillExample() {
    const today = getToday()
    saveForm({
      ...createEmptyForm(today),
      market: form.market,
      strategy: form.strategy,
      symbol: form.market === 'us' ? 'DEMO' : '00000',
      expiryDate: addCalendarDays(today, 30),
      strike: '100',
      premium: '1',
      contractSize: form.market === 'us' ? '100' : '500',
      costBasis: isCall ? '95' : '',
    })
  }

  const sharedFieldProps = { form, calculation, onChange: updateField }

  return (
    <div className="calculator-page">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Option 收益计算器首页">
          <span className="brand-icon">
            <Calculator size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>
            Option<span className="brand-divider">/</span>
            <span className="brand-subtitle">收益计算器</span>
          </span>
        </Link>
        <ThemeSelect />
      </header>

      <main id="main-content">
        <section className="page-heading">
          <p className="section-eyebrow">卖出期权 · 收益试算</p>
          <h1>每一笔权利金，回报都清晰。</h1>
          <p>输入交易参数，即时计算卖 Put 与备兑 Call 的年化收益率。</p>
        </section>

        <div className="calculator-layout">
          <section className="input-panel" aria-labelledby="parameters-title">
            <div className="panel-heading">
              <div>
                <h2 id="parameters-title">交易参数</h2>
                <p>手动输入，即时试算</p>
              </div>
              <Button variant="outline" className="example-button" onClick={fillExample}>
                试试示例 <ArrowUpRight size={14} aria-hidden="true" />
              </Button>
            </div>

            <fieldset className="market-fieldset">
              <legend>交易市场</legend>
              <ToggleGroup
                type="single"
                className="market-options"
                aria-label="交易市场"
                value={form.market}
                onValueChange={(value) => {
                  if (value === 'us' || value === 'hk') changeMarket(value)
                }}
              >
                {(
                  [
                    ['us', '美股', 'USD'],
                    ['hk', '港股', 'HKD'],
                  ] as const
                ).map(([market, title, code]) => (
                  <ToggleGroupItem key={market} value={market}>
                    {title} <span>{code}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>

            <fieldset className="strategy-fieldset">
              <legend>卖出策略</legend>
              <ToggleGroup
                type="single"
                className="strategy-options"
                aria-label="卖出策略"
                value={form.strategy}
                onValueChange={(strategy) => {
                  if (strategy === 'put' || strategy === 'call') saveForm({ ...form, strategy })
                }}
              >
                {(
                  [
                    ['put', '卖 Put', '现金担保'],
                    ['call', '卖 Call', '持股备兑'],
                  ] as const
                ).map(([strategy, title, description]) => (
                  <ToggleGroupItem key={strategy} value={strategy}>
                    <span className="strategy-radio" aria-hidden="true" />
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>

            <div className="form-grid">
              <Field
                {...sharedFieldProps}
                name="symbol"
                label="标的代码"
                placeholder={form.market === 'us' ? '如 AAPL' : '如 00700'}
              />
              <Field {...sharedFieldProps} name="contracts" label="合约张数" suffix="张" numeric />
              <Field {...sharedFieldProps} name="startDate" label="开仓日期" type="date" />
              <Field {...sharedFieldProps} name="expiryDate" label="到期日期" type="date" />
              <Field
                {...sharedFieldProps}
                name="strike"
                label="行权价"
                placeholder="0.00"
                suffix={currency}
                numeric
              />
              <Field
                {...sharedFieldProps}
                name="premium"
                label="每股权利金"
                placeholder="0.00"
                suffix={currency}
                numeric
              />
              {isCall && (
                <div className="full-width">
                  <Field
                    {...sharedFieldProps}
                    name="costBasis"
                    label="每股持仓成本"
                    placeholder="实际持仓成本"
                    suffix={currency}
                    hint="用于计算权利金收益率和被行权时总盈亏"
                    numeric
                  />
                </div>
              )}
              <Field
                {...sharedFieldProps}
                name="contractSize"
                label="每张合约股数"
                placeholder="按实际合约填写"
                suffix="股"
                hint={form.market === 'us' ? '美股标准合约为 100 股' : '请核对港交所合约资料'}
                readOnly={form.market === 'us'}
                numeric
              />
              <Field
                {...sharedFieldProps}
                name="fees"
                label="本笔总费用（选填）"
                suffix={currency}
                placeholder="0.00"
                hint="整笔总额，包含你需要计入的税费"
                numeric
              />
            </div>
            <div className="form-footer">
              <p>输入仅存于本机浏览器</p>
              <Button variant="outline" className="reset-button" onClick={() => saveForm(null)}>
                <RotateCcw size={14} aria-hidden="true" /> 清空输入
              </Button>
            </div>
          </section>

          <Results form={form} calculation={calculation} />
        </div>
        <Methodology />
      </main>

      <footer className="site-footer">
        <span>算清回报，再做决定。</span>
        <span>美股 / 港股 · 常规股票与 ETF 期权</span>
      </footer>
    </div>
  )
}
