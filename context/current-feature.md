# 当前需求

## 状态

未开始

## 需求文档

<!-- 执行 `/feature load` 加载需求文档 -->

## 目标

<!-- 成功标准的要点列表 -->

## 说明

<!-- 来自需求文档的额外上下文、约束或详细信息 -->

## 修改汇总

<!-- 解释本次修改的内容 -->

## 历史记录

- **`ablum` → `album`，并清掉「为旧后端保留」的过时说法**（2026-11-05，旧后端已停用）
  - 后端：`blogService.ts` 的 `IAlbumDetail.album` 及三处赋值、`gallery.ts` 注释、
    `backupBlogData.ts` 的 `IAlbum.album`
  - 前端：`common.ts` 的 `UserArticle.album` + 两处读取
  - **`migrateBlogRedisToSqlite.ts` 的 `ablum` 保留** —— 它读 Redis 里的存量旧数据，
    那边的 key 本来就叫 `ablum`，改了一张图都读不到。文件里加了注释钉住
  - **`scence` 没改** —— 它是 Redis key 前缀的一部分，约束来自存量场景数据、
    不是来自旧后端，改名要连带写迁移脚本。这台机器上 redis-cli 没装、
    Redis 没起，当时也验不了存量规模
  - 过时说法清了 5 处代码注释（`sandtableService.ts` 的「两代后端看不到彼此」、
    `diceService.ts` 的「否则旧后端解析不了」、`config.ts` 的「与旧后端共享」等）
    + 4 篇文档（`site-api/CLAUDE.md`、`migration-history.md`、
    `design-blog-gallery-sqlite.md`、根 `CLAUDE.md`）。
    **措辞统一成「约束换了来源，不是消失了」** —— Redis key 和 JSON 形状的限制
    现在来自存量数据，跟后端版本无关
  - 新增 1 条自检用例（52 个）：后端给旧字段名 `ablum` 时必须渲染不出图。
    没有它的话「前端改回读 `ablum`」测不出来 —— 这个失败模式是静默的
    （相册页只剩说明文字、没有图，不报错）
  - 真机验证：后端响应字段是 `album`（无 `ablum`）；jsdom 跑编译产物打真后端，
    5 组相册 9 张缩略图，与后端 `album` 数组总数一致
- **修掉 `recommand` 拼写，前后端一起改**（2026-11-05，接着上一条）
  - 后端 `site-api/routes/blog.ts`：路径 `loadRecommandArticles` →
    `loadRecommendArticles`，响应字段 `recommands` → `recommends`
  - 前端 `site-page/blog/blog.ts`：请求 URL、`RecommendArticlesResp` 的字段、
    读取处三处同步改
  - **顺带修了一个真 bug**：`recommends` 字段缺失时 `for...of undefined` 会抛错。
    原来的 `recoms.body ? ... : 默认值` 只在 body 为 null 时兜底，响应体在但缺字段
    （后端报错、或字段名对不上）兜不住。而这个函数是 `initBlogPage()` 里
    `Promise.all` 的一支，抛了会把用户信息和文章列表一起带走。
    加了 `?? []`，并把 `recommends` 的类型改成可选（照实写，否则 `?? []` 像废代码）
  - 新增 4 个用例（站点侧 47 → 51，总数 297 → 301），其中一条是自检用的：
    后端给旧字段名时必须渲染不出东西 —— 否则「前端改回读 `recommands`」这种
    回退测不出来。**就是这条自检把上面那个 bug 炸出来的**
  - 改动涉及 URL，改前全盘搜过调用方：旧前端 `Jade-Dungeon-page` 不在磁盘上
    （只有 `Jade-Dungeon.20261105.tar.gz` 备份），`sync-prj/` 里也没有
  - 真机验证：新路径 200 且返回 `recommends`、旧路径 404；jsdom 跑编译产物
    渲染出 2 条推荐
  - `ablum`（`album` 之误）当时没动，**在下一条里改掉了**
  - 至此根 CLAUDE.md 那张「待跟进的后端 API 问题」表清空，已改写成「都修完了」
- **blog 列表改摘要 + 展开，分页两处修正**（2026-11-05，配合新后端 `site-api/`）
  - `site-page/blog/common.ts`：去掉 `pageCount + 1` 补偿（后端已用 `Math.ceil`，
    再补会多一个空白末页）；`renderArticleBody()` 按「有 `text` 过 showdown、
    只有 `excerpt` 只转义」分支；新增 `expandArticle()` / `bindExpandLinks()`，
    「展开」点了去 `api/blog/getArticle?id=N` 取 Markdown 全文再替换整块 `.body`
  - `site-page/blog/blog.ts`：传入 `detailUrl`；相册页不传，所以没有展开链接
  - `site-api/blogService.ts`：`normalizePaging()` 的 `pageSize` 下限 10 → 1。
    原来相册页请求的 `pageSize=5` 被静默抬成 10（`u001` 32 组：要 7 页给了 4 页）
  - `UserArticle` 的 `id` / `text` / `excerpt` 都改成可选 —— 三个接口字段形状不同
  - 新增 `site-page/src/test/ts/blog.article.test.ts`（14 个用例），
    站点侧 33 → 47，总数 283 → 297
  - 真机验证：起 `site-api`（8089）+ jsdom 跑编译产物。`teo` 36 篇 → 分页
    1 2 3 4、末页 6 条；id=40 摘要 201 字（带 `…`）展开成 533 字、`…` 消失、
    链接消失、只有展开后才过 showdown；相册 5 组无展开链接、9 张缩略图
  - 未动：`recommands` 拼写（后端那个接口还是假数据，字段名没改）
- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.03..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
- **检查 TypeScript 源代码** （spec：[20260530-check.code.md](context/old-fixes/20260530-fix.02..md)）
  - 审查了 `src/scripts/ts/` 下全部 15 个 `.ts` 文件
  - 发现 9 个问题：2 中等（硬编码提示文案、手机号正则未覆盖新号段）、6 低（浮点精度、废弃 API、死代码）、1 极低（宽松比较）
  - 已跳过 CLAUDE.md 中记录的 2 个待后端修复的已知问题
- **消除顶层 DOM 求值阻塞项** （spec：[20261029-tryPackate.md](context/old-features/20261029-tryPackate.md)）
  - 分支 `feature/remove-top-level-dom-eval`，仅改 `src/scripts/ts/web.ts` 一个文件
  - 顶层 `export class EscapeUnicode extends HTMLElement` 改为纯类型声明 `export type IEscapeUnicode = HTMLElement`，类定义整体挪入 `WebUtil.initCustomElements()` 方法体，类体逻辑逐字保留
  - 验证：`npx gulp process-typescript`（strict）编译通过；`web.js` / `ui/canvas.js` / `ui/UIWindow.js` 在 Node 下 import 成功，而从 `HEAD` 取旧版单独编译的对照组三者全部 `ReferenceError: HTMLElement is not defined`
  - 浏览器行为用 jsdom 验证等价：`esp-unicode` 注册成功，`<esp-unicode>&amp;#x26f5;</esp-unicode>` 仍渲染为 `⛵`
  - breaking change：`web.d.ts` 中 `EscapeUnicode` 类导出消失。`src/` 内零引用，影响仅限外部使用方
  - 需求文档标题含「打包方案与项目结构」，但正文只详述阻塞项；打包方案、`package.json` 元信息（`name`/`version`/`main`/`exports`/`types` 当前全缺）、入口拆分、项目结构调整均未做，需另起需求
  - review 阶段全模块 Node import 实测（14 个模块，13 成功 1 失败），发现 `workout/workout.ts:490-493` 顶层 `for` 循环在加载期调用 `document.createElementNS()`，是同类阻塞项，本次未改
  - 另发现 CLAUDE.md 两处过期：「无 `tsconfig.json`」（实际已存在）、「源码架构」仍描述扁平结构（实际已分 `blog/`、`ui/`、`trpg/`、`workout/` 目录，且 `workout/` 未被记录）
