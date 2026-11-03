#!/bin/bash
# site-page 项目的 CDN 构建
#
# 三条链：主题 Less + 图片、TypeScript 编译（含压缩）、HTML 模板展开。
# 产物在 site-page/webroot/。
#
# **编译 TS 之前库必须先 build:pkg**。site-page 用包名 import 库，解析链：
#
#   node_modules/@jade-dungeon/jade-utils   ← npm install 建的符号链接
#     → common-utils/package.json 的 exports（types 字段）
#       → common-utils/dist/*.d.ts          ← build:pkg 生成的，**唯一要先构建的一环**
#
# 根上的 `npm run build` 和 build.sample.sh 已排好顺序。
# 单独跑本脚本时，先 `npm run build:pkg -w common-utils`。
#
# 漏跑的报错会带偏：实测 185 个错里只有 31 个 TS2307（找不到模块），
# 其余 131 个 TS2339「属性不存在」都是类型解析失败的连带效应。
# 看到成片 TS2339 先确认 common-utils/dist/ 在不在。
#
# 用法：cd site-page && bash build.sh    或    npm run build -w site-page

set -e
cd "$(dirname "$0")"

# ========================================
# copy 3rd lib
# 第三方的库改用外部引用，不再复制一份出来了
# ========================================
# echo '--- start : copy 3rd lib ---'
# mkdir -p site-page/webroot/3rd/
# rm -rf site-page/webroot/3rd/*
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/jquery            ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/datatable         ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/bootstrap         ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/SyntaxHighlighter ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/showdown          ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/mathjax           ./site-page/webroot/3rd
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/98.css            ./site-page/webroot/3rd
# echo '--- finish: copy 3rd lib ---'

# ========================================
# 库：先打 npm 包（site-page 侧编译要用 common-utils/dist/ 的 .d.ts），再做 CDN 构建
# ========================================
echo '=== 1/3 lib ==='
npm run build:pkg -w common-utils
bash common-utils/build.sh

# ========================================
# site-page 项目
# ========================================
echo '=== 2/3 web ==='
bash site-page/build.sh

# ========================================
# deploy local server
#
# **两个目标分开拷,不合并** —— 和生产的两个 CDN 一一对应,
# 这样本地验证的路径结构和线上一致。合并着拷会让
# 「@@libRoot / @@staticRoot 用错了」这类问题在本地看不出来（19.8 节踩过）。
#
# 本机没装 nginx 时跳过，不让它中断构建 —— 这一段是本地便利，
# 不是构建的一部分。切分之前这个脚本没有 set -e，cp 失败只打一行错误就继续；
# 加了 set -e 之后要显式处理，否则没有 nginx 的机器上构建会在这里中断。
# ========================================
echo '=== 3/3 deploy to local nginx ==='
NGINX_ROOT=~/workspace/nginx/jadecdn/webroot
if [ -d "$NGINX_ROOT" ]; then
	# 库 → jadeutils.v5（对应 envs.js 的 libRoot）
	LIB_DST="$NGINX_ROOT/jadeutils.v5"
	mkdir -p "$LIB_DST"
	rm -rf "$LIB_DST"/*
	cp -r common-utils/webroot/* "$LIB_DST"
	echo "--- lib  → $LIB_DST ---"

	# 站点 → jadesites.v5（对应 envs.js 的 staticRoot）
	SITE_DST="$NGINX_ROOT/jadesites.v5"
	mkdir -p "$SITE_DST"
	rm -rf "$SITE_DST"/*
	cp -r site-page/webroot/* "$SITE_DST"
	echo "--- site → $SITE_DST ---"
else
	echo "--- skip  : 本机没有 $NGINX_ROOT，跳过部署 ---"
fi

# 页面挪进 html/blog/ 之后的路径（阶段 4）
# cp site-page/webroot/html/blog/blog.html    ~/workspace/nginx/jadedungeon-v2/webroot/index.html
# cp site-page/webroot/html/blog/gallery.html ~/workspace/nginx/jadedungeon-v2/webroot/gallery.html
# cp site-page/webroot/html/blog/blog.html    ~/workspace/nginx/jadedungeon/webroot/index.html
# cp site-page/webroot/html/blog/gallery.html ~/workspace/nginx/jadedungeon/webroot/gallery.html

sleep 3 && sync

# cp -r ~/sync-prj/* . && sync && bash build.sh && sync
