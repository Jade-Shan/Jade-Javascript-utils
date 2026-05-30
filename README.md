Jade-Javascript-Utils
===============================

## 概述

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
