#!/bin/bash

# ========================================
# copy 3rd lib
# ========================================
# echo '--- start : copy 3rd lib ---'
# mkdir -p webroot/3rd/
# rm -rf webroot/3rd/*	
# cp -r ~/workspace/node-dev/Jade-Misc/jade-cdn/cdn-libs/3rd/* ./webroot/3rd 
# # cp -r ~/workspace/nginx/jadedungeon/webroot/study-repo/vimwiki-theme/3rd/mathjax ./webroot/3rd 
# echo '--- finish: copy 3rd lib ---'

# ========================================
# build gnuplot images
# ========================================
#  echo '--- start : build math plot ---'
#  function gnuplotImage() {
#  		echo " gnuplot \"$1\" > \"$1.png\" "
#  		gnuplot "$1" > "$1.png"
#  }
#  function gnuplotDocImages() {
#  	# for pltFile in ./docs/img-plt/*.plt;     do gnuplotImage "$pltFile"; done;
#  	for pltFile in ./docs/img-plt/*/*.plt;   do gnuplotImage "$pltFile"; done;
#  	for pltFile in ./docs/img-plt/*/*/*.plt; do gnuplotImage "$pltFile"; done;
#  }
#  # rm -rf ./docs/img-plt/**/*.png
#  gnuplotDocImages
#  echo '--- finish : build math plot ---'

# ========================================
# build plantuml images 
# 
# https://plantuml.com/class-diagram
# 
# ========================================
#  echo '--- start : build uml ---'
#  mkdir -p ./docs/uml/out/
#  /opt/quickstart/plantuml-dir.sh -t svg -s ./docs/uml/src/ -o ./docs/uml/out/
#  echo '--- finish : build uml ---'

# ========================================
# build css
# ========================================
#  echo '--- start : build css ---'
#  npx gulp 'process-style-window-ui' 
#  npx gulp 'process-style-trpg' 
#  echo '--- finish : build css ---'


# ========================================
# compile javascript
# ========================================
echo '--- start : compile javascript ---'
npx gulp compress-typescript
echo '--- finish : compile javascript ---'

# echo '--- start : compile typescript ---'
# rm -rf webroot/scripts/ts/*
# npx tsc -p tsconfig.json
# echo '--- finish : compile typescript ---'
# 
# echo '--- start : minify javascript ---'
# for f in resource basic dataStructure geo2d canvas web webHtmlPage 3rdLibTool wiki blog UIWindow sandtable testJadeTRPG testJadeUtils testJadeUI; do
#   npx terser "webroot/scripts/ts/${f}.js" -o "webroot/scripts/ts/${f}.min.js"
# done
# echo '--- finish : minify javascript ---'


# ========================================
# html
# ========================================
#  echo '--- start : copy html ---'
#  mkdir -p webroot/html/
#  cp -r  src/html/* webroot/html/
#  echo '--- finish: copy html ---'

# ========================================
# docs
# ========================================
#  echo '--- start : copy doc ---'
#  mkdir -p webroot/docs/
#  cp -r  docs/* webroot/docs/
#  echo '--- finish: copy doc ---'
