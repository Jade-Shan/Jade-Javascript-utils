---
name: tsconfig-moduleresolution
description: tsconfig.json 的 moduleResolution 为什么用 bundler（node10 已弃用）
metadata: 
  node_type: memory
  type: project
  originSessionId: 2c810ad8-957b-4889-8963-5b11f52e32d5
  modified: 2026-09-16T08:33:40.929Z
---

2026-09-16 将 [tsconfig.json](tsconfig.json) 的 `moduleResolution` 从 `node10` 改为 `bundler`。

背景：`node10`（旧名 `node`）是弃用值，TypeScript 6.0 起标记弃用、7.0 移除。项目锁定 `typescript ^5.8.3`（实际 5.8.3，此时 `node10` 尚不报错），但 IDE 用更新的 TS 6.x 时会出现提示：`Option 'moduleResolution=node10' is deprecated... Specify '"ignoreDeprecations": "6.0"'`。

**为什么选 bundler**（实测，node v22.22.2 + tsc 5.8.3）：

| 候选 | 实测结果 | 说明 |
|------|---------|------|
| `bundler` | ✅ 编译通过 | 官方为现代 ESM/浏览器项目推荐的解析模式，契合本项目「无打包器 + `module: ES6` + 相对 import 带 `.js`」 |
| `node16` / `nodenext` | ❌ 报 `TS5110` | 要求 `module` 也改成 `node16`，面向 Node.js 运行时，不适合浏览器项目 |
| 加 `ignoreDeprecations: "6.0"` | 治标不治本 | 只静默警告，未来升级 TS 仍需改 |

**Why:** `node10` 迟早被 TS 移除，趁早换成契合项目定位的 `bundler`，避免升级 TS 时踩坑。

**How to apply:** 未来升级 TypeScript 到 6.x/7.x 时不要再改回 `node10`；若 IDE 又出现 TS 版本不一致的提示，在 VSCode 开启「TypeScript: Use Workspace Version」，让 tsserver 读 `node_modules` 里的 5.8.3。
