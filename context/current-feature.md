# basic.ts 检查报告

## NumUtil 专项审查（2026-05-26）

针对 `NumUtil` 类的深度审查，聚焦于**尚未在现有报告中覆盖**的问题。

### Bug

1. **`add/sub/mul/div` 科学计数法 Bug** — `n.toString()` 对极小/极大数会输出科学计数法。例如 `0.0000001` → `"1e-7"`，`split(".")[1]` 返回 `undefined`，小数位数计为 0，精度丢失。更严重的是混合格式 `1.234567e-7`，`split(".")[1]` 捕获 `"234567e-7"`，指数部分被错误计入小数位数，`replace(".", "")` 仅移除第一个小数点导致数字变形。**触发条件**：数值绝对值 < 1e-6 或 > 1e21。

   ```typescript
   // 验证用例
   NumUtil.mul(1.234567e-7, 0.1);  // 预期 1.234567e-8，实际返回错误值
   ```

2. **`createCurve` 除零风险**（[basic.ts:183](src/scripts/ts/basic.ts#L183)）— `totalXDis = 0` 时 `(x - beginX) / totalXDis` → `Infinity`，`Math.sin(Infinity)` → `NaN`，曲线函数返回 `NaN` 向上传播。

3. **`unformat` 无边界防御**（[basic.ts:95-98](src/scripts/ts/basic.ts#L95-L98)）— 空字符串 `""` 经 `replace()` 后仍为 `""`，`parseInt("", 10)` → `NaN`。仅含 `-` 或 `.` 的输入同理。

### 可优化点

4. **`format` 中 `numStr` 死赋值**（[basic.ts:54](src/scripts/ts/basic.ts#L54)）— `let numStr: string = n.toString()` 仅在 catch 块使用，正常路径从未读取。应移入 catch 块。

5. **`format` 小数补零用字符串拼接**（[basic.ts:62-64](src/scripts/ts/basic.ts#L62-L64)）— 循环内 `s2 = s2 + '0'` 每次新建字符串。可替换为 `s2 = s2.padEnd(m, '0')`。

6. **`div` 冗余乘除**（[basic.ts:154-155](src/scripts/ts/basic.ts#L154-L155)）— `* Math.pow(10, m + 1) / 10` 等价于 `* Math.pow(10, m)`，多一次浮点乘除。

7. **`format` 无效检查**（[basic.ts:38](src/scripts/ts/basic.ts#L38)）— `String.split()` 始终返回 ≥1 元素的数组，`if (pArr.length > 0)` 永远为真。

8. **`add`/`sub` 混用 `let`/`const`** — `add`（[basic.ts:110](src/scripts/ts/basic.ts#L110)）用 `let value`，`sub`（[basic.ts:124](src/scripts/ts/basic.ts#L124)）用 `const value`。建议统一为 `const`。

9. **`mul` 多余的 `m = 0` 初始化**（[basic.ts:135](src/scripts/ts/basic.ts#L135)）— `let m = 0, s1 = ..., s2 = ...`，随后立即用 `+=` 累加，初始化为 0 后立刻覆盖。可拆为 `const s1 = ..., s2 = ...; let m = ...`，去掉 0 初始值。

### 优先级

| 优先级 | 项目 | 理由 |
|--------|------|------|
| P0 | #1 科学计数法 Bug | 静默返回错误数值 |
| P1 | #2 除零 | NaN 传播破坏下游逻辑 |
| P2 | #3 边界防御 | 脏输入无保护 |
| P3 | #4~#9 优化 | 不影响正确性，改善代码质量 |
