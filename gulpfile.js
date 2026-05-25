// #!/bin/bash
// # lessc -x style.less > style.css
// # lessc style.less > style.css

// gulp build-less：你会在目录下发现less目录下的less文件被编译成对应的css文件。
// gulp min-styles：会在css目录下输出all.css和all.min.css文件。
// gulp develop：会监听所有less文件，当有less文件改变时，会执行build-less和min-styles
const gulp      = require('gulp');
const less      = require('gulp-less');        //less编译
const minifycss = require('gulp-minify-css');  //css压缩
const jshint    = require('gulp-jshint');      //js检查
const ts        = require('gulp-typescript');      // typescript编译
const sourcemaps = require('gulp-sourcemaps');      // typescript编译
const uglify    = require('gulp-uglify-es').default;      //js压缩
const rename    = require('gulp-rename');      //重命名
const concat    = require('gulp-concat');      //合并文件
const clean     = require('gulp-clean');       //清空文件夹

const themes = ['hobbit', 'lo-fi', 'paper-print'];

/* themeTasksParam 要作为gulp.parallel(...)的参数列表，
 * 所以不能用数组，定义一个类数组。
 * 类数组必须有2个组成部分：1)* 属性要为索引（数字）属性，2)必须有length属性
 * 例如：var obj = {"0":'a',"1":'b', "length":3}
 */
const themeTasks = [];

// =======================
// css for blog
// =======================

themes.forEach((theme) => {

	const imageTsk = 'process-images-' + theme;
	const imageSrc = 'src/themes/' + theme + '/images/';
	const imageDst = 'webroot/themes/' + theme + '/images/';
	gulp.task(imageTsk,  gulp.series(
		() => {
			return gulp.src([imageDst + '*'], {read: false, allowEmpty: true})
				.pipe(clean());
		}, () => {
			return gulp.src([imageSrc + '**/*']).pipe(gulp.dest(imageDst))
		}
	));
	themeTasks.push(imageTsk)

	const styleTsk = 'process-style-' + theme;
	const styleSrc = 'src/themes/';
	const styleThemesSrc = 'src/themes/' + theme + '/styles/';
	const styleDst = 'webroot/themes/' + theme + '/styles/';
	gulp.task(styleTsk,  gulp.series(
		() => {
			return gulp.src([styleDst+ '*'], {read: false, allowEmpty: true})
				.pipe(clean()); }, 
		() => {
			return gulp.src([styleThemesSrc + '**/*.less', styleSrc + 'comm.less'])
				.pipe(concat('all.less'))
 				.pipe(less({compress: false})).on('error', (e) => {console.log(e)})
 				.pipe(gulp.dest(styleDst))
 				.pipe(minifycss()).pipe(rename({suffix: '.min'}))
 				.pipe(gulp.dest(styleDst))
		}
	));
	themeTasks.push(styleTsk)

});

// =======================
// css for window UI 
// =======================

gulp.task("process-style-window-ui", gulp.series(
	() => {
		return gulp.src(['webroot/themes/window-ui/images/*'], { read: false, allowEmpty: true })
			.pipe(clean());
	}, 
	() => {
		return gulp.src(['src/themes/window-ui/images/**/*']).pipe(gulp.dest('webroot/themes/window-ui/images/'))
	},
	() => {
		return gulp.src(
			["webroot/themes/window-ui/styles/**/*.less"], 
			{read: false, allowEmpty: true}).pipe(clean());
	},
	() => {
			return gulp.src(['src/themes/window-ui/styles/**/*.less'])
				.pipe(concat('all.less'))
 				.pipe(less({compress: false})).on('error', (e) => {console.log(e)})
 				.pipe(gulp.dest("webroot/themes/window-ui/styles/"))
 				.pipe(minifycss()).pipe(rename({suffix: '.min'}))
 				.pipe(gulp.dest("webroot/themes/window-ui/styles/"))
	},
));
themeTasks.push("process-style-window-ui");

// =======================
// css for TRPG
// =======================
gulp.task("process-style-trpg", gulp.series(
	() => {
		return gulp.src(['webroot/themes/trpg/images/*'], { read: false, allowEmpty: true })
			.pipe(clean());
	}, 
	() => {
		return gulp.src(['src/themes/trpg/images/*']).pipe(gulp.dest('webroot/themes/trpg/images/'))
	},
));
themeTasks.push("process-style-trpg");


// =======================
// javascript
// =======================

//const scriptJsSrc = 'src/scripts/js/';
//const scriptJsTag = 'webroot/scripts/js/';
//gulp.task('clean-javascript', () => {
//	return gulp.src([scriptJsTag + '*'], 
//		{read: false, allowEmpty: true}).pipe(clean());
//});

//// 检查javascript
//gulp.task('check-javascript', () => {
//	return gulp.src(scriptJsSrc + '**/*.js').pipe(jshint())
//		.pipe(jshint.reporter('default'));
//});


//// 合并、压缩、重命名javascript
//gulp.task('process-javascript', gulp.series('clean-javascript', () => {
//	return gulp.src([
//		scriptJsSrc + 'basic.js',
//		scriptJsSrc + 'jqueryTools.js',
//		scriptJsSrc + 'web.js',
//		scriptJsSrc + 'dataStructure.js',
//		scriptJsSrc + 'wiki.js'
//	]).pipe(jshint()).pipe(jshint.reporter('default'))
//		.pipe(gulp.dest(scriptJsTag))
//		//.pipe(concat('all.js'))
//		//.pipe(gulp.dest(scriptJsTag))
//		.pipe(rename({suffix: '.min'})).pipe(uglify())
//		.pipe(gulp.dest(scriptJsTag))
//}));
//themeTasks.push('process-javascript')

const scriptTsRef = 'src/scripts/include/';
const scriptTsSrc = 'src/scripts/ts/';
const scriptTsTag = 'webroot/scripts/ts/';

gulp.task('clean-typescript', () => {
	return gulp.src([scriptTsTag + '*'], 
		{read: false, allowEmpty: true}).pipe(clean());
});

// 合并、压缩、重命名typescript
gulp.task('process-typescript', gulp.series('clean-typescript', () => {
	return gulp.src([
		scriptTsRef + 'refTypes.d.ts',
		scriptTsSrc + 'resource.ts',
		scriptTsSrc + 'basic.ts',
		scriptTsSrc + 'dataStructure.ts',
		scriptTsSrc + 'geo2d.ts',
		scriptTsSrc + 'canvas.ts',
		scriptTsSrc + 'web.ts',
		scriptTsSrc + 'webHtmlPage.ts',
		scriptTsSrc + '3rdLibTool.ts',
		scriptTsSrc + 'wiki.ts',
		scriptTsSrc + 'blog.ts',
		scriptTsSrc + 'UIWindow.ts',
		scriptTsSrc + 'sandtable.ts',
		scriptTsSrc + 'testJadeTRPG.ts',
		scriptTsSrc + 'testJadeUtils.ts',
		scriptTsSrc + 'testJadeUI.ts',
	]).pipe(ts({
		target: "es6",
		module: "es6",
		noImplicitAny: true,
		strict: true,
		declaration: true,
		// sourcemap: true,
		// lib: ["ES2021.String"]
    })).pipe(gulp.dest(scriptTsTag))
		//.pipe(concat('all.js'))
		//.pipe(gulp.dest(scriptTsTag))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(scriptTsTag))
}));
themeTasks.push('process-typescript');

gulp.task('compress-typescript', gulp.series('process-typescript', () => {
	return gulp.src([
		scriptTsTag + 'resource.js',
		scriptTsTag + 'basic.js',
		scriptTsTag + 'dataStructure.js',
		scriptTsTag + 'geo2d.js',
		scriptTsTag + 'canvas.js',
		scriptTsTag + 'web.js', 
		scriptTsTag + 'webHtmlPage.js',
		scriptTsTag + '3rdLibTool.js',
		scriptTsTag + 'wiki.js',
		scriptTsTag + 'blog.js',
		scriptTsTag + 'UIWindow.js',
		scriptTsTag + 'sandtable.js',
		scriptTsTag + 'testJadeTRPG.js',
		scriptTsTag + 'testJadeUtils.js',
		scriptTsTag + 'testJadeUI.js',
	]).pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
		.pipe(gulp.dest(scriptTsTag))
}));
themeTasks.push('compress-typescript');



gulp.task('default', gulp.parallel(themeTasks))

