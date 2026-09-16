#!/bin/bash

# ========================================
# copy 3rd lib
# 第三方的库改用外部引用，不再复制一份出来了
# ========================================
# echo '--- start : copy 3rd lib ---'
# mkdir -p webroot/3rd/
# rm -rf webroot/3rd/*	
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/jquery            ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/datatable         ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/bootstrap         ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/SyntaxHighlighter ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/showdown          ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/mathjax           ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/98.css            ./webroot/3rd 
# cp -r ~/workspace/nginx/jadecdn/webroot/3rd/mathjax           ./webroot/3rd 
# echo '--- finish: copy 3rd lib ---'

# ========================================
# build gnuplot images
# ========================================
# echo '--- start : build math plot ---'
# function gnuplotImage() {
# 		echo " gnuplot \"$1\" > \"$1.png\" "
# 		gnuplot "$1" > "$1.png"
# }
# function gnuplotDocImages() {
# 	# for pltFile in ./docs/img-plt/*.plt;     do gnuplotImage "$pltFile"; done;
# 	for pltFile in ./docs/img-plt/*/*.plt;   do gnuplotImage "$pltFile"; done;
# 	for pltFile in ./docs/img-plt/*/*/*.plt; do gnuplotImage "$pltFile"; done;
# }
# # rm -rf ./docs/img-plt/**/*.png
# gnuplotDocImages
# echo '--- finish : build math plot ---'

# ========================================
# build plantuml images 
# 
# https://plantuml.com/class-diagram
# 
# ========================================
# echo '--- start : build uml ---'
# mkdir -p ./docs/uml/out/
# /opt/quickstart/plantuml-dir.sh -t svg -s ./docs/uml/src/ -o ./docs/uml/out/
# echo '--- finish : build uml ---'

# ========================================
# build css
# ========================================
# echo '--- start : build css ---'
# npx gulp 'process-style-hobbit' 
# npx gulp 'process-style-lo-fi' 
# npx gulp 'process-style-paper-print' 
# npx gulp 'process-style-window-ui' 
# npx gulp 'process-style-workout' 
# npx gulp 'process-style-trpg' 
# echo '--- finish : build css ---'


# ========================================
# compile javascript
# 有两种方法：gulp工具和手动编译并压缩。选一种构建就可以
# ========================================

# echo '--- start : clean old typescript ---'
# rm -rf webroot/scripts/ts/*
# echo '---   end : clean old typescript ---'
# 
# # 方法一：通过GULP
# echo '--- start : compile typescript by gulp ---'
# npx gulp compress-typescript
# echo '--- end: compile typescript by gulp ---'

# 方法二：通过 tsc 与 terser
# echo '--- start : compile typescript ---'
# npx tsc -p tsconfig.json
# echo '--- finish : compile typescript ---'
# echo '--- start : minify javascript ---'
# for f in $(find webroot/scripts/ts -type f -name '*.js' ! -name '*.min.js'); do
#   npx terser "$f" -o "${f%.js}.min.js"
# done
# echo '--- finish : minify javascript ---'


# ========================================
# html
# ========================================
echo '--- start : process-html ---'
npx gulp include-html
echo '--- end: process-html ---'

# echo '--- start : copy html ---'
# mkdir -p webroot/html/
# rm -rf webroot/html/*
# cp -r  src/html/* webroot/html/
# echo '--- finish: copy html ---'

# ========================================
# docs
# ========================================
# echo '--- start : copy doc ---'
# mkdir -p webroot/docs/
# cp -r  docs/* webroot/docs/
# echo '--- finish: copy doc ---'

rm -rf ~/workspace/nginx/jadecdn/webroot/jadeutils.v3/*
cp -r webroot/* ~/workspace/nginx/jadecdn/webroot/jadeutils.v3   

sleep 3 && sync
