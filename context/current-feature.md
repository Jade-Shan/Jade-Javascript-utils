# webHtmlPage.ts 代码审查报告

## 错误/Bug

### 1. `bindImageNewTab` 中的赋值副作用（Line 293）

```typescript
let elemArr = document.querySelectorAll<HTMLImageElement>(elemSlt = elemSlt ? elemSlt : 'img.atc-img');
```

`elemSlt = elemSlt ? elemSlt : ...` 这里的 `=` 是赋值而非比较，会意外修改传入的参数值。应改为：

```typescript
let elemArr = document.querySelectorAll<HTMLImageElement>(elemSlt ? elemSlt : 'img.atc-img');
```

### 2. `toggleSideTocWrap` 中 `else` 分支缺少空值检查（Line 433）

```typescript
if (elem.classList.contains("toc-close")) {
    // ...
    if (null != innerList && innerList.length > 0) {  // ← 有判空
        innerList.forEach(...);
    }
} else {
    elem.classList.add("toc-close");
    innerList.forEach(...);  // ← 没有判空，若 innerList 为空会抛异常
}
```

### 3. `renderPagination` 第二个省略号判断条件不一致（Line 264 vs Line 186）

两个方法做同一件事但条件不同：

| 方法 | 判断条件 |
|------|----------|
| `renderPaging` (Line 186) | `i < count` |
| `renderPagination` (Line 264) | `(i + 2) < count` |

`renderPagination` 的 `+2` 会导致页码空隙为 2 时就出现省略号，与 `renderPaging` 行为不一致——应该是同一个逻辑。

### 4. JSDoc 参数名与实际不符

- `renderTopNav` (Line 47): `@param cfg 顶部导航栏` — 实际 `cfg` 是 `PageConfig`，且缺少 `@param elemSlt`
- `renderSubTitle` (Line 282): `@param page` — 实际参数名是 `cfg`

## 可优化点

### 1. `renderPaging` 和 `renderPagination` 高度重复（~200 行）

一个返回 `HTMLUListElement`，一个返回 `string`，逻辑几乎相同。应让一个调用另一个，消除重复代码。

### 2. `renderTopNav` 大量使用 `navhtml = navhtml + '...'` 拼接（Line 48-78）

可读性远差于 `renderPagination` 中使用的模板字符串。且 `addLink` 函数额外接收 `cfg` 参数，但它本可以直接通过闭包使用外层的 `cfg`。

### 3. 到处使用 `elemSlt = elemSlt ? elemSlt : "default"` 模式

ES6 支持默认参数，这些可以直接写在函数签名中：

```typescript
// 当前
renderSubTitle(cfg: PageConfig, elemSlt?: string): void {
    let elem = document.querySelector(elemSlt ? elemSlt : "#subTitle");

// 建议
renderSubTitle(cfg: PageConfig, elemSlt: string = "#subTitle"): void {
    let elem = document.querySelector(elemSlt);
```

### 4. `null !=` 判空模式可简化

```typescript
// 当前
if (null != elemList && elemList.length > 0) {
// 建议（已编译到 ES6，支持可选链）
if (elemList?.length) {
```

### 5. 多处使用 `javascript:void(0);` 作为 `href` 值

这是一个过时的反模式，应该用 `event.preventDefault()` 或 `<button>` 替代。对已废弃的伪协议 `href` 在现代浏览器中可能触发 CSP 警告。

### 6. `renderTopNav` 中的 HTML 注入风险（Line 59 等）

直接拼接 `item.link`、`item.title` 到 HTML，若数据来源不可信会有 XSS 风险（数字类型的 `i`/`pageNo` 是安全的）。

### 7. 文件末尾多余空行（Line 521-531）

末尾有 11 行空白，应清理。
