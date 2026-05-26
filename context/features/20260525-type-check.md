# TypeScript 类型错误与可优化类型定义 — 检查报告

## 概述

对 `src/scripts/ts/basic.ts` 进行代码审查，检查类型错误、逻辑 Bug 及可改进之处。编译通过（无类型错误），发现若干代码质量问题。

## 修复状态：8/8 全部已修复 ✅

所有问题均已在后续提交中修复，当前代码无待处理项。

---

## 源文件依赖关系树

```
basic.ts                          (无依赖)
dataStructure.ts                  (无依赖)
3rdLibTool.ts                     (无依赖 - 使用全局声明)

geo2d.ts
└── basic.ts

web.ts
├── basic.ts
└── dataStructure.ts

resource.ts
├── dataStructure.ts
└── web.ts

webHtmlPage.ts
└── web.ts

canvas.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

UIWindow.ts
├── dataStructure.ts
├── geo2d.ts → basic.ts
├── resource.ts → dataStructure.ts, web.ts
└── web.ts → basic.ts, dataStructure.ts

sandtable.ts
├── basic.ts
├── canvas.ts → geo2d.ts, web.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

blog.ts
├── web.ts → basic.ts, dataStructure.ts
├── webHtmlPage.ts → web.ts
└── 3rdLibTool.ts

wiki.ts
├── webHtmlPage.ts → web.ts
└── 3rdLibTool.ts

── 测试/Demo 文件 ──
testJadeUtils.ts → basic, dataStructure, web, geo2d, webHtmlPage, 3rdLibTool, canvas
testJadeUI.ts    → resource → dataStructure + web
testJadeTRPG.ts  → basic, resource → dataStructure + web
```

### 依赖层级

| 层 | 文件 | 说明 |
|----|------|------|
| L0 基础 | `basic.ts`, `dataStructure.ts`, `3rdLibTool.ts` | 零内部依赖 |
| L1 核心 | `geo2d.ts`, `web.ts` | 仅依赖 L0 |
| L2 资源 | `resource.ts`, `webHtmlPage.ts` | 依赖 L0+L1 |
| L3 图形 | `canvas.ts` | 依赖 geo2d + web |
| L4 应用 | `UIWindow.ts`, `sandtable.ts`, `blog.ts`, `wiki.ts` | 依赖 L0~L3 |
| L5 测试 | `testJade*.ts` | 依赖所有上层 |

与 `gulpfile.js` 中的编译顺序一致。

---

## basic.ts 代码审查结果（全部已修复）

1. ~~**`StrUtil.trim/trimLeft/trimRight`** — 手写正则~~ → 已改用原生 `trimLeft()`/`trimRight()`
2. ~~**`StrUtil.base64encode/base64decode`** — 80+行手写~~ → 已改用原生 `btoa()`/`atob()`
3. ~~**UTF-8/16 转换字符串拼接 O(n²)**~~ → 已改用 `string[]` + `.push()` + `.join()`
4. ~~**`NumUtil.add/sub/mul/div` try/catch**~~ → 已改用 `.split(".")[1]`
5. ~~**`NumUtil.createCurve()` 中 `this.baseCurve`**~~ → 已改为 `NumUtil.baseCurve`
6. ~~**三处注释死代码**~~ → 已清理
7. ~~**`TimeUtil.sleep()` 复杂 Promise 写法**~~ → 已简化为 `new Promise(resolve => setTimeout(resolve, milSecs))`
8. ~~**`color140` + `color140Arr` 数据双写**~~ → `color140Arr` 已改为从 `color140` 动态生成（`Object.keys(color140).map(...)`）
