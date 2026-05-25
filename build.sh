#!/bin/bash

# ========================================
# build gnuplot images
# ========================================
echo '--- start : build math plot ---'
function gnuplotImage() {
		echo " gnuplot \"$1\" > \"$1.png\" "
		gnuplot "$1" > "$1.png"
}
function gnuplotDocImages() {
	# for pltFile in ./docs/img-plt/*.plt;     do gnuplotImage "$pltFile"; done;
	for pltFile in ./docs/img-plt/*/*.plt;   do gnuplotImage "$pltFile"; done;
	for pltFile in ./docs/img-plt/*/*/*.plt; do gnuplotImage "$pltFile"; done;
}
# rm -rf ./docs/img-plt/**/*.png
gnuplotDocImages
echo '--- finish : build math plot ---'

# ========================================
# build plantuml images 
# 
# https://plantuml.com/class-diagram
# 
# ========================================
echo '--- start : build uml ---'
mkdir -p ./docs/uml/out/
/opt/quickstart/plantuml-dir.sh -t svg -s ./docs/uml/src/ -o ./docs/uml/out/
echo '--- finish : build uml ---'

# ========================================
# build css
# ========================================
echo '--- start : build css ---'
node ./node_modules/gulp-cli/bin/gulp.js 'process-style-window-ui' 
node ./node_modules/gulp-cli/bin/gulp.js 'process-style-trpg' 
echo '--- finish : build css ---'


# ========================================
# compile javascript
# ========================================
echo '--- start : compile javascript ---'
node ./node_modules/gulp-cli/bin/gulp.js compress-typescript
echo '--- finish : compile javascript ---'

# ========================================
# html
# ========================================
echo '--- start : copy html ---'
mkdir -p webroot/html/
cp -r  src/html/* webroot/html/
echo '--- finish: copy html ---'
