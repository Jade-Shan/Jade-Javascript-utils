# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 准备工作

1. 语言使用简体中文
2. 加载skill `moe-kira`
3. 切换 node 版本为 v22.22.2

## 项目概览

jadeutils.v3 是一个个人前端工具库，作为 CDN 静态资源部署到 nginx。包含 TypeScript 通用工具库、HTML5 Canvas 2D 几何库、桌面式窗口 UI 系统、TRPG 沙盘，以及博客/Wiki 页面框架。CSS 主题使用 Less 编写。

## 构建命令

```bash
# 使用 .nvmrc 指定的 Node 版本 (v22.22.2)
nvm use

# 完整构建（编译 TS + Less → webroot/，生成 gnuplot 文档图片）
bash build.sh

# 编译 TypeScript + 压缩，生成 PlantUML 图片，部署到 nginx
bash deploy-test.sh

# 仅编译 TypeScript（含类型声明 .d.ts）
npx gulp process-typescript

# 编译并压缩 TypeScript（.min.js）
npx gulp compress-typescript

# 编译所有主题的 Less → CSS
npx gulp

# 单独编译 window-ui 主题
npx gulp process-style-window-ui

# 拷贝 TRPG 主题图片
npx gulp process-style-trpg
```

## 编译配置

- **无 `tsconfig.json`** — TypeScript 编译选项（`target: "es6"`, `module: "es6"`, `strict: true`, `noImplicitAny: true`, `declaration: true`）内联在 `gulpfile.js` 第 174-182 行的 `process-typescript` 任务中
- **无 `package.json` scripts** — 不通过 `npm run` 构建，构建脚本直接调用 `node ./node_modules/gulp-cli/bin/gulp.js` 或 `npx gulp`
- **无打包器** — 不使用 Webpack/Rollup/Vite，TypeScript 编译为 ES6 模块后由浏览器原生 `<script type="module">` 直接加载
- **无自动化测试框架** — `testJadeUtils.ts`、`testJadeUI.ts`、`testJadeTRPG.ts` 是浏览器手动测试页面脚本，随源码一起编译，通过 `src/html/` 下的 HTML 页面在浏览器中运行

## 源码架构

TypeScript 源文件按依赖顺序排列（gulpfile.js 中的编译顺序即依赖顺序）：

### 基础层（无内部依赖）
- `src/scripts/ts/basic.ts` — 基础工具：NumUtil（数字格式化）、StrUtil、TimeUtil、ColorRGB
- `src/scripts/ts/dataStructure.ts` — 数据结构：SimpleMap（顺序保留的 Map 实现）、SimpleStack、SimpleQueue

### 资源与 Web 基础
- `src/scripts/ts/resource.ts` — Base64 内嵌图标、默认图片资源（DefaultIconGroup, IconGroup），依赖 dataStructure 和 web
- `src/scripts/ts/web.ts` — HTTP 请求（WebUtil.ajax）、Base64 图片类型定义（IBase64Img, Base64ImgType）、自定义 HTML 元素 EscapeUnicode，依赖 basic 和 dataStructure

### 几何与图形层
- `src/scripts/ts/geo2d.ts` — 2D 几何库：Point2D, Line2D, Rectangle2D, Circle2D, Polygon2D, Ray2D。定义 IGeo2D / GeoShape2D 接口，提供碰撞检测、最近点计算。依赖 basic（NumUtil）
- `src/scripts/ts/canvas.ts` — Canvas 2D 绘图抽象：ICanvas2D 接口、CanvasShape2D 基类、ImageClip 图片裁剪，依赖 geo2d 和 web

### Web 页面层
- `src/scripts/ts/webHtmlPage.ts` — 通用 HTML 页面框架：PageConfig, WebHtmlPage 类（导航栏、侧栏、页脚、搜索渲染），依赖 web
- `src/scripts/ts/3rdLibTool.ts` — 第三方库封装：SyntaxHighlighterHelper, MathJaxHelper, BootStrapHelper, DataTableHelper, ShowdownUtils。包装全局脚本库（jQuery `$`、MathJax、SyntaxHighlighter、showdown）

### 业务应用层
- `src/scripts/ts/wiki.ts` — Wiki 页面，依赖 webHtmlPage 和 3rdLibTool
- `src/scripts/ts/blog.ts` — 博客页面（用户信息、推荐文章列表、评论系统），依赖 webHtmlPage、web 和 3rdLibTool
- `src/scripts/ts/UIWindow.ts` — 桌面式窗口 UI 系统：可拖拽/缩放的窗口、Dock 任务栏、Z-index 管理、桌面配置，依赖 dataStructure、geo2d、resource 和 web
- `src/scripts/ts/sandtable.ts` — TRPG 战棋沙盘：Token 管理、视野/可见性（glimmer/dark）、Canvas 战争迷雾，依赖 basic、canvas、geo2d 和 web

### 测试/Demo（编译但不互相依赖）
- `src/scripts/ts/testJadeTRPG.ts`, `testJadeUtils.ts`, `testJadeUI.ts` — 浏览器手动测试/Demo 脚本，非自动化测试。通过 `src/html/` 下的 HTML 页面使用 `<script type="module">` 加载

### TypeScript 声明引用
- `src/scripts/include/refTypes.d.ts` — 外部类型声明（目前为空，曾被用于 jQuery 声明）

## 模块加载方式

项目不使用打包器。在浏览器中通过两种方式加载：

### ES Module 原生加载

编译后的 `.js` 文件通过 `<script type="module">` 加载，import 语句使用 `.js` 扩展名：

```typescript
// 源码中 import 使用 .js 扩展名（对应编译产物）
import { NumUtil } from './basic.js';
import { SimpleMap } from './dataStructure.js';
```

### 第三方库全局脚本

jQuery、Bootstrap、MathJax、SyntaxHighlighter、DataTables、Showdown 通过传统 `<script>` 标签加载为全局变量（`$`、`MathJax`、`SyntaxHighlighter`、`showdown`）。`3rdLibTool.ts` 在文件头部使用 `declare` 声明这些全局类型，封装为静态方法工具类：

```typescript
declare function $(cc: any): any;
declare namespace SyntaxHighlighter { ... }
declare namespace MathJax { ... }
```

## 编译输出

- TypeScript 编译为 ES6 模块（`target: "es6"`, `module: "es6"`），输出 `.js` 和 `.d.ts` 到 `webroot/scripts/ts/`
- 严格模式：`noImplicitAny: true`, `strict: true`
- Less 主题编译为合并后的 `all.css` 和 `all.min.css`，输出到 `webroot/themes/<theme>/styles/`

## 目录结构

| 目录 | 用途 |
|------|------|
| `src/scripts/ts/` | TypeScript 源码 |
| `src/scripts/include/` | 外部类型声明 |
| `src/themes/` | Less 源文件（hobbit, lo-fi, paper-print）+ 图片资源 + window-ui 样式 + trpg 纯图片 |
| `src/html/` | HTML 测试页面 |
| `webroot/` | 构建产物输出目录 |
| `docs/` | 文档（geo.md, gnuplot 数学图表, plantuml UML 图, cric.tt01.png 三角函数参考图） |

## 部署

- **nginx 本地路径**: `deploy-test.sh` 将编译产物拷贝到 `/home/ecs-user/workspace/nginx/jadecdn/webroot/jadeutils.v3/`
- `deploy-test.sh` 被 `.gitignore` 忽略，属于本地配置文件，不在版本控制中
- 生产部署作为 CDN 静态资源，通过 `webroot/jadeutils.v3/` 路径提供服务

## 编码模式

- **接口/实现分离** — geo2d、canvas、sandtable 层使用 `IXxx` 接口 + `class Xxx implements IXxx` 模式。接口定义只读契约，类提供实现和可变属性
- **工具命名空间** — 纯函数工具集使用 namespace 组织：`Geo2DUtils`、`CanvasUtils`、`SandTableUtils`、`JadeWindowUI`
- **静态方法工具类** — 基础层的 `NumUtil`、`StrUtil`、`TimeUtil`、`WebUtil` 等使用全静态方法的类
- **应用入口** — `WikiPage.initWikiPage()` 和 `BlogPage.initWikiPage()` 是页面级入口，各自组织完整页面的初始化流程

## 主题系统

项目有两套独立的主题系统：

### 内容主题（hobbit / lo-fi / paper-print）

定义在 `gulpfile.js` 的 `themes` 数组中，用于博客和 Wiki 页面。采用 **`comm.less` + `part.1.less`** 变量模式：

- `src/themes/comm.less` — 共享的结构样式（450+ 行），所有视觉属性通过 Less 变量引用（`@text-color-main`、`@page-bg-img`、`@title-color-fg-h1` 等），只使用变量不定义值
- `src/themes/<theme>/styles/part.1.less` — 各主题定义这些变量的具体值，通过不同的颜色/字体/图片实现视觉差异
- 构建时 gulp 将两者合并为 `all.less`，编译为 `all.css` 和 `all.min.css`

### window-ui 主题

独立的窗口管理器 UI 样式，不参与 comm.less 体系：
- `src/themes/window-ui/styles/desktop.less` — 桌面式窗口 UI 样式（`.desktop`、`.window`、`.dock-bar` 等），通过独立 gulp 任务 `process-style-window-ui` 编译

### TRPG 资源（纯图片，无 CSS）

`src/themes/trpg/` 仅包含 `images/` 目录下的 3 张图片（`default.jpg`、`icons.jpg`、`map.jpg`），供沙盘 Canvas 使用。无 `styles/` 目录，不参与 Less 编译。通过 gulp 任务 `process-style-trpg` 拷贝到 webroot。

### 主题切换

`WebHtmlPage.changeTheme(themeName)` 通过启用/禁用 `<link rel="alternate stylesheet">` 标签实现主题切换。当前主题持久化到 cookie（`ui.theme`），`initUITheme()` 在页面加载时读取 cookie 恢复主题。


## 待跟进的后端 API 问题

以下的问题要等后端的API修复以后才能修改。检查代码与修复问题时要保留以下表中的问题：

| API | 问题 | 前端影响 | 状态 |
|-----|------|---------|------|
| `GET /api/blog/loadRecommandArticles` | 路径及返回字段 `recommands` 拼写错误，应为 `recommends` | `blog.ts` 中 `RecommendArticlesResp.recommands` 字段名需与后端保持一致，待后端修正后前端同步改为 `recommends` | 等待后端修改 |
| `GET /api/blog/loadByUser` | 返回的 `pageCount` 值不准确（比实际总页数少 1） | `blog.ts` 第 154 行对 `pageCount + 1` 做了临时补偿，后端修正后需去掉 `+ 1` | 等待后端修改 |



## 当前进度

当前进度记录在文件 `context/current-feature.md` 中。