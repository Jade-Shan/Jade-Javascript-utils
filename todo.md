# 代码检查与优化进度

## 2026-05-26 — basic.ts StrUtil 类审查

检查了 `src/scripts/ts/basic.ts` 中 `StrUtil` 类（第 198-381 行），发现以下问题。

### 错误与隐患

#### 1. `base64encode` / `base64decode` 不支持非 ASCII 字符 — basic.ts:369 / basic.ts:378

`btoa()` 对含有中文等非 Latin-1 字符的字符串会直接抛出 `InvalidCharacterError`。需先转 UTF-8 字节序列再编码：

```typescript
static base64encode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
    ));
}
```

#### 2. `utf16to8` 对 `\0` (NUL) 字符编码错误 — basic.ts:302-303

当 `c === 0` 时，条件 `c >= 0x0001 && c <= 0x007F` 为 false，会落入最后的 else 分支被错误地当作 2 字节 UTF-8 编码。应改为 `c <= 0x007F`：

```typescript
if (c <= 0x007F) {  // 原为 c >= 0x0001 && c <= 0x007F
    out.push(str.charAt(i));
}
```

#### 3. `utf8to16` 缺少兜底分支 — basic.ts:336-358

`switch (c >> 4)` 缺少 `case 8-11` 及 `default` 分支。对于非法的 UTF-8 数据（如孤立的 continuation byte 0x80-0xBF），代码会静默跳过。建议加 `default` 处理。

#### 4. `format` 中 `null` 值会被转成字符串 `"null"` — basic.ts:269

```typescript
if (undefined !== value) { ... }
```

当 value 为 null 时，`null !== undefined` 为 true，`join(null)` 会输出字面量 "null"。应改为 `value != null`（同时排除 null 和 undefined）。

#### 5. `replaceByRegex` 替换字符串中的 `$` 有特殊含义 — basic.ts:285

`String.replace()` 中 `$&`、`$1` 等有特殊含义，若 newStr 包含 `$` 会被意外解释。需转义或改用函数替换。

### 总结

核心问题是 **base64encode/base64decode 无法处理中文**（会直接抛异常）和 **utf16to8 对 NUL 字符编码错误**，这两个会导致运行时 bug。其他 API 弃用和边界 case 问题也值得修复。
