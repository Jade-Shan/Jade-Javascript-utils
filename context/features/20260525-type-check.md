# TypeScript 类型错误与可优化类型定义 — 检查报告

## 概述

对 `src/scripts/ts/` 下所有源文件的类型定义和代码质量进行了全面审查。已修复的问题：data URI 空格、HTML href 多余引号、`String`→`string`、`Promise<any>`→`Promise<void>`、冗余 `extends any`、`any`→`BlobPart`。

---

## 一、运行时 Bug / 逻辑错误（高优先级）

### 1. `sandtable.ts:264-265` — `oppColor().toString()` 返回 `[object Object]`

```typescript
let color = ColorRGB.fromHexTo140(this.color);
cvsCtx.strokeStyle = color.color.oppColor.toString();  // BUG
cvsCtx.strokeStyle = color.color.oppColor.toString();  // 下一行同样 BUG
```

`oppColor()` 返回 `{ color: ColorRGB, name: string }`，该对象没有自定义 `toString()`，在 Canvas strokeStyle 赋值时会得到字符串 `"[object Object]"`，而不是有效的 CSS 颜色。

**应改为:** `color.color.oppColor().color.toStrHex()` （`.color` 才是 `ColorRGB` 实例）。

### 2. `UIWindow.ts:1028` — 用 `offsetHeight` 计算 x 坐标

```typescript
win.status.lastPos.x = parent.offsetHeight - width; // BUG: 应该是 offsetWidth
```

计算窗口水平位置时错误地使用了 `offsetHeight`，应使用 `offsetWidth`。

### 3. `geo2d.ts:407-409` — `pointOfLineSide` 函数公式错误

```typescript
return (line.a.y - line.b.y) * p.x +
    (line.b.x - line.a.x) * p.y + line.a.x * line.a.y -
    line.b.x * line.a.y;  // BUG: 应该为 line.a.x * line.b.y - line.a.y * line.b.x
```

使用标准 2D 叉积公式 `(B-A) × (P-A)`，常数项应为 `A.x*B.y - A.y*B.x`，而非代码中的 `A.x*A.y - B.x*A.y`。该函数用于 `segmentsIntr` 和 `revolveRay`，可能导致相交检测和旋转角度计算错误。

---

## 二、类型标注问题（中优先级）

### 4. `basic.ts:48` — 变量名与语义不符

```typescript
let sign = num == n;  // true 表示非负（正数/零），false 表示负数
```

`sign` 变量名暗示"符号"，但 `true` 表示正号（无减号前缀），`false` 表示负号，命名容易混淆。建议改为 `nonNegative` 或 `isPositive`。

---

## 三、命名/拼写问题（低优先级）

| 文件 | 行号 | 当前名称 | 建议 |
|------|------|----------|------|
| `canvas.ts` | 257 | `genShapeTengentLine` | `genShapeTangentLine` |
| `canvas.ts` | 272 | `drawShapeTengentRays` | `drawShapeTangentRays` |
| `3rdLibTool.ts` | 231 | `showdownConveter` | `showdownConverter` |
| `UIWindow.ts` | 648 | `UIWindowAdpt` | `UIWindowAdapter` |
| `basic.ts` | 779 | `oppColor()` | `oppositeColor()` 或 `oppoColor()` |

---

## 四、接口/类型定义优化建议（低优先级）

### 5. `basic.ts:687` — 接口声明多余的 `;`

```typescript
export interface IColorRGB { readonly r: number, readonly g: number, readonly b: number };
```

末尾的分号不是必要的。

### 6. `UIWindow.ts` — 大量使用 `type` 定义对象结构

如 `IDesktopConfig`、`WinCfg`、`WinStatus`、`DockBarCfg` 等均用 `type` 定义。对于对象形状，`interface` 更符合项目其他部分的惯例（项目中 `IXxx` 模式均用 interface），且 `interface` 有更好的错误提示和可扩展性。

### 7. `web.ts:89-93` — `doHttp` 函数处理器绑定逻辑不完整

如果 `hdl` 参数传入但未提供 `onLoad`，Promise 永远不 resolve（也不会 reject，除非超时）。建议对核心的 `onLoad` 至少提供一个默认处理器，或者在缺少必要处理器时抛出错误。
