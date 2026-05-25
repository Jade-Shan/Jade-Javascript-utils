# TypeScript 类型错误与可优化类型定义 — 检查报告

## 概述

对 `src/scripts/ts/` 下所有源文件的类型定义和代码质量进行了全面审查。已修复的问题：data URI 空格、HTML href 多余引号、`String`→`string`、`Promise<any>`→`Promise<void>`、冗余 `extends any`、`any`→`BlobPart`、5 处拼写问题（Tengent→Tangent、Conveter→Converter、Adpt→Adapter、oppColor→oppositeColor）。

---

## 一、运行时 Bug / 逻辑错误（高优先级）

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


## 三、接口/类型定义优化建议（低优先级）

