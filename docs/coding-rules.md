# 编码规范

TypeScript 开启 strict。变量和函数采用 camelCase，组件和类型采用 PascalCase，普通文件采用 kebab-case。业务能力按职责组织，外部输入在边界验证。

自有 JS/TS 文件头包含 `Author`、`Date`、`LastEditors`、`LastEditTime`、`Description`，时间统一按 Asia/Shanghai。修改时维护编辑信息。第三方自动生成的文件通过生成器维护。

命名函数、方法与组件必须有中文多行 JSDoc，写明职责；需要时补充参数、返回值和异常。注释说明原因和边界，避免简单重复代码。

格式以 Prettier 配置为准：单引号、无分号、100 列、尾逗号；只格式化本次触达文件。ESLint 负责质量规则，TypeScript 负责类型检查。

提交前执行 `pnpm check`；根据修改范围运行浏览器冒烟或 API 集成测试。测试验证行为，不重复实现细节。环境变量通过 `.env.example` 说明，真实凭据留在本地 `.env`。
