#!/bin/bash
# 库的 CDN 构建
#
# 两条链：window-ui 主题的 Less + TypeScript 编译（含压缩）。
# 产物在 common-utils/webroot/。
#
# 用法：cd common-utils && bash build.sh    或    npm run build -w common-utils

set -e
cd "$(dirname "$0")"

echo '=== common-utils: start ==='

echo '--- start : build css (window-ui) ---'
npx gulp process-style-window-ui
echo '--- finish : build css ---'

echo '--- start : compile typescript ---'
npx gulp compress-typescript
echo '--- end : compile typescript ---'

echo '=== common-utils: done。产物在 common-utils/webroot/ ==='


# scp -r webroot/*   ecs-user@www.jade-dungeon.cn:/home/ecs-user/workspace/nginx/jadecdn/webroot/jadeutils.v5
cp -r webroot/*   ~/workspace/nginx/jadecdn/webroot/jadeutils.v5

