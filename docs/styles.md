# 样式代码结构分析

## 一、总体架构：两套独立的主题系统

项目有 **两套互不依赖的主题系统**，在 `gulpfile.js` 中由不同的 gulp task 分别构建：

```
src/themes/
├── comm.less              ← 共享的结构样式（变量引用者）
├── hobbit/                ← 内容主题 ①：霍比特/古典羊皮纸
│   ├── images/            ← 31 张图片资源
│   └── styles/
│       ├── part.1.less        ← Less 变量定义
│       ├── shCoreDefault.less ← SyntaxHighlighter 核心样式
│       └── shThemeDefault.less← SyntaxHighlighter 默认主题
├── lo-fi/                 ← 内容主题 ②：绿色 CRT 终端风
│   ├── images/            ← 31 张图片资源
│   └── styles/
│       ├── part.1.less        ← Less 变量定义
│       └── green-code.less    ← SyntaxHighlighter 绿色终端主题
├── paper-print/           ← 内容主题 ③：纸墨印刷风
│   ├── images/            ← 29 张图片资源
│   └── styles/
│       ├── part.1.less        ← Less 变量定义
│       ├── shCoreDefault.less ← SyntaxHighlighter 核心样式
│       └── shThemeDefault.less← SyntaxHighlighter 默认主题
├── window-ui/             ← 独立主题 ④：桌面窗口 UI 系统
│   ├── images/            ← 仅 favicon.ico
│   └── styles/
│       └── desktop.less       ← 自包含样式（无变量体系）
└── trpg/                  ← 纯图片资源（无 CSS）
    └── images/            ← default.jpg, icons.jpg, map.jpg
```

## 二、内容主题的变量驱动模式（核心设计）

这是项目最精妙的设计模式——**`comm.less` + `part.1.less` 变量分离**：

### 构建流程（gulpfile.js 第 32-65 行）

```
part.1.less  ──┐
shCore*.less  ──┤  concat → all.less → less() → all.css → minify → all.min.css
comm.less     ──┘
```

关键点：
- `gulp.src([styleThemesSrc + '**/*.less', styleSrc + 'comm.less'])` — **`part.1.less` 排在 `comm.less` 前面**，保证 Less 变量先定义后使用
- 每个内容主题各自执行一次该流程，输出到 `webroot/themes/<theme>/styles/`

### comm.less（450 行）：纯变量引用的结构样式

`comm.less` 定义了所有 HTML 元素的结构/布局样式，但**所有视觉属性（颜色、字体、背景图、阴影）都通过 Less 变量引用**，自身不定义任何变量值。覆盖范围：

| 区块 | CSS 选择器 | 功能 |
|------|-----------|------|
| body | `body` | 页面底色、字体 |
| banner | `.vestibule`, `.vestibule>h1/p` | 顶部标题横幅 |
| content | `.ctx-main`, `.content` | 主内容区背景/边框 |
| title | `.content h1~h6` + `::before/::after` | 标题层级样式（h1 有装饰线） |
| divider | `.divider` | 文章分隔线 |
| article | `.item`, `.item .title/metadata` | 文章列表项 |
| foot | `.footer` | 页脚 |
| widget | `.widget`, `.widget-content`, `.img-text-lst` | 侧栏小部件 |
| toc | `.sideTocWrapper`, `.tocWrap`, `.tocIdx` | 浮动目录面板 |
| todo | `li.done0~done4` | TODO 列表状态图标 |
| table | `table`, `th`, `td`, `tr` | 表格 + DataTables 分页 |
| code | `code`, `pre`, `.syntaxhighlighter` | 行内代码/代码块/高亮修正 |
| math | `.MathJax`, `.MathJax_Display` | 数学公式配色 |
| popup | `#photo-frame` | 图片弹窗 |

### part.1.less（~130 行）：各主题的变量值定义

每个主题的 `part.1.less` 结构完全一致，为 `comm.less` 中引用的所有变量赋予具体值，按功能分为 13 组：

| 变量组 | 变量数 | 控制内容 |
|--------|--------|---------|
| `// layout` | 6 | 最小屏宽、body/main 宽高边距圆角 |
| `// background` | 6 | 页面/主体背景图、边框图、阴影色 |
| `// head banner` | 3 | 横幅标题色、描述色、背景图 |
| `// foot` | 5 | 页脚文字色、链接色、背景图 |
| `// widget` | 4 | 侧栏分割线色、边框色、内外阴影 |
| `// toc` | 10 | 目录面板背景/文字色、展开/收起图标 |
| `// titles` | 16 | h1~h6 颜色/背景/阴影 + 装饰线图/间距 + 字体 |
| `// article` | 4 | 文章标题色、元数据色、图片虚线色、内容背景 |
| `// text` | 12 | 主文字色、链接色、引用块、字体族、图案分隔线 |
| `// todo` | 5 | 五种 TODO 状态图标 |
| `// table` | 13 | 表格边框/表头/单元格/奇偶行/悬停色 + 背景图 |
| `// paging` | 6 | DataTables 分页按钮的启用/禁用/当前色 |
| `// code` | 9 | 行内代码颜色/背景/边框/阴影/尺寸/偏移 |
| `// math-jax` | 2 | MathJax 公式背景色和前景色 |

## 三、三个内容主题的视觉对比

| 设计维度 | hobbit | lo-fi | paper-print |
|---------|--------|-------|-------------|
| **主文字色** | `#333` 深灰 | `#22DD22` 荧光绿 | `#333` 深灰 |
| **标题字体** | 汉仪寒冰曲 (书法) | 点点宋体方 | Crimson Text (衬线) |
| **h1 背景** | 透明 | `#7FFF00` 亮绿底 | 透明 |
| **h1 装饰线** | SVG ornate-border | PNG ornate-border | SVG ornate-border |
| **h1 上下装饰间距** | 5.25rem / 3.25rem | 0 / 0 (无装饰) | 5.25rem / 3.25rem |
| **正文字体** | 系统无衬线栈 | 系统无衬线+动感宋体 | Georgia 衬线为首选 |
| **代码高亮主题** | 白底默认 (shCoreDefault) | 绿底黑字 (green-code) | 白底默认 (shCoreDefault) |
| **表格表头** | `#349C49` 绿 | `#228B22` 森林绿 | `#349C49` 绿 |
| **链接色** | `#36C` 蓝 | `#00FF00` 纯绿 | `#36C` 蓝 |
| **设计风格** | 古典羊皮纸/霍比特 | 绿色 CRT 终端复古 | 古典纸墨印刷 |

> **注意**：hobbit 和 paper-print 的 `part.1.less` **几乎完全相同**（差异仅在 `@main-bordr-shadow` 和正文字体栈）。它们共享相同的 SyntaxHighlighter 默认主题文件。lo-fi 则是一个完全不同的设计方向。

## 四、window-ui 主题（独立体系）

`desktop.less`（70 行）是完全自包含的样式，不参与 `comm.less` 变量体系。构建时所有 `.less` 文件 concat 合并后编译。

核心样式类：
- `.desktop` — 桌面容器（`overflow: hidden`）
- `.window` / `.window-body` — 窗口组件（允许文本选择）
- `.title-bar-icon-text` / `.title-bar-icon` — 标题栏图标文字（flex 布局）
- `.title-bar-controls>button` — 标题栏控制按钮（pointer 光标）
- `.dock-content` / `.dock-bar` — 底部 Dock 任务栏（flex 居中、毛玻璃 blur、圆角）
- `.dock-bar>.menu-item` — Dock 菜单项（CSS 变量 `--i` 控制缩放比例）
- `.dock-bar>.gap` — Dock 分隔间隙
- `.cannot-select` — 禁止文本选择

特点：Dock 栏使用 CSS 自定义属性 `--i` 实现图标缩放，悬停时有平滑过渡动画。使用 `backdrop-filter: blur(20px)` 做毛玻璃效果。

## 五、TRPG 主题（纯图片）

`src/themes/trpg/` 目录**无 `styles/` 子目录**，不参与 Less 编译。gulp 任务 `process-style-trpg`（gulpfile.js 第 99-108 行）仅做图片拷贝：清空目标目录后复制 3 张图片 (`default.jpg`, `icons.jpg`, `map.jpg`) 到 webroot——供沙盘 Canvas 使用。

## 六、发现的问题

1. **重复变量赋值**：`hobbit/part.1.less` 中 `@table-color-th-bg-img` 被赋值两次（先 `left.png` 再 `right.png`），`@table-color-td-bg-img` 同理（`botleft.png` → `botright.png`）。Less 中后赋值覆盖前者，导致 `comm.less` 第 339-340 行的 `rounded-company` 和 `rounded-q4` 实际使用同一张图。所有三个主题都有此问题。

2. **hobbit 与 paper-print 同质化**：两个主题的 `part.1.less` 几乎完全一致，差异极小（仅 `@main-bordr-shadow` 颜色和 `@text-font-family-nomal` 字体栈），视觉区分度很低。

3. **图片资源冗余**：每个内容主题各自维护一份独立的 `images/` 目录（各 29-31 张图片），大量同名图片（如 `bg.jpg`、`banner.png`、`pattern.gif` 等）在不同主题之间重复存储。

4. **shCoreDefault.less 冗余**：hobbit 和 paper-print 的 `shCoreDefault.less` + `shThemeDefault.less` 内容完全相同（各 329 行和 118 行），却各自存了一份副本。

5. **window-ui 无变量体系**：与内容主题的优美变量分离设计不同，window-ui 的 `desktop.less` 所有颜色/尺寸硬编码在样式中，如果要变换配色需要直接修改源文件。
