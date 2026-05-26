# resource.ts 检查报告

## 错误

### 1. 死代码 — `defaultErrImg50x50`（第 8 行）

定义了但从未被引用，可直接删除。

---

## 可优化点

### 2. `let` 应改为 `const`

`iconDefault01`、`iconDefault02`、`iconDefault03`、`imgDesktopBg` 从未被重新赋值，应改用 `const`。

```typescript
// 当前
let iconDefault01 = { ... };
// 应改为
const iconDefault01: IconGroup = { ... };
```

### 3. namespace 内的 `export let` 应改为 `export const` / `export function`

`getDefaultIcon`、`getDefaultIconBase64`、`defaultDesktopBackground` 都不会被重新赋值：

```typescript
// 当前
export let getDefaultIcon = (name: DefaultIconGroup): IconGroup => { ... }
// 应改为
export function getDefaultIcon(name: DefaultIconGroup): IconGroup { ... }
```

### 4. `getDefaultIconBase64` 连续 `if` 效率低（第 332-336 行）

5 个 `if` 条件会逐一检查，即使前面已匹配。应改用 `else if` 或查表：

```typescript
// 当前：5 个独立 if
if (size == IconSize.x12) { result = ...; }
if (size == IconSize.x16) { result = ...; }
// ...

// 建议：查表
const sizeMap: Record<IconSize, keyof IconGroup> = {
    [IconSize.x12]: "x12",
    [IconSize.x16]: "x16",
    [IconSize.x24]: "x24",
    [IconSize.x32]: "x32",
    [IconSize.x48]: "x48",
};
const key = sizeMap[size];
if (key) {
    const img = grp[key];
    result = `${img.format},${img.data}`;
}
```

### 5. Enum key 用 `.toString()` 存储（第 319-321 行）

数字枚举的 `.toString()` 返回 `"0"`、`"1"`、`"2"`，如果枚举定义顺序改变，映射会静默破坏。如果这是有意为之，建议加注释说明。

### 6. `getDefaultIcon` 静默回退（第 324 行）

传入未知值时静默返回 `iconDefault01`，没有任何警告。建议至少加日志，或者让调用方显式处理。
