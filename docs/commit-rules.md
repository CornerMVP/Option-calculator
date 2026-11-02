# 提交规范

采用 `type(scope): 中文说明`，标题最长 88 字符，scope 必填。

type：feat、fix、docs、style、refactor、perf、test、build、chore、revert、enhance、release。

scope：web、repo；允许在 scope 后添加 `/子模块`，例如 `repo/hooks`。subject 必须包含中文，清楚描述本次修改。style 表示格式或样式调整；enhance 表示已有能力增强。

示例：`feat(web): 添加基础状态展示`。

commit-msg 通过 commitlint 校验类型、scope、中文说明和长度；pre-commit 通过 lint-staged 格式化及检查暂存文件，再执行类型检查。首次安装时若尚未初始化 Git，执行 `git init` 后再运行 `pnpm prepare` 启用钩子。
