# option-calculator

项目结构：Next.js Web 单应用。包脚本是运行命令的权威来源。

修改代码前阅读 [编码规范](docs/coding-rules.md)。新增或调整 UI 前，执行 [设计规范](DESIGN.md) 中的组件选型与验收流程。准备提交前阅读 [提交规范](docs/commit-rules.md)。

完成修改后运行 `pnpm check`；调整页面和交互时补充 `pnpm test:e2e`；调整数据库、启动逻辑或健康检查时补充 `pnpm test:integration`（适用命令见 package.json）。新增业务模型时编写并验证迁移，按需更新 README 中的环境变量和启动步骤。

## 文档导航

- [启动与部署](README.md)
- [编码规范](docs/coding-rules.md)
- [提交规范](docs/commit-rules.md)
- [设计规范](DESIGN.md)
