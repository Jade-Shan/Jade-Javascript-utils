# web.ts 检查报告

## 严重 Bug

### 1. `xhr.send()` 没有发送请求体 — web.ts:98

`xhr.send()` 应该传 `req.body`，否则 POST 请求的 body 永远不会被发送。

### 2. `requestHttp` 吞掉所有错误 — web.ts:135

```typescript
return await doHttp<T, R>(req, hdl).then(resp => resp).catch(resp => resp);
```

`.then(resp => resp).catch(resp => resp)` 是一个无操作透传，而且 `.catch(resp => resp)` 会把错误转成成功值，调用方永远看不到 HTTP 失败。

### 3. `previewLocalImage` 数组越界 — web.ts:471

```typescript
const count = uploader.files.length > images.length ? uploader.files.length : images.length;
```

这个取的是**最大值**，如果 files=5 但 images=1，count=5，访问 `images[4]` 会返回 `undefined`。应该是 `Math.min`。

### 4. `imageElem.src` 设置在回调之前 — web.ts:153-157

`src` 赋值在第 153 行，但 `onload`/`onerror`/`onabort` 在第 155-157 行才设置。对于浏览器缓存的图片，`onload` 可能在 `src` 赋值时就**同步触发**，此时回调还没绑定。

### 5. 缺少 onerror 时 Promise 永不 settle — web.ts:89-96

`onerror`/`ontimeout`/`onabort` 只有在用户提供了对应 handler 时才设置。如果请求出现网络错误且用户没传 `onError`，Promise 永远不会 resolve 或 reject，造成内存泄漏。

---

## 中等问题

### 6. `doHttp` 多余的 `async` — web.ts:62

函数内部已显式 `new Promise` 并 `return`，没有用 `await`。`async` 反而会把返回的 Promise 再包一层，徒增开销。

### 7. `param.elem;` 无意义的死语句 — web.ts:159

只是读取属性，什么都不做。

### 8. `fileExt` 赋值后从未使用 — web.ts:372

计算了文件扩展名但后续没有任何地方引用它。

### 9. `goUrl` / `openWindow` 代码重复 — web.ts:214-253

两个方法几乎一模一样，唯一区别是 `openWindow` 多了 `el.target = '_blank'`，可以合并。

### 10. 图片扩展名正则 `.` 未转义 — web.ts:359

```typescript
postfix.match(/.jpg|.gif|.png|.bmp/i)
```

`.` 匹配任意字符，应该写成 `\.jpg|\.gif|\.png|\.bmp`。另外 `.test()` 比 `.match()` 更适合布尔判断。

### 11. 手机号正则 `[3|4|5|8]` 包含字面量 `|` — web.ts:348

字符类中 `|` 就是普通字符，这个正则会匹配 `1`,`|`,`3`,`4`,`5`,`8`。应该写成 `[3458]`。

### 12. 正则 `/m` flag 多余 — web.ts:12

没有使用 `^` 或 `$`，multiline 标记无实际作用。

---

## 轻微问题

### 13. 拼写 `ingoreCache` → `ignoreCache` — web.ts:33, web.ts:70
### 14. JSHint 注释是死代码 — web.ts:1
### 15. `charCodeAt(0)` 对 emoji 等非 BMP 字符取到代理对半值 — web.ts:183, web.ts:193
