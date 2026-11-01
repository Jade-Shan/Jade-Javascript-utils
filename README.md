Jade-Javascript-Utils
===============================

## 概述

---

## 本地开发

### 首次克隆后的必做一步

```bash
cp envs.sample.js envs.js
```

`envs.js` 在 `.gitignore` 中（各环境的地址不同，不入版本控制），
而 `gulpfile.js` 顶层就 `require("./envs")`。**缺这个文件时所有 gulp 任务都会挂**，
报错信息只提示找不到模块，不会说清该怎么办。

拷完按实际环境改里面的值。两个容易填错的地方：

- **所有地址都要带主机名。** 写成 `//:8081/xxx`（省略主机）不是合法 URL，
  `new URL()` 会抛 `Invalid URL`，浏览器也解析不了
- **`staticRoot` 不要填 `"."`。** 页面与静态资源分属不同服务时（比如页面在 8082、
  资源在 8081），相对路径会拼到页面所在的服务上，取不到资源

### 常用命令

```bash
nvm use                      # 切到 .nvmrc 指定的 Node 版本（v22.22.2）
npm test                     # 跑单元测试
bash build.sh                # CDN 构建
npm run build:pkg            # 构建 npm 包到 dist/
```

构建命令的完整清单见 `CLAUDE.md` 的「构建命令」一节。

---

## 作为 npm 包使用

包名 `@jade-dungeon/jade-utils`，纯 ESM，需 Node 18+ 或支持原生 ESM 的打包器。
目前只用于本地安装，未发布到公开 npm registry。

### 安装

先在本项目生成 tarball：

```bash
nvm use                    # 切到 .nvmrc 指定的 v22.22.2
npm run build:pkg          # 编译 dist/ 并生成 dist/package.json
npm pack                   # 得到 jade-dungeon-jade-utils-3.0.0.tgz
```

再到使用方项目安装：

```bash
npm install ../Jade-Javascript-utils/jade-dungeon-jade-utils-3.0.0.tgz
```

开发期联调可以改用 `npm link`，本项目改动即时生效：

```bash
npm link                                    # 在本项目执行
cd ../other-project
npm link @jade-dungeon/jade-utils
```

### 导入方式

推荐按子路径导入，只加载用到的模块：

```typescript
import { NumUtil, StrUtil } from '@jade-dungeon/jade-utils/basic';
import { SimpleMap }        from '@jade-dungeon/jade-utils/data';
import { Point2D }          from '@jade-dungeon/jade-utils/geo2d';
```

也可以从汇总入口导入（会加载全部模块，无打包器 tree-shaking 时体积更大）：

```typescript
import { NumUtil, SimpleMap, Point2D } from '@jade-dungeon/jade-utils';
```

### 子路径一览

| 子路径 | 对应源文件 | 主要导出 | 运行环境 |
|--------|-----------|---------|---------|
| `.` | `index.ts` | 以下全部 | 取决于实际用到的模块 |
| `/basic` | `basic.ts` | `NumUtil`、`StrUtil`、`TimeUtil`、`ColorRGB` | 任意 |
| `/data` | `dataStructure.ts` | `SimpleMap`、`SimpleStack`、`SimpleQueue` | 任意 |
| `/geo2d` | `ui/geo2d.ts` | `Point2D`、`Line2D`、`Rectangle2D`、`Circle2D`、`Polygon2D`、`Ray2D`、`Geo2DUtils` | 任意 |
| `/web` | `web.ts` | `WebUtil`（HTTP 请求、Base64 图片） | 浏览器 |
| `/ui-resource` | `ui/uiResource.ts` | `IconGroup`、`IUIResourceProvider`、`registerUIResourceProvider`、`pickIconSize` | 任意（只有接口，零图片数据） |
| `/resource` | `resource.ts` | `DefaultIconGroup`、`JadeUIResource`、`registerDefaultUIResource` | 浏览器，**含 27.8 KB base64** |
| `/canvas` | `ui/canvas.ts` | `ICanvas2D`、`CanvasShape2D`、`ImageClip`、`CanvasUtils` | 浏览器 |
| `/ui-window` | `ui/UIWindow.ts` | `UIDesktop`、`DockBar`、`JadeWindowUI` | 浏览器 |
| `/web-html-page` | `ui/webHtmlPage.ts` | `WebHtmlPage`、`PageConfig`、`SiteConfig`、`NavTreeNode`、`ThemeBinding`、`TopNavRenderer` | 浏览器 |
| `/sandtable` | `trpg/sandtable.ts` | `SandTable`、`CircleToken`、`RectangleToken`、`LineToken` | 浏览器 |
| `/3rd-lib-tool` | `3rdLibTool.ts` | `SyntaxHighlighterHelper`、`MathJaxHelper`、`BootStrapHelper`、`DataTableHelper`、`ShowdownUtils` | 浏览器 + 全局脚本 |
| `/blog` | `blog/blog.ts` | `BlogPage` | 浏览器 |
| `/wiki` | `blog/wiki.ts` | `WikiPage` | 浏览器 |
| `/workout` | `workout/workout.ts` | `workItems`、`initWorkItems`、`loadMuscleSvg`、`mergePathWithStyle`、`loadPoseSvg` | 浏览器 |
| `/workout-data` | `workout/workoutData.ts` | `muscleInfo`、`fontMuscleImgs`、`backMuscleimgs`、`strenghtWorkoutArr` | 任意 |
| `/workout-pose` | `workout/workoutPoseData.ts` | `strengthPoseSvgArr` | 任意 |

「任意」= 零 DOM 依赖，Node / SSR / 单元测试里都能直接 import。

### 需要显式初始化的功能

有两处为了避免模块加载期求值 DOM 而改成了按需调用，用之前必须先初始化，
否则自定义标签不生效、数组为空：

```typescript
import { WebUtil } from '@jade-dungeon/jade-utils/web';
// 注册 <esp-unicode> 自定义标签，页面里已有的该标签会在注册时被 upgrade
WebUtil.initCustomElements();

import { workItems, initWorkItems } from '@jade-dungeon/jade-utils/workout';
// 构建所有动作的肌肉图，不调用则 workItems 为空数组
initWorkItems();
console.log(workItems.length);
```

两个方法都是幂等的，重复调用无副作用。

### 窗口 UI 的图标：按需加载

`/ui-window` 不依赖 `/resource`。那个子路径有 27.8 KB base64 图标，
只想要窗口管理器的话不会被连带下载 —— 代价是**默认没有图标和桌面背景**。

想用内置的那套，显式注册：

```typescript
import { registerDefaultUIResource } from '@jade-dungeon/jade-utils/resource';
import { UIDesktop } from '@jade-dungeon/jade-utils/ui-window';

// 必须在构造窗口之前调：窗口的默认图标是构造时向注册表取的
registerDefaultUIResource();
const desktop = new UIDesktop(document.getElementById('desk')!);
```

想用自己的图标，实现 `IUIResourceProvider`：

```typescript
import {
	registerUIResourceProvider, IconGroup,
} from '@jade-dungeon/jade-utils/ui-resource';

registerUIResourceProvider({
	// name 省略时返回默认图标；不认识的名字返回 undefined
	getIconGroup: (name) => myIcons[name ?? 'default'],
	getDesktopBackground: () => myWallpaper,
});
```

什么都不注册也能跑：窗口的图标位会带上 `.no-icon` class，
桌面不设置 `background-image`，外观交给 CSS。

### 页面框架：站点配置与导航栏模板

`/web-html-page` 不带任何站点的值，也不带任何 CSS 框架的 class。
导航栏要两样东西：一份 `SiteConfig`，和一个产出骨架 HTML 的模板函数。

```typescript
import { WebHtmlPage, SiteConfig } from '@jade-dungeon/jade-utils/web-html-page';

const site: SiteConfig = {
	brandName: "My Site",
	brandLink: "/",
	navItems: [
		{ title: "Home", link: "/" },
		{ title: "More", subs: [{ title: "Github", link: "//github.com/me/", isNewWin: true }] },
	],
	// elemSlt 要对上 navItems 里某个子项的 id
	themes: [{ elemSlt: "#switch-theme-dark", themeName: "dark" }],
};

const page = new WebHtmlPage({ apiRoot: "/", pageTitle: "Home", subTitle: "", ajaxTimeout: 500 });
page.renderTopNav(site);          // 默认模板：语义结构，零框架 class
page.bindChangeTheme(site.themes);
```

默认模板产出 `a.nav-brand` + `ul.nav-list`（子菜单是 `ul.nav-sub`），样式自己写。
想换骨架就传第三个参数：

```typescript
// 用 Bootstrap 3 的话，本库带了一份现成的
import { BootStrapHelper } from '@jade-dungeon/jade-utils/3rd-lib-tool';
page.renderTopNav(site, "#topnav", BootStrapHelper.renderTopNav);

// 或者自己写，拿到的是渲染所需的全部输入
page.renderTopNav(site, "#topnav", (ctx) =>
	`<h1>${ctx.brandName}</h1>` + ctx.items.map(i => `<a href="${i.link}">${i.title}</a>`).join(''));
```

自己写模板时记得转义 —— 库里两份实现都过 `StrUtil.escapeHtml`。

### 第三方全局依赖

`/3rd-lib-tool` 包装的是传统 `<script>` 标签加载的全局变量
（`$`、`MathJax`、`SyntaxHighlighter`、`showdown`），不是 npm 包。
使用方需自行用 `<script>` 引入这些库，否则调用时报
`ReferenceError`。装了 npm 版 jQuery 并用 `import $ from 'jquery'` 的项目，
这层包装会错位，建议直接用 npm 包而不走这个子路径。

### 不随包分发的内容

Less 主题（`src/themes/`，含 5.3 MB 图片）不在 npm 包里，`files` 只含 `dist`。
主题仍走 CDN 引用，构建流程见下方「构建命令」。

### 许可证

GPLv3（见 [LICENSE](LICENSE)）。GPL 有传染性：使用本库的项目分发时也须以
GPL 兼容协议开源。仅内部使用、不对外分发则不受此约束。

---

## 源文件依赖关系树

```
basic.ts                          (无依赖)
dataStructure.ts                  (无依赖)

3rdLibTool.ts                     (第三方库用全局声明，不 import)
└── basic.ts                      (StrUtil，用于转义)
    (另 import type webHtmlPage.ts 的 NavTreeNode / TopNavContext，编译后擦除)

geo2d.ts
└── basic.ts

web.ts
├── basic.ts
└── dataStructure.ts

uiResource.ts                     (资源注册表，只有接口无数据)
└── web.ts

resource.ts                       (内置图标，27.8 KB base64，opt-in)
├── dataStructure.ts
├── web.ts
└── uiResource.ts → web.ts

webHtmlPage.ts
├── basic.ts
└── web.ts

site.config.ts                    (本站配置，不在 exports 里)
└── webHtmlPage.ts                (仅 SiteConfig 类型)

canvas.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

UIWindow.ts                       (注意：不依赖 resource.ts)
├── dataStructure.ts
├── geo2d.ts → basic.ts
├── uiResource.ts → web.ts
└── web.ts → basic.ts, dataStructure.ts

sandtable.ts
├── basic.ts
├── canvas.ts → geo2d.ts, web.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

blog.ts
├── basic.ts
├── web.ts → basic.ts, dataStructure.ts
├── webHtmlPage.ts → basic.ts, web.ts
├── site.config.ts → webHtmlPage.ts
└── common.ts → 上述全部 + 3rdLibTool.ts

wiki.ts
├── web.ts → basic.ts, dataStructure.ts
├── webHtmlPage.ts → basic.ts, web.ts
├── site.config.ts → webHtmlPage.ts
└── 3rdLibTool.ts → basic.ts

── 测试/Demo 文件 ──
testJadeUtils.ts → basic, dataStructure, web, geo2d, webHtmlPage, 3rdLibTool, canvas
testJadeUI.ts    → resource → dataStructure + web
testJadeTRPG.ts  → basic, resource → dataStructure + web
```

### 依赖层级

| 层 | 文件 | 说明 |
|----|------|------|
| L0 基础 | `basic.ts`, `dataStructure.ts`, `3rdLibTool.ts` | 零内部依赖 |
| L1 核心 | `geo2d.ts`, `web.ts` | 仅依赖 L0 |
| L2 资源 | `uiResource.ts`, `resource.ts`, `webHtmlPage.ts`, `site.config.ts` | 依赖 L0+L1 |
| L3 图形 | `canvas.ts` | 依赖 geo2d + web |
| L4 应用 | `UIWindow.ts`, `sandtable.ts`, `blog.ts`, `wiki.ts` | 依赖 L0~L3 |
| L5 测试 | `testJade*.ts` | 依赖所有上层 |

与 `gulpfile.js` 中的编译顺序一致。

---

## 待跟进的后端 API 问题

| API | 问题 | 前端影响 | 状态 |
|-----|------|---------|------|
| `GET /api/blog/loadRecommandArticles` | 路径及返回字段 `recommands` 拼写错误，应为 `recommends` | `blog/blog.ts` 中 `RecommendArticlesResp.recommands` 字段名需与后端保持一致，待后端修正后前端同步改为 `recommends` | 等待后端修改 |
| `GET /api/blog/loadByUser` | 返回的 `pageCount` 值不准确（比实际总页数少 1） | `blog/common.ts` 的 `loadArticleList()` 里对 `pageCount + 1` 做了临时补偿，后端修正后需去掉 `+ 1` | 等待后端修改 |

---




列表风格
===================

TODO-LIST：
- [x] `[x]` is `.done0`
- [ ] `[ ]` is `.done0`
- [.] `[.]` is `.done1`
- [o] `[o]` is `.done2`
- [O] `[O]` is `.done3`
- [X] `[X]` is `.done4`


提交说明
===================

developing

* :tada:                      `:tada:`                     Initial commit.
* :construction:              `:construction:`             Work in progress.
* :hankey:                    `:hankey:`                   Writing bad code that needs to be improved.
* :sparkles:                  `:sparkles:`                 Introducing new features.
* :lipstick:                  `:lipstick:`                 Updating the UI and style files.
* :zap:                       `:zap:`                      Improving performance.
* :alien:                     `:alien:`                    Updating code due to external API changes.
* :rewind:                    `:rewind:`                   Reverting changes.

testing

* :white_check_mark:          `:white_check_mark:`         Adding tests.
* :chart_with_upwards_trend:  `:chart_with_upwards_trend:` Adding analytics or tracking code(Performance).
* :paw_prints:                `:paw_prints:`               Adding analytics or tracking code(Logic).

refactor

* :art:                       `:art:`                      Improving structure / format of the code.
* :truck:                     `:truck:`                    Moving or renaming files.
* :fire:                      `:fire:`                     Removing code or files.
* :hammer:                    `:hammer:`                   Heavy refactoring.

bugfix

* :pencil2:                   `:pencil2:`                  Fixing typos.
* :rotating_light:            `:rotating_light:`           Removing linter warnings.
* :bug:                       `:bug:`                      Fixing a bug.
* :lock:                      `:lock:`                     Fixing security issues.
* :ambulance:                 `:ambulance:`                Critical hotfix.

configuration

* :wrench:                    `:wrench:`                   Changing configuration files.
* :globe_with_meridians:      `:globe_with_meridians:`     Internationalization and localization.
* :package:                   `:package:`                  Updating compiled files or packages.
* :heavy_plus_sign:           `:heavy_plus_sign:`          Adding a dependency.
* :heavy_minus_sign:          `:heavy_minus_sign:`         Removing a dependency.
* :arrow_up:                  `:arrow_up:`                 Upgrading dependencies.
* :arrow_down:                `:arrow_down:`               Downgrading dependencies.

documents

* :pencil:                    `:pencil:`                   Comments in code.
:qa

* :memo:                      `:memo:`                     Writing docs.
* :page_facing_up:            `:page_facing_up:`           Adding or updating license.

version

* :bookmark:                  `:bookmark:`                 Releasing / Version tags.
* :twisted_rightwards_arrows: `:twisted_rightwards_arrows:`Merging branches.

deploy

* :construction_worker:       `:construction_worker:`      Adding CI build system.
* :green_heart:               `:green_heart:`              Fixing CI Build.
* :rocket:                    `:rocket:`                   Deploying stuff.

plantform

* :apple:                     `:apple:`                    Fixing something on macOS.
* :penguin:                   `:penguin:`                  Fixing something on Linux.
* :checkered_flag:            `:checkered_flag:`           Fixing something on Windows.
* :whale:                     `:whale:`                    Work about Docker.
