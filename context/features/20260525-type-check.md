# TypeScript 类型检查报告

> 检查日期: 2026-05-25
> 编译器配置: `target: es6`, `module: es6`, `noImplicitAny: true`, `strict: true`
> 检查结果: 编译通过（无编译错误），以下是代码审查中发现的类型问题与优化建议

---

## 一、类型错误（Type Errors）

### 1. `StrUtil.format` 参数类型与实现不一致

**文件:** [src/scripts/ts/basic.ts#L232](src/scripts/ts/basic.ts#L232)

```typescript
static format(s: string, args: string): string {
```

`args` 参数声明为 `string`，但函数体内把它当对象/数组使用：

```typescript
if (arguments.length == 1 && typeof (args) == "object") {
    data = args;
}
for (var key in data) { ... }
```

应该改为 `args: any` 或者做函数重载。

---

### 2. `Boolean` 包装类型误用（应使用 `boolean` 原始类型）

**文件:** [src/scripts/ts/UIWindow.ts#L575](src/scripts/ts/UIWindow.ts#L575)

```typescript
type WinCfg = {
    scalable: Boolean,  // ❌ 这是 Boolean 对象类型，不是 boolean 原始类型
    ...
};
```

同样问题在 [WinParam](src/scripts/ts/UIWindow.ts#L588): `scalable?: Boolean`。应该改为小写的 `boolean`。`Boolean` 是对象包装器类型，几乎不应该在类型注解中使用。

---

### 3. `setProperty` 传入了 `number` 而非 `string`

**文件:** [src/scripts/ts/UIWindow.ts#L839](src/scripts/ts/UIWindow.ts#L839)

```typescript
let scale = sizeCurve(x);  // 返回 number
elm.style.setProperty('--i', scale);  // ❌ setProperty 的 value 参数需要 string
```

应该改为 `String(scale)` 或 \`${scale}\`。

---

## 二、可优化的类型（Optimizable Types）

### 4. 泛型 `T extends any` 多余

**文件:** [src/scripts/ts/web.ts#L39-L59](src/scripts/ts/web.ts#L39-L59)

```typescript
export interface HttpRequest<T extends any> { ... }
export interface HttpResponse<T extends any> { ... }
export interface HttpRequestHandler<T extends any, R extends any> { ... }
```

`T extends any` 等同于不加约束，直接写 `HttpRequest<T>` 即可，更简洁。

---

### 5. `any | null` 可精确化为具体类型

**文件:** [src/scripts/ts/3rdLibTool.ts#L231](src/scripts/ts/3rdLibTool.ts#L231)

```typescript
let showdownConveter: any | null = null;
```

可以改为 `showdown.Converter | null`，利用文件顶部已有的 `declare namespace showdown` 声明。

---

### 6. `direction` 类型可收窄为联合类型

**文件:** [src/scripts/ts/UIWindow.ts#L22-L27](src/scripts/ts/UIWindow.ts#L22-L27)

```typescript
type ScalingWindow = {
    direction?: number,  // 实际值是 1-9 的特定常量
    ...
};
```

可以用更精确的类型如 `direction?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`，让类型系统帮助防错。

---

## 三、逻辑/健壮性问题（与类型相关）

### 7. `NumUtil.format` 中 `sign` 计算逻辑错误

**文件:** [src/scripts/ts/basic.ts#L48](src/scripts/ts/basic.ts#L48)

```typescript
let num: number = Math.abs(n);
let sign = num == n;  // sign 永远为 true，因为 num === Math.abs(n)
```

应为 `let sign = n >= 0;`。

---

### 8. `pop()` 方法对 falsy 值处理不当

**文件:** [src/scripts/ts/dataStructure.ts#L169-L175](src/scripts/ts/dataStructure.ts#L169-L175)

```typescript
pop(): (T | null) {
    let c = this.recs.pop();
    return c ? c : null;  // ❌ 如果 T 是 0、""、false，会错误返回 null
}
```

应改为 `return c !== undefined ? c : null;`。`SimpleQueue.pop()`（同文件 L258-265）有同样的问题。

---

### 9. `deleteCooke` 函数名拼写错误且功能未完成

**文件:** [src/scripts/ts/web.ts#L287-L290](src/scripts/ts/web.ts#L287-L290)

```typescript
static deleteCooke(name: string): void {
    let d = new Date();
    d.setTime(d.getTime() + ((-1 * TimeUtil.UNIT_DAY)));
}
```

- 函数名拼写错误：`deleteCooke` → 应为 `deleteCookie`
- 函数体计算了过期时间但没有写入 `document.cookie`，无法真正删除 cookie

---

## 总结

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 类型错误 | 3 | `StrUtil.format` 参数类型、`Boolean` 包装类型误用、`setProperty` 参数类型 |
| 可优化类型 | 3 | 多余泛型约束 `T extends any`、`any` 可精确化、`number` 可收窄为联合类型 |
| 逻辑/健壮性 | 3 | `sign` 逻辑错误、`pop()` falsy 值处理、`deleteCooke` 未完成实现 |
