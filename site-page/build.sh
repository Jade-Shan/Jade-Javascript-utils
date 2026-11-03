#!/bin/bash
# site-page 项目的 CDN 构建
#
# 三条链：主题 Less + 图片、TypeScript 编译（含压缩）、HTML 模板展开。
# 产物在 site-page/webroot/。
#
# **编译 TS 之前库必须先 build:pkg** —— site-page 侧用包名 import 库，
# 走 node_modules 符号链接到 common-utils/dist/。根上的 `npm run build` 已排好顺序。
# 单独跑本脚本时，先 `npm run build:pkg -w common-utils`。
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

cp -r ../common-utils/docs    webroot/

# scp -r webroot/*   ecs-user@www.jade-dungeon.cn:/home/ecs-user/workspace/nginx/jadecdn/webroot/jadesites.v5
cp -r webroot/*   ~/workspace/nginx/jadecdn/webroot/jadesites.v5
