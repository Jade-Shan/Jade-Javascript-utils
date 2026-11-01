# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 准备工作

1. 语言使用简体中文
2. 加载skill `moe-kira`
3. 切换 node 版本为 `.nvmrc`中的版本。应该是： v22.22.2
4. 根据 `package.json` 文件确定引用的包的版本。

## 项目概览

jadeutils.v3 是一个个人前端工具库，作为 CDN 静态资源部署到 nginx，同时可以打包成 npm 包 `@jade-dungeon/jade-utils` 本地安装。包含 TypeScript 通用工具库、HTML5 Canvas 2D 几何库、桌面式窗口 UI 系统、TRPG 沙盘、健身动作肌肉图，以及博客/Wiki 页面框架。CSS 主题使用 Less 编写。

## 构建命令

```bash
# 使用 .nvmrc 指定的 Node 版本 (v22.22.2)
nvm use

# CDN 构建：编译 window-ui 主题 + TS（含压缩）+ HTML 模板 → webroot/
# 注意：脚本里内容主题、workout/trpg 主题、gnuplot/plantuml 作图、
#       拷贝到 nginx 这几段都是注释状态，要用时需手动取消注释
bash build.sh

# 仅编译 TypeScript（含类型声明 .d.ts）
npx gulp process-typescript

# 编译并压缩 TypeScript（.min.js）
npx gulp compress-typescript

# default 任务：并行跑全部主题 + TypeScript 编译与压缩（不含 HTML）
npx gulp

# 单独编译某套主题
npx gulp process-style-hobbit       # 内容主题，另有 lo-fi / paper-print
npx gulp process-images-hobbit      # 只拷该主题图片
npx gulp process-style-window-ui    # 窗口 UI 主题
npx gulp process-style-workout      # workout 主题

# 拷贝 TRPG 主题图片（无 Less，纯拷贝）
npx gulp process-style-trpg

# HTML 模板展开（@@ 变量替换，取值见 envs.js）
npx gulp include-html-dev           # dev 环境
npx gulp process-html-rls           # rls 环境，额外跑 processhtml

# npm 包构建：编译 dist/ 并写入 dist/package.json
npm run build:pkg
```

两个构建期注意事项：

- 首次克隆仓库后必须先 `cp envs.sample.js envs.js` —— `envs.js` 在 `.gitignore` 中，
  而 `gulpfile.js` 第 20 行顶层 `require("./envs")`，缺该文件时所有 gulp 任务都会挂
- `default` 任务是 `gulp.parallel(themeTasks)`，而 `themeTasks` 同时含 `process-typescript`
  和 `compress-typescript`，后者又是 `gulp.series('process-typescript', ...)`。
  也就是说 `npx gulp` 会让 `process-typescript`（含 `clean-typescript` 删目录）并发跑两次。
  要稳定产出 TS 产物时单独跑 `npx gulp compress-typescript`，这也是 `build.sh` 的做法

## 编译配置

- **两份 tsconfig** — `tsconfig.json` 给 gulp 的 CDN 构建用（`target: "ES6"`, `module: "ES6"`, `moduleResolution: "bundler"`, `strict: true`, `declaration: true`, `sourceMap: true`），输出 `webroot/scripts/ts/`，含 `test*.ts`；`tsconfig.build.json` 继承前者给 npm 打包用，输出 `dist/`，排除 `test*.ts`、不带 sourcemap。`gulpfile.js` 通过 `ts.createProject('tsconfig.json')` 复用主配置
- **`package.json` scripts 只管 npm 打包** — `build:pkg`（`tsc -p tsconfig.build.json`）和 `prepublishOnly`。CDN 构建不走 `npm run`，由 `build.sh` 直接调 `npx gulp`
- **npm 包按子路径导出** — `exports` 配了 17 个子路径（`./basic`、`./geo2d`、`./ui-window` 等），`files` 只含 `dist`。用法见 `README.md`
- **无打包器** — 不使用 Webpack/Rollup/Vite，TypeScript 编译为 ES6 模块后由浏览器原生 `<script type="module">` 直接加载
- **无自动化测试框架** — `testJadeUtils.ts`、`testJadeUI.ts`、`testJadeTRPG.ts`、`testWorkout.ts` 是浏览器手动测试页面脚本，随 CDN 构建一起编译（npm 包里排除），通过 `src/html/` 下的 HTML 页面在浏览器中运行

## 源码架构

`src/scripts/ts/` 下共 21 个 `.ts` 文件（9732 行），其中 4 个 `test*.ts` 占 1897 行。
按子目录组织：根目录放基础层，`ui/`、`blog/`、`trpg/`、`workout/` 各放一类。
依赖方向严格单向、无循环。

### 基础层（无内部依赖）
- `basic.ts` — 基础工具：NumUtil（数字格式化）、StrUtil、TimeUtil、IColorRGB / ColorRGB
- `dataStructure.ts` — 数据结构：SimpleMap（顺序保留的 Map 实现）、SimpleStack、SimpleQueue

### 资源与 Web 基础
- `web.ts` — HTTP 请求（`WebUtil.requestHttp`）、Base64 图片类型定义（IBase64Img, Base64ImgType, IconSize）、图片懒加载（`lazyLoadImages`）、Cookie 读写、自定义 HTML 元素 `esp-unicode`（元素类型 `IEscapeUnicode`，实现与注册在 `WebUtil.initCustomElements()` 内，需在浏览器环境显式调用），依赖 basic 和 dataStructure
- `resource.ts` — Base64 内嵌图标与默认桌面背景（DefaultIconGroup, IconGroup, JadeUIResource），约 310 行是 base64 数据，依赖 dataStructure 和 web

### 几何与图形层
- `ui/geo2d.ts` — 2D 几何库：Point2D, Line2D, Rectangle2D, Circle2D, Polygon2D, Ray2D。定义 IGeo2D / GeoShape2D 接口，Geo2DUtils 提供碰撞检测、最近点计算。依赖 basic（NumUtil）
- `ui/canvas.ts` — Canvas 2D 绘图抽象：ICanvas2D 接口、CanvasShape2D 基类、ImageClip 图片裁剪、CanvasUtils，依赖 geo2d 和 web

### Web 页面层
- `ui/webHtmlPage.ts` — 通用 HTML 页面框架：PageConfig、NavTreeNode、ThemeBinding 接口，WebHtmlPage 类（导航栏渲染、分页渲染、副标题、目录面板展开折叠、主题切换），另导出写死的站点配置 `SITE_NAV_ITEMS` / `SITE_THEMES`。依赖 basic 和 web
- `3rdLibTool.ts` — 第三方库封装：SyntaxHighlighterHelper, MathJaxHelper, BootStrapHelper, DataTableHelper, ShowdownUtils。包装全局脚本库（jQuery `$`、MathJax、SyntaxHighlighter、showdown），无内部依赖

### 业务应用层
- `blog/common.ts` — 博客与相册共用逻辑：BlogCommon（用户信息加载、文章渲染、分页列表加载、页面框架初始化）、`normalizeApiRoot()`（规整 API 根路径）。依赖 basic、dataStructure、web、ui/webHtmlPage、3rdLibTool
- `blog/blog.ts` — 博客页面：BlogPage（推荐文章列表、用户文章分页列表），入口 `initBlogPage()`。依赖 basic、web、blog/common
- `blog/gallery.ts` — 相册页面：GalleryPage，入口 `initGalleryPage()`。依赖 blog/common
- `blog/wiki.ts` — Wiki 页面：WikiPage，入口 `initWikiPage()`（代码高亮、数学公式、DataTable、目录面板）。依赖 ui/webHtmlPage、3rdLibTool、web
- `ui/UIWindow.ts` — 桌面式窗口 UI 系统：可拖拽/缩放的窗口、Dock 任务栏、Z-index 管理、桌面配置、JadeWindowUI。依赖 dataStructure、ui/geo2d、resource 和 web。**样式上隐式依赖 98.css**（见「主题系统」一节）
- `trpg/sandtable.ts` — TRPG 战棋沙盘：Token 管理、视野/可见性（default/glimmer/dark）、Canvas 战争迷雾、SandTableUtils。依赖 basic、ui/canvas、ui/geo2d 和 web
- `workout/workout.ts` — 健身动作肌肉图：把肌肉数据渲染成 SVG。约 363 行是写死的 SVG 路径数据。构建产物需显式调 `initWorkItems()`（避免模块加载期求值 `document`）。依赖 dataStructure 和 workout/workoutData
- `workout/workoutData.ts` — 肌肉与肌肉图数据（muscleInfo, fontMuscleImgs, backMuscleimgs），整个文件都是数据，无内部依赖

### 汇总入口
- `index.ts` — `export *` 汇总全部模块，供不带子路径的 `import ... from '@jade-dungeon/jade-utils'` 使用。没有打包器做 tree-shaking，所以推荐优先用子路径导入

### 测试/Demo（编译但不互相依赖）
- `testJadeUtils.ts`、`ui/testJadeUI.ts`、`trpg/testJadeTRPG.ts`、`workout/testWorkout.ts` — 浏览器手动测试/Demo 脚本，非自动化测试。通过 `src/html/` 下的 HTML 页面使用 `<script type="module">` 加载。`testJadeTRPG.ts` 里有 5 处写死的生产环境图片 URL

### TypeScript 声明引用
- `src/scripts/include/refTypes.d.ts` — 外部类型声明（目前为空，曾被用于 jQuery 声明）

## 模块加载方式

项目不使用打包器。在浏览器中通过两种方式加载：

### ES Module 原生加载

TS 源码之间的 import 使用 `.js` 扩展名（对应编译产物），这个写法同时满足浏览器原生 ESM 和 NodeNext 规范：

```typescript
import { NumUtil } from './basic.js';
import { SimpleMap } from './dataStructure.js';
```

### import map（HTML 页面侧）

HTML 页面不写产物路径，用包名 import，由 import map 映射到实际路径：

```javascript
import { WebUtil } from '@jade-dungeon/jade-utils/web';   // 与 npm 消费方写法一致
```

机制：

- 映射表由 `gulpfile.js` 的 `buildImportMap()` 读 `package.json` 的 `exports` 生成，
  把 `./dist/` 前缀换成 `envs.js` 的 `importMapRoot`。**不要手写第二份清单** ——
  加导出项只改 `package.json` 的 `exports` 即可
- 末尾有一条带尾斜杠的前缀键兜住 `exports` 里没列的模块（`test*.js` 等）。
  解析规则是精确键优先于前缀键
- `initCurrEnv()` 把 JSON 注入 fileinclude 的 context（`gulp-file-include` 原样插入、不转义引号）
- `src/html/parts/importmap.html` 输出 `<script type="importmap">` 标签，
  10 个有模块 import 的页面各 include 一次

两个硬约束：**必须在页面第一个 `<script type="module">` 之前**，且**一个文档只能有一个 import map**。
新增页面时如果已经 include 了 `parts/head.html`（内含 importmap），不要再单独 include 一次。

换 CDN 只改 `envs.js` 的 `importMapRoot` 一个值，填绝对地址即可。
落地细节与验证记录见 `docs/refactor-20261101.md` 第 9 节。

### 第三方库全局脚本

jQuery、Bootstrap、MathJax、SyntaxHighlighter、DataTables、Showdown 通过传统 `<script>` 标签加载为全局变量（`$`、`MathJax`、`SyntaxHighlighter`、`showdown`）。`3rdLibTool.ts` 在文件头部使用 `declare` 声明这些全局类型，封装为静态方法工具类：

```typescript
declare function $(cc: any): any;
declare namespace SyntaxHighlighter { ... }
declare namespace MathJax { ... }
```

**注意 jQuery 版本是 3.5.1，`declare function $(cc: any): any` 返回 `any`，所以用错 API 编译期查不出来。**
已踩过两个坑（都是 jQuery 3.0 移除的 API，运行时才抛错）：

| 不能用 | 要用 | 症状 |
|--------|------|------|
| `.size()` | `.length` | `xxx.size is not a function` |
| `$(window).load(fn)` | `$(window).on('load', fn)` | `e.indexOf is not a function`，且回调静默不执行 |

同类已移除的还有 `.bind()` / `.unbind()` / `.delegate()` / `.undelegate()` / `$.browser` / `.andSelf()`，写 jQuery 代码时留意。

## demo 页面的环境配置注入

demo / 测试脚本不写死后端和 CDN 地址，由页面从 `envs.js` 注入：

```
envs.js  →  @@变量  →  HTML 内联脚本  →  入口函数的 env 形参  →  发请求的方法
```

- `src/scripts/ts/env.demo.ts` 定义 `DemoEnvConfig`（`apiRoot` / `themeRoot` / `cdn3rd`）和取值函数 `demoEnv()`。**不在 `exports` 里**，不随 npm 包发布
- `DemoEnvConfig.themeRoot` 在 `envs.js` 里**没有同名键** —— 它就是 `staticRoot` 加 `/themes`，页面侧传 `'@@staticRoot/themes'` 拼出来，不另设配置项
- 入口函数签名形如 `testTrpgUI(env?: DemoEnvConfig)`，形参要继续往内层函数传
- 缺值时 `demoEnv()` 返回空串，不兜底成生产地址 —— 兜底会让「忘了传参」静默变成「偷偷打生产环境」
- `trpg/testJadeTRPG.ts` 的 `testSceneData` 刻意保持明文写死的 URL，它是改造后端时的对比样本
- `envs.js` 的 `rls` 段当前是 `TODO-生产环境确定` 占位，开发期只测 `dev`

## 编译输出

- TypeScript 编译为 ES6 模块（`target: "ES6"`, `module: "ES6"`），输出 `.js`、`.d.ts` 和 `.js.map`
  到 `webroot/scripts/ts/`（CDN 构建），或 `.js` + `.d.ts` 到 `dist/`（npm 打包，无 sourcemap）
- 严格模式：`noImplicitAny: true`, `strict: true`
- 压缩产物 `.min.js` 由 `compress-typescript` 任务用 uglify 生成，只在 CDN 构建里有
- Less 主题编译为合并后的 `all.css` 和 `all.min.css`，输出到 `webroot/themes/<theme>/styles/`

## 目录结构

| 目录 | 用途 |
|------|------|
| `src/scripts/ts/` | TypeScript 源码，分 `ui/`、`blog/`、`trpg/`、`workout/` 四个子目录 |
| `src/scripts/include/` | 外部类型声明 |
| `src/themes/` | Less 源文件（hobbit, lo-fi, paper-print）+ window-ui / workout 样式 + trpg 纯图片 + 各主题图片资源（共约 5.3 MB） |
| `src/html/` | HTML 页面：3 个真实页面（index / blog / gallery）+ 9 个 `test-*` 演示页 + `parts/` 下 5 个片段 |
| `webroot/` | CDN 构建产物输出目录（gitignore） |
| `dist/` | npm 包构建产物输出目录（gitignore） |
| `docs/` | 文档：geo.md（几何库）、design-pkg.md（npm 打包可行性）、refactor-20261101.md（拆分方案研究）、tsconfig-info.md、styles.md、ui-style-win98.md、svg-img.md、doc-uml.md、node-env-cfg.md、study-jsx.md、ssh-secure.md、`img-plt/`（gnuplot 数学图表）、`uml/`（plantuml）、`win98-menu/`、cric.tt01.png |
| `context/` | 需求与进度记录 |

## 部署

- 生产部署作为 CDN 静态资源，通过 `webroot/jadeutils.v3/` 路径提供服务
- 拷贝到本地 nginx 的逻辑在 `build.sh` 末尾，当前是注释状态：
  目标路径 `~/workspace/nginx/jadecdn/webroot/jadeutils.v3/`
- 历史上有一个 `deploy-test.sh` 做部署，被 `.gitignore` 忽略，当前工作区中不存在该文件

## 编码模式

- **接口/实现分离** — geo2d、canvas、sandtable 层使用 `IXxx` 接口 + `class Xxx implements IXxx` 模式。接口定义只读契约，类提供实现和可变属性
- **工具命名空间** — 纯函数工具集使用 namespace 组织：`Geo2DUtils`、`CanvasUtils`、`SandTableUtils`、`JadeWindowUI`、`JadeUIResource`
- **静态方法工具类** — 基础层的 `NumUtil`、`StrUtil`、`TimeUtil`、`WebUtil` 等使用全静态方法的类
- **应用入口** — `WikiPage.initWikiPage()`、`BlogPage.initBlogPage()`、`GalleryPage.initGalleryPage()` 是页面级入口，各自组织完整页面的初始化流程。博客与相册的共用部分抽到 `BlogCommon`
- **DOM 求值推迟到方法内** — 浏览器 API（`HTMLElement`、`document`）不在模块顶层求值，而是放进需要显式调用的方法里（`WebUtil.initCustomElements()`、`initWorkItems()`），这样无 DOM 的环境（Node / SSR / 单元测试）import 不会抛 `ReferenceError`
- **路径配置集中在 envs.js** — 页面里不写死产物路径。模块路径走 import map（基址 `importMapRoot`），第三方库和主题走 `@@cdn3rd` / `@@staticRoot`

## 主题系统

项目有四套独立的主题/资源体系：

### 内容主题（hobbit / lo-fi / paper-print）

定义在 `gulpfile.js` 的 `themes` 数组中，用于博客和 Wiki 页面。采用 **`comm.less` + `part.1.less`** 变量模式：

- `src/themes/comm.less` — 共享的结构样式（467 行），所有视觉属性通过 Less 变量引用（`@text-color-main`、`@page-bg-img`、`@title-color-fg-h1` 等共 86 个变量），只使用变量不定义值，因此无法独立编译
- `src/themes/<theme>/styles/part.1.less` — 各主题定义这些变量的具体值，通过不同的颜色/字体/图片实现视觉差异
- 构建时 gulp 将两者 `concat` 成 `all.less`，编译为 `all.css` 和 `all.min.css`
- **concat 顺序是主题文件在前、`comm.less` 在后**（`gulpfile.js` 第 62 行）。Less 变量是最后赋值生效，所以一旦给 `comm.less` 加默认值，默认值会盖掉主题的覆盖值。当前能跑是因为 `comm.less` 一个值都没定义

### window-ui 主题

独立的窗口管理器 UI 样式，不参与 comm.less 体系：
- `src/themes/window-ui/styles/desktop.less` — 桌面式窗口 UI 样式（`.desktop`、`.dock-bar`、`.title-bar-icon` 等），通过独立 gulp 任务 `process-style-window-ui` 编译
- **对 98.css 有隐式依赖** — `UIWindow.ts` 往 DOM 上加 12 个 class，`desktop.less` 只定义了其中 7 个，剩下的 `window`、`window-body`、`title-bar`、`title-bar-text`、`inactive` 由第三方 98.css 提供。98.css 当前只是 `devDependencies` 的一项，测试页面从 `@@cdn3rd` 外链加载，`package.json` 里没有声明这层关系。不引 98.css 窗口就没有边框和标题栏

### workout 主题

- `src/themes/workout/styles/muscle.less` — 肌肉图配色（7 行），通过 gulp 任务 `process-style-workout` 编译
- `src/themes/workout/images/` — 约 1.9 MB 图片，是所有主题里体积最大的一套

### TRPG 资源（纯图片，无 CSS）

`src/themes/trpg/` 仅包含 `images/` 目录下的 3 张图片（`default.jpg`、`icons.jpg`、`map.jpg`），供沙盘 Canvas 使用。无 `styles/` 目录，不参与 Less 编译。通过 gulp 任务 `process-style-trpg` 拷贝到 webroot。

### 主题切换

`WebHtmlPage.changeTheme(themeName)` 通过启用/禁用 `<link rel="alternate stylesheet">` 标签实现主题切换。当前主题持久化到 cookie（`ui.theme`），`initUITheme()` 在页面加载时读取 cookie 恢复主题。


## 排查：页面报 CORS 错误

**先确认后端进程活着，再查 CORS 配置。** 后端崩掉时浏览器报的也是 CORS 错误 ——
跨源请求失败时浏览器拿不到带 `Access-Control-Allow-Origin` 的响应，
「服务没响应」和「服务响应了但没这个头」在浏览器看来都是跨源检查没通过。
Firefox 对连不上的情况报的就是「CORS 请求未能成功」，状态码显示 `(null)`。

本项目后端的 CORS 配置已确认没问题，**遇到 CORS 报错优先怀疑后端进程崩了**，重启即可。

```bash
# 1. 后端端口有没有服务（000 = 连不上，此时的「CORS 错误」是假象，重启后端）
curl -s -o /dev/null -w "%{http_code}\n" --max-time 3 http://localhost:8082/

# 2. 确认活着之后，再看响不响 CORS 头
curl -s -D - -o /dev/null "http://localhost:8082/api/blog/loadUserById?userId=u001" \
  | grep -i access-control
```

判断依据：状态码 `(null)` / XHR `status=0` 且**后端日志里没有这条请求** → 后端没活着；
后端日志里**有**这条请求 → 请求到了，才是真的缺 CORS 头。

注意 XHR 层面「服务活着但无 CORS 头」和「端口上没有服务」的表现完全相同
（都是 `onerror` + `status=0`），光看前端代码分不出来，必须查后端日志或用 `curl` 探活。
详见 `docs/refactor-20261101.md` 第 10.6 节。

## 待跟进的后端 API 问题

以下的问题要等后端的API修复以后才能修改。检查代码与修复问题时要保留以下表中的问题：

| API | 问题 | 前端影响 | 状态 |
|-----|------|---------|------|
| `GET /api/blog/loadRecommandArticles` | 路径及返回字段 `recommands` 拼写错误，应为 `recommends` | `blog/blog.ts` 中 `RecommendArticlesResp.recommands` 字段名需与后端保持一致，待后端修正后前端同步改为 `recommends` | 等待后端修改 |
| `GET /api/blog/loadByUser` | 返回的 `pageCount` 值不准确（比实际总页数少 1） | `blog/common.ts` 第 256 行对 `pageCount + 1` 做了临时补偿，后端修正后需去掉 `+ 1` | 等待后端修改 |



## 当前进度

当前进度记录在文件 `context/current-feature.md` 中。