# 当前需求

## 状态

未开始

## 需求文档

<!-- 执行 `/feature load` 加载需求文档 -->

## 目标

<!-- 成功标准的要点列表 -->

## 说明

<!-- 来自需求文档的额外上下文、约束或详细信息 -->

## 修改汇总

<!-- 解释本次修改的内容 -->

## 历史记录

- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.03..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.02..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 发现 9 个问题：2 中等（硬编码提示文案、手机号正则未覆盖新号段）、6 低（浮点精度、废弃 API、死代码）、1 极低（宽松比较）
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
- **消除顶层 DOM 求值阻塞项** （spec：[20261029-tryPackate.md](context/old-features/20261029-tryPackate.md)）
  - 分支 `feature/remove-top-level-dom-eval`，仅改 `src/scripts/ts/web.ts` 一个文件
  - 顶层 `export class EscapeUnicode extends HTMLElement` 改为纯类型声明 `export type IEscapeUnicode = HTMLElement`，类定义整体挪入 `WebUtil.initCustomElements()` 方法体，类体逻辑逐字保留
  - 验证：`npx gulp process-typescript`（strict）编译通过；`web.js` / `ui/canvas.js` / `ui/UIWindow.js` 在 Node 下 import 成功，而从 `HEAD` 取旧版单独编译的对照组三者全部 `ReferenceError: HTMLElement is not defined`
  - 浏览器行为用 jsdom 验证等价：`esp-unicode` 注册成功，`<esp-unicode>&amp;#x26f5;</esp-unicode>` 仍渲染为 `⛵`
  - breaking change：`web.d.ts` 中 `EscapeUnicode` 类导出消失。`src/` 内零引用，影响仅限外部使用方
  - 需求文档标题含「打包方案与项目结构」，但正文只详述阻塞项；打包方案、`package.json` 元信息（`name`/`version`/`main`/`exports`/`types` 当前全缺）、入口拆分、项目结构调整均未做，需另起需求
  - review 阶段全模块 Node import 实测（14 个模块，13 成功 1 失败），发现 `workout/workout.ts:490-493` 顶层 `for` 循环在加载期调用 `document.createElementNS()`，是同类阻塞项，本次未改
  - 另发现 CLAUDE.md 两处过期：「无 `tsconfig.json`」（实际已存在）、「源码架构」仍描述扁平结构（实际已分 `blog/`、`ui/`、`trpg/`、`workout/` 目录，且 `workout/` 未被记录）
