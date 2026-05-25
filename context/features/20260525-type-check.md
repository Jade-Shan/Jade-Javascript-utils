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

## basic.ts 检查报告

### 代码质量问题

**1. `NumUtil.sub` 声明了未使用的变量 ([basic.ts:123](src/scripts/ts/basic.ts#L123))**

```typescript
let mStr = value.toString();  // 从未使用
```

**2. `NumUtil.unformat` 中 `parseInt` 缺少进制参数 ([basic.ts:88](src/scripts/ts/basic.ts#L88))**

```typescript
return ns.includes(".") ? parseFloat(ns) : parseInt(ns);  // 应为 parseInt(ns, 10)
```

**3. `TimeUtil.sleep` 参数名拼写错误 ([basic.ts:438](src/scripts/ts/basic.ts#L438))**

```typescript
resolve: (parm: any) => void  // parm → param
```

**4. `TimeUtil.format` 使用了已废弃的 `RegExp.$1` ([basic.ts:453](src/scripts/ts/basic.ts#L453))**

`RegExp.$1` 是非标准属性，在严格模式下行为不确定。建议改用 `String.prototype.replace` 回调或 `match()`。

**5. `StrUtil.format` 用 `for...in` 遍历数组 ([basic.ts:242](src/scripts/ts/basic.ts#L242))**

当 `args` 为数组时，`for...in` 遍历的是索引字符串，虽然能工作，但不符合最佳实践，也会遍历到原型上的可枚举属性。


### 总结

| 类别 | 数量 |
|------|------|
| 潜在逻辑 Bug | 0 |
| 代码质量问题 | 6 |

最值得优先修复的是：**#5**（`StrUtil.format` 用 `for...in` 遍历）、**#4**（`TimeUtil.format` 使用废弃的 `RegExp.$1`）。
