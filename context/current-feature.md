# 当前需求：

## 状态

未开始

## 目标

（略）

## 说明

（略）


## 历史记录

- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.03..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.02..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 发现 9 个问题：2 中等（硬编码提示文案、手机号正则未覆盖新号段）、6 低（浮点精度、废弃 API、死代码）、1 极低（宽松比较）
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
