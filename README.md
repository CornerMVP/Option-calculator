# option-calculator

美股与港股卖出期权收益计算器，支持现金担保 Put 与持股备兑 Call。手动输入后即时试算，最近输入保存在本机浏览器，可随时清空。

使用 Next.js、TypeScript、Node 24.19+ 和 pnpm 10.12.2，支持手机、平板、桌面与明暗主题。

## 使用与计算口径

选择市场与策略，填写标的代码、开仓日、到期日、行权价、每股权利金和合约张数。Call 额外填写每股持仓成本；港股额外填写每张合约股数。总费用为整笔金额，选填且默认 0。

- 总股数 = 每张合约股数 × 张数。
- 净权利金 = 每股权利金 × 总股数 − 本笔总费用。
- Put 本金 = 行权价 × 总股数，采用全额行权现金口径，不扣减权利金。
- Call 本金 = 每股持仓成本 × 总股数，采用持仓成本口径。
- 本期收益率 = 净权利金 ÷ 本金；单利年化 = 本期收益率 × 365 ÷ 持有自然日天数。
- 持有天数 = 到期日 − 开仓日。开仓日默认北京 / 香港时间的今天、可修改，支持历史试算。同日到期不折算年化；到期日早于开仓日时不输出结果。
- 盈亏平衡价：Put 为行权价 − 每股净权利金；Call 为每股持仓成本 − 每股净权利金。
- Call 被行权时总盈亏 =（行权价 − 每股持仓成本）× 总股数 + 净权利金；每股净卖出价 = 行权价 + 每股净权利金。历史股票盈亏不按本笔期权天数折算年化。

例：30 天的 Put，行权价 USD 100、每股权利金 USD 1、1 张标准合约、费用 USD 5。本金 USD 10,000，净权利金 USD 95，本期收益率 0.95%，单利年化约 11.56%。

美股使用 USD，标准股票 / ETF 合约每张 100 股；港股使用 HKD，合约股数按具体合约填写。本页适用于常规未调整合约，不支持复杂交割组成的调整合约。合约单位可核对 [OCC 美股规格](https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications) 与 [港交所股票期权资料](https://www.hkex.com.hk/Products/Listed-Derivatives/Single-Stock/Stock-Options?sc_lang=en)。

年化是对本笔权利金收入的数学折算，不代表实际全年回报；权利金收益不包含股票浮动盈亏、股息、现金利息或未填写的税费。标的代码仅用于记录，不获取实时行情；页面中的示例采用虚构标的。

## 本地启动

```bash
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:3000>。本项目为纯前端，无需 API 密钥、环境变量或数据库。

## 检查

```bash
pnpm check
pnpm test:e2e
```

浏览器测试运行前执行 `pnpm exec playwright install chromium`（全栈在根目录执行）。

端到端测试通过 `preview:e2e` 使用独立的 3100 端口，可与 3000 端口的开发预览同时运行。

基础交互统一从 `src/components/ui` 复用。日期选择采用 shadcn/ui 的 Input + Popover + Calendar，支持中文日历、手输及键盘操作。ESLint 会拦截业务层直接声明原生按钮、表单控件和标签，或使用 `Input type="date"` 回退到原生日历。组件选型和验收要求见 [设计规范](DESIGN.md#组件选型与验收流程)。

CI 已覆盖格式、静态检查、类型、单元测试、构建及适用的运行验证。首次 CI 在没有锁文件时解析依赖；安装后提交 `pnpm-lock.yaml`，后续 CI 自动使用 frozen lockfile。

## Netlify 部署

项目采用 Next.js 静态导出。`netlify.toml` 已配置构建命令 `pnpm build` 和发布目录 `out`；Node 版本由 `.nvmrc` 指定，pnpm 版本由 `package.json` 的 `packageManager` 指定，无需配置 API 密钥或数据库。

源码仓库：[CornerMVP/Option-calculator](https://github.com/CornerMVP/Option-calculator)。在 Netlify 选择 Add new project → Import an existing project → GitHub，选择该仓库和 `main` 分支，确认构建命令为 `pnpm build`、发布目录为 `out` 后部署。后续推送到 `main` 会自动构建和发布，其他分支可用于部署预览。

手动部署：运行 `pnpm check`，将生成的 `out/` 文件夹上传到 Netlify 的项目页面。更新现有站点时，在该站点的 Deploys 页面上传新的 `out/`，避免创建重复项目。

使用 Netlify CLI 时，先安装 CLI 并执行 `netlify login`，然后运行：

```bash
netlify link
pnpm check
netlify deploy --dir=out --no-build --prod
```

`netlify link` 选择已创建的站点，本地绑定保存在忽略提交的 `.netlify/` 中。手动上传仅发布当前构建产物，不会自动同步后续代码修改；已连接 GitHub 的站点在下次推送后会以自动部署的版本为准。

本地可通过 `pnpm preview` 预览 `out/`。

Web 运行在 3000，所有试算在浏览器中进行。

## 规范

首次安装时若已有本地 Git 仓库会启用 Husky；否则 `git init` 后执行 `pnpm prepare`。提交示例及可用 scope 见 [提交规范](docs/commit-rules.md)。

- [AGENTS.md](AGENTS.md)：协作入口。
- [DESIGN.md](DESIGN.md)：主题、交互和产品设计约定。
- [编码规范](docs/coding-rules.md)：文件头、中文 JSDoc 与质量要求。

模板基础代码来自 alpha-cli，MIT 声明见 LICENSE；新项目的作者、产品描述和分发策略由项目维护者补充。
