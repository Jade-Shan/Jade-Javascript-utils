# webHtmlPage.ts 代码审查报告

## Bug

### 3. 直接覆写 `elem.style` 导致内联样式丢失 (lines 391, 411, 418)

三处使用 `elem.style = \`...\`` 直接赋值整个 style 属性，会清空元素上已有的其他内联样式：

- line 391: `elem.style = \`height: ...px; transition: 1s;\``
- line 411: `elemInn.style = \`\``
- line 418: `elemInn.style = \`overflow: auto; padding: 0px 20px; height: 0px; transition: 1s;\``

应改为分别设置具体属性：

```typescript
elem.style.height = `${WebHtmlPage.caculateSideTocBoxHeight(margin)}px`;
elem.style.transition = '1s';
```

## 代码质量问题

### 4. 接口中残留注释掉的 constructor (lines 12-22)

`PageConfig` 接口中有一段被注释掉的 constructor 实现。接口不能有 constructor，应直接删除。

### 5. `BootstrapModalDialog` 声明但未使用 (line 5-7)

`declare interface BootstrapModalDialog` 仅声明了一个 `modal` 方法，但文件中没有任何地方引用它。可删除。

### 6. 缺少分号 (line 29)

```typescript
link?: string  // 缺少分号
// 其他字段都有分号: id?: string; isNewWin?: boolean;
```

### 7. 实例方法重复接收 `cfg` 参数 (lines 48, 276)

`renderTopNav(cfg, ...)` 和 `renderSubTitle(cfg, ...)` 是实例方法，类已有 `this.cfg`，但方法签名仍要求外部传入 `cfg`。要么改为使用 `this.cfg`，要么改为 static 方法。

### 8. `parseHTML` 缺少返回类型 (line 86)

```typescript
static parseHTML(html: string) {  // 应加上 : DocumentFragment
```

### 9. 多余空格 (line 96)

```typescript
count  = count  && count  > 0 ? count  : 1;  // 多余空格
```

### 10. 回调参数命名不统一 (lines 69, 75)

`forEach` 回调中使用 `value, idx, arrys`，其他地方的 forEach 使用 `elem, idx, parent`。`arrys` 还是拼写错误（应为 `array` 或直接用 `arr`）。建议统一为 `(item, index, _array)` 或简写 `(item)`。

## 设计建议（低优先级）

- `renderPaging` (line 92) 和 `renderPagination` (line 225) 功能高度重复 —— 前者用 DOM API 构建，后者用字符串拼接。可考虑统一为一种实现。
- `*BySelectorAll` 系列方法（lines 304, 318, 331, 344）是对应核心方法的薄封装，可直接内联到核心方法中或使用重载。
