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

### 潜在的逻辑 Bug

**1. `NumUtil.format` 正负数判断有误 ([basic.ts:48](src/scripts/ts/basic.ts#L48))**

```typescript
let isPositive: boolean = num == n;  // num = Math.abs(n)
```

`Math.abs(-0)` 返回 `0`，而 `0 == -0` 为 `true`，所以 `-0` 会被判定为正数，格式化结果不显示负号。虽然 `-0` 很罕见，但逻辑应改为 `n >= 0` 更清晰。

**2. `StrUtil.format` 的正则替换可能失败 ([basic.ts:244](src/scripts/ts/basic.ts#L244))**

```typescript
result = result.replace("\\{" + key + "\\}", value);
```

这里 `replace` 的第一个参数是字符串（不是正则），所以 `\\{` 是字面量 `\{`，但格式字符串中是 `{name}` 不是 `\{name\}`。这意味着**替换实际上不会匹配任何内容**——格式字符串 `"我是{name}"` 中用的是 `{name}`，但这里匹配的是 `\{name\}`。

### 代码质量问题

**3. `var` / `let` 混用**

文件中有大量 `var` 与 `let` 混用的情况，在 ES6 严格模式下应统一使用 `let`/`const`：
- [basic.ts:103](src/scripts/ts/basic.ts#L103)：`var value`
- [basic.ts:123](src/scripts/ts/basic.ts#L123)：`let mStr`（声明后未使用，属于死代码）
- [basic.ts:137](src/scripts/ts/basic.ts#L137)：`var m = 0, s1 = ..., s2 = ...`（`var`/`let` 混在同一行）
- [basic.ts:242-243](src/scripts/ts/basic.ts#L242-L243)：`for (var key in data)`
- TimeUtil 中几乎所有方法都用 `var date`：[basic.ts:493](src/scripts/ts/basic.ts#L493), [508](src/scripts/ts/basic.ts#L508), [522](src/scripts/ts/basic.ts#L522), [537](src/scripts/ts/basic.ts#L537), [548](src/scripts/ts/basic.ts#L548), [562](src/scripts/ts/basic.ts#L562), [579](src/scripts/ts/basic.ts#L579), [594](src/scripts/ts/basic.ts#L594)

**4. `NumUtil.sub` 声明了未使用的变量 ([basic.ts:123](src/scripts/ts/basic.ts#L123))**

```typescript
let mStr = value.toString();  // 从未使用
```

**5. `NumUtil.unformat` 中 `parseInt` 缺少进制参数 ([basic.ts:88](src/scripts/ts/basic.ts#L88))**

```typescript
return ns.includes(".") ? parseFloat(ns) : parseInt(ns);  // 应为 parseInt(ns, 10)
```

**6. `TimeUtil.UNIT_HUR` 拼写错误 ([basic.ts:434](src/scripts/ts/basic.ts#L434))**

`UNIT_HUR` 应为 `UNIT_HR` 或 `UNIT_HOUR`。

**7. `TimeUtil.getDateArea` 注释错误 ([basic.ts:571-577](src/scripts/ts/basic.ts#L571-L577))**

注释写的是"取得两天之间的时间范围"，但该函数参数是 `ms`（毫秒），不是天数。这是从 `getTimeArea` 复制粘贴残留的错误。

**8. `TimeUtil.sleep` 参数名拼写错误 ([basic.ts:438](src/scripts/ts/basic.ts#L438))**

```typescript
resolve: (parm: any) => void  // parm → param
```

**9. `TimeUtil.cleanDay` 不必要的 `new Date()` 调用 ([basic.ts:548](src/scripts/ts/basic.ts#L548))**

```typescript
var newDate = new Date();        // 创建当前时间
newDate.setTime(date.getTime()); // 立即覆盖
```

应直接写为 `new Date(date.getTime())`。

**10. `TimeUtil.format` 使用了已废弃的 `RegExp.$1` ([basic.ts:453](src/scripts/ts/basic.ts#L453))**

`RegExp.$1` 是非标准属性，在严格模式下行为不确定。建议改用 `String.prototype.replace` 回调或 `match()`。

**11. `StrUtil.format` 用 `for...in` 遍历数组 ([basic.ts:242](src/scripts/ts/basic.ts#L242))**

当 `args` 为数组时，`for...in` 遍历的是索引字符串，虽然能工作，但不符合最佳实践，也会遍历到原型上的可枚举属性。

**12. `StrUtil.replaceAll` 命名误导 ([basic.ts:255-257](src/scripts/ts/basic.ts#L255-L257))**

方法名叫 `replaceAll`，暗示替换字面量字符串。但 `exp` 参数被直接传给 `new RegExp(exp, "gm")`，意味着它是正则表达式模式，其中的特殊字符（`.`、`*`、`+` 等）会被当作正则元字符处理。

**13. UTF 转换函数不支持代理对 / 四字节字符 ([basic.ts:282-333](src/scripts/ts/basic.ts#L282-L333))**

`utf16to8` 和 `utf8to16` 只处理 BMP 字符（U+0000~U+FFFF）。Emoji 等补充平面字符使用 UTF-16 代理对，编码/解码会出错。`utf8to16` 的 switch 语句缺少 `case 15`（4 字节 UTF-8 序列 `11110xxx`），这类字符会静默丢失。

**14. `TimeUtil.getLocalTimeZoneName` 使用了过时/废弃的时区 ID ([basic.ts:602-673](src/scripts/ts/basic.ts#L602-L673))**

大量使用 `US/Pacific`、`US/Mountain`、`US/Eastern` 等已废弃的时区标识符（应使用 `America/Los_Angeles` 等）。返回 `'Not in US'` 也有误导性——很多非美国时区也不在查找表中。

### 总结

| 类别 | 数量 |
|------|------|
| 潜在逻辑 Bug | 2 |
| 代码质量问题 | 12 |

最值得优先修复的是：**#2**（`StrUtil.format` 替换正则不生效）、**#1**（`-0` 格式化问题）、**#13**（UTF 转换不支持 emoji）。
