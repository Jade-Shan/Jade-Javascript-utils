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

echo '=== site-page: start ==='

echo '--- start : build css ---'
npx gulp process-style-hobbit
npx gulp process-style-lo-fi
npx gulp process-style-paper-print
npx gulp process-style-workout
npx gulp process-style-trpg
npx gulp process-style-site
echo '--- finish : build css ---'

echo '--- start : compile typescript ---'
npx gulp compress-typescript
echo '--- end : compile typescript ---'

echo '--- start : process-html ---'
npx gulp include-html-dev
echo '--- end : process-html ---'

echo '=== site-page: done。产物在 site-page/webroot/ ==='

# 复制文档到当前位置
cp -r ../common-utils/docs    webroot/
# scp -r webroot/*   username@host:/jadesites.v5-path
#  cp -r webroot/*   jadesites.v5-path
