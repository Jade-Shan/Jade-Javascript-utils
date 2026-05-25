# TypeScript 类型错误与可优化类型定义 — 检查报告

## 概述

对 `src/scripts/ts/basic.ts` 进行代码审查，检查类型错误、逻辑 Bug 及可改进之处。编译通过（无类型错误），但发现若干逻辑问题和代码质量问题。

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

## basic.ts 代码审查结果

### 可优化（性能/代码简洁）

1. **`StrUtil.trim/trimLeft/trimRight`** ([basic.ts:213-233](src/scripts/ts/basic.ts#L213-L233))
   项目编译目标为 ES6，`String.prototype.trim/trimStart/trimEnd` 内置可用，无需手写正则。

2. **`StrUtil.base64encode/base64decode`** ([basic.ts:403-485](src/scripts/ts/basic.ts#L403-L485))
   浏览器原生支持 `btoa()` / `atob()`，可替代 80+ 行手写实现。

3. **UTF-8/16 转换 — 字符串拼接性能** ([basic.ts:325-395](src/scripts/ts/basic.ts#L325-L395))
   循环内 `out += ...` 每轮创建新字符串，长字符串下 O(n²)。用数组 `push` + 最后 `join('')` 更优。

4. **`NumUtil.add/sub/mul/div` — try/catch 获取小数位数不优雅** ([basic.ts:107-108](src/scripts/ts/basic.ts#L107-L108))
    `(n.toString().split('.')[1] || '').length` 比 try/catch 更清晰且无异常抛出。

5. **`NumUtil.createCurve()` — `this.baseCurve` 上下文风险** ([basic.ts:194](src/scripts/ts/basic.ts#L194))
    箭头函数内用 `this.baseCurve`，若 `curve` 被提取单独调用则 `this` 变为 `undefined`。用 `NumUtil.baseCurve` 更安全。

6. **`color140` + `color140Arr` — 数据双写** ([basic.ts:913-1195](src/scripts/ts/basic.ts#L913-L1195))
    140 色在 `color140`（属性名索引）和 `color140Arr`（数组 + reverse 映射）各存一份约 280 条记录，新增颜色需两处同步。可从 `color140Arr` 动态生成 `color140`。

7. **注释掉的死代码** ([basic.ts:111-113](src/scripts/ts/basic.ts#L111-L113), [143-148](src/scripts/ts/basic.ts#L143-L148), [302-317](src/scripts/ts/basic.ts#L302-L317))
    三处被注释的代码块可以清理。

8. **`TimeUtil.sleep()` — 可简化** ([basic.ts:510](src/scripts/ts/basic.ts#L510))
    `new Promise((resolve: (param: any) => void) => {setTimeout(() => { resolve(null);}, milSecs);})` 可简化为 `new Promise(resolve => setTimeout(resolve, milSecs))`。

---
