# basic.ts 检查报告

## TimeUtil 类分析

### Bug

#### 1. `getLocalTimeZone()` 对非整数时区返回错误格式

[basic.ts:549-552](src/scripts/ts/basic.ts#L549-L552)

```typescript
static getLocalTimeZone(): string {
    const d = new Date();
    return (`GMT${- d.getTimezoneOffset() / 60}`);
}
```

`getTimezoneOffset()` 返回分钟数，除以 60 对非整数时区会产生浮点数。例如：
- 印度 (UTC+5:30): 返回 `"GMT5.5"`，应为 `"GMT5:30"`
- 尼泊尔 (UTC+5:45): 返回 `"GMT5.75"`，应为 `"GMT5:45"`

**修复建议**：分别计算小时和分钟，格式化为 `GMT±H:MM`。

### 潜在问题

#### 2. `getDateArea()` 语义不清晰且未被使用

[basic.ts:535-543](src/scripts/ts/basic.ts#L535-L543)

- `d2` 会经过 `cleanDay()` 处理（重置为当天零点），但 `d1` 不会。这导致返回值中 `floor`/`ceil` 的时间精度不对称。
- 全仓库没有调用该方法（`grep -rn "getDateArea"` 仅找到定义），建议确认后移除以减少维护负担。

#### 3. `sleep()` 参数名拼写错误

[basic.ts:403](src/scripts/ts/basic.ts#L403)

`milSecs` 应为 `milliSecs`（少了一个 `l`）。但修改会影响调用方（[sandtable.ts:471](src/scripts/ts/sandtable.ts#L471)、[testJadeTRPG.ts:305](src/scripts/ts/testJadeTRPG.ts#L305)），需要同步更新。

### 优化建议

#### 4. `format()` 每次调用创建 7 个 RegExp 实例

[basic.ts:417-436](src/scripts/ts/basic.ts#L417-L436)

`processPart` 内部每次调用 `new RegExp(...)` 构造正则。可将 7 个正则对象提升为 `static readonly` 字段，避免重复创建。

#### 5. `addMilliseconds` 与其他 add* 方法实现风格不一致

[basic.ts:445-449](src/scripts/ts/basic.ts#L445-L449)

`addMilliseconds` 使用 `setTime(getTime() + ms)`，而 `addSeconds`/`addDays` 等使用 `setSeconds(getSeconds() + secs)` 风格。统一为 `setTime` 风格会更一致（`addMilliseconds` 本身就是最底层的方式）。

#### 6. 缺少 `addHours`/`addMinutes` 方法

虽然定义了 `UNIT_HOUR` 和 `UNIT_MIN` 常量，但没有对应的 `addHours`/`addMinutes` 便捷方法。按需补充。
