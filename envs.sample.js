// 构建期的环境配置模板。
//
// 用法：cp envs.sample.js envs.js，再按实际环境改值。
// envs.js 在 .gitignore 中，而 gulpfile.js 顶层 require("./envs")，
// 缺该文件时所有 gulp 任务都会挂。
//
// 这里的值只是示例，实际值见各自环境的 envs.js。
//
// 两个容易踩的坑：
//   1. 所有地址都必须带主机名。写成 "//:8081/xxx"（省略主机）不是合法 URL，
//      new URL() 会抛 Invalid URL，浏览器也解析不了
//   2. staticRoot 不要填 "."。页面与静态资源分属不同服务时（比如页面在 8082、
//      资源在 8081），相对路径会拼到页面所在的服务上，取不到资源
exports.deployEnvs = {
	dev: {
		buildversion: "dev-0.0.1-",
		webRoot: ".",
		// 静态资源（主题 CSS、图片、favicon）的根路径。
		// demo 页面的主题图片也从这里拼：@@staticRoot/themes
		staticRoot: "//cdn.example.com:8081/jadeutils.v3",
		// import map 里模块路径的基址。直接用 webroot/ 布局时，
		// 页面产物在 webroot/html/ 下、脚本产物在 webroot/scripts/ts/ 下，
		// 可填 "../scripts/ts" 回退一级；走 CDN 时填绝对地址
		importMapRoot: "//cdn.example.com:8081/jadeutils.v3/scripts/ts",
		apiRoot: "//api.example.com:8088",
		cdnRoot: "//cdn.example.com:8081",
		// 第三方库的根路径，使用处按 库名/版本/文件 往后拼
		cdn3rd : "//cdn.example.com:8081/3rd"
	},
	rls: {
		buildversion: "rls-0.0.1-",
		webRoot: ".",
		staticRoot: "//cdn.example.com:8081/jadeutils.v3",
		importMapRoot: "//cdn.example.com:8081/jadeutils.v3/scripts/ts",
		apiRoot: "//api.example.com:8088",
		cdnRoot: "//cdn.example.com:8081",
		cdn3rd : "//cdn.example.com:8081/3rd"
	}
};
