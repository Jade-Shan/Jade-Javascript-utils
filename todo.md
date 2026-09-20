# 代码检查与优化进度

## 2026-05-26 — basic.ts StrUtil 类审查

检查了 `src/scripts/ts/basic.ts` 中 `StrUtil` 类（第 198-381 行），发现以下问题。

### 错误与隐患

#### 1. `utf8to16` 缺少兜底分支 — basic.ts:336-358

`switch (c >> 4)` 缺少 `case 8-11` 及 `default` 分支。对于非法的 UTF-8 数据（如孤立的 continuation byte 0x80-0xBF），代码会静默跳过。建议加 `default` 处理。

#### 2. `format` 中 `null` 值会被转成字符串 `"null"` — basic.ts:269

```typescript
if (undefined !== value) { ... }
```

当 value 为 null 时，`null !== undefined` 为 true，`join(null)` 会输出字面量 "null"。应改为 `value != null`（同时排除 null 和 undefined）。

#### 3. `replaceByRegex` 替换字符串中的 `$` 有特殊含义 — basic.ts:285

`String.replace()` 中 `$&`、`$1` 等有特殊含义，若 newStr 包含 `$` 会被意外解释。需转义或改用函数替换。

### 总结

核心问题是 **base64encode/base64decode 无法处理中文**（会直接抛异常）和 **utf16to8 对 NUL 字符编码错误**，这两个会导致运行时 bug。其他 API 弃用和边界 case 问题也值得修复。
