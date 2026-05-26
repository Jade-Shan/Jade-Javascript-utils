# web.ts 检查报告

## 严重 Bug

### 1. `xhr.send()` 没有发送请求体 — web.ts:98

`xhr.send()` 应该传 `req.body`，否则 POST 请求的 body 永远不会被发送。

### 2. `requestHttp` 吞掉所有错误 — web.ts:135

```typescript
return await doHttp<T, R>(req, hdl).then(resp => resp).catch(resp => resp);
```

`.then(resp => resp).catch(resp => resp)` 是一个无操作透传，而且 `.catch(resp => resp)` 会把错误转成成功值，调用方永远看不到 HTTP 失败。

### 3. ~~`previewLocalImage` 数组越界~~ ✅ 已修复 — web.ts:471

```typescript
const count = uploader.files.length > images.length ? uploader.files.length : images.length;
```

这个取的是**最大值**，如果 files=5 但 images=1，count=5，访问 `images[4]` 会返回 `undefined`。应该是 `Math.min`。

### 4. ~~`imageElem.src` 设置在回调之前~~ ✅ 已修复 — web.ts:153-157

`src` 赋值在第 153 行，但 `onload`/`onerror`/`onabort` 在第 155-157 行才设置。对于浏览器缓存的图片，`onload` 可能在 `src` 赋值时就**同步触发**，此时回调还没绑定。

### 5. 缺少 onerror 时 Promise 永不 settle — web.ts:89-96

`onerror`/`ontimeout`/`onabort` 只有在用户提供了对应 handler 时才设置。如果请求出现网络错误且用户没传 `onError`，Promise 永远不会 resolve 或 reject，造成内存泄漏。

---
