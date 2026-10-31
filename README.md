Jade-Javascript-Utils
===============================

## 概述

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
| `/resource` | `resource.ts` | `DefaultIconGroup`、`IconGroup`、`JadeUIResource` | 浏览器 |
| `/canvas` | `ui/canvas.ts` | `ICanvas2D`、`CanvasShape2D`、`ImageClip`、`CanvasUtils` | 浏览器 |
| `/ui-window` | `ui/UIWindow.ts` | `UIDesktop`、`DockBar`、`JadeWindowUI` | 浏览器 |
| `/web-html-page` | `ui/webHtmlPage.ts` | `WebHtmlPage`、`PageConfig` | 浏览器 |
| `/sandtable` | `trpg/sandtable.ts` | `SandTable`、`CircleToken`、`RectangleToken`、`LineToken` | 浏览器 |
| `/3rd-lib-tool` | `3rdLibTool.ts` | `SyntaxHighlighterHelper`、`MathJaxHelper`、`BootStrapHelper`、`DataTableHelper`、`ShowdownUtils` | 浏览器 + 全局脚本 |
| `/blog` | `blog/blog.ts` | `BlogPage` | 浏览器 |
| `/wiki` | `blog/wiki.ts` | `WikiPage` | 浏览器 |
| `/workout` | `workout/workout.ts` | `workItems`、`initWorkItems` | 浏览器 |
| `/workout-data` | `workout/workoutData.ts` | `muscleInfo`、`fontMuscleImgs`、`backMuscleimgs` | 任意 |

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
3rdLibTool.ts                     (无依赖 - 使用全局声明)

geo2d.ts
└── basic.ts

web.ts
├── basic.ts
└── dataStructure.ts

resource.ts
├── dataStructure.ts
└── web.ts

webHtmlPage.ts
└── web.ts

canvas.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

UIWindow.ts
├── dataStructure.ts
├── geo2d.ts → basic.ts
├── resource.ts → dataStructure.ts, web.ts
└── web.ts → basic.ts, dataStructure.ts

sandtable.ts
├── basic.ts
├── canvas.ts → geo2d.ts, web.ts
├── geo2d.ts → basic.ts
└── web.ts → basic.ts, dataStructure.ts

blog.ts
├── web.ts → basic.ts, dataStructure.ts
├── webHtmlPage.ts → web.ts
└── 3rdLibTool.ts

wiki.ts
├── webHtmlPage.ts → web.ts
└── 3rdLibTool.ts

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
| L2 资源 | `resource.ts`, `webHtmlPage.ts` | 依赖 L0+L1 |
| L3 图形 | `canvas.ts` | 依赖 geo2d + web |
| L4 应用 | `UIWindow.ts`, `sandtable.ts`, `blog.ts`, `wiki.ts` | 依赖 L0~L3 |
| L5 测试 | `testJade*.ts` | 依赖所有上层 |

与 `gulpfile.js` 中的编译顺序一致。

---

## 待跟进的后端 API 问题

| API | 问题 | 前端影响 | 状态 |
|-----|------|---------|------|
| `GET /api/blog/loadRecommandArticles` | 路径及返回字段 `recommands` 拼写错误，应为 `recommends` | `blog.ts` 中 `RecommendArticlesResp.recommands` 字段名需与后端保持一致，待后端修正后前端同步改为 `recommends` | 等待后端修改 |
| `GET /api/blog/loadByUser` | 返回的 `pageCount` 值不准确（比实际总页数少 1） | `blog.ts` 第 154 行对 `pageCount + 1` 做了临时补偿，后端修正后需去掉 `+ 1` | 等待后端修改 |

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
