exports.deployEnvs = {
	dev: {
		buildversion: "dev-0.0.1-",
		webRoot: ".",
		staticRoot: ".",
		// import map 里模块路径的基址。页面产物在 webroot/html/ 下，
		// 脚本产物在 webroot/scripts/ts/ 下，所以要回退一级。
		// 换成 CDN 时填绝对地址，如 "//cdn.example.com/jadeutils.v3/scripts/ts"
		importMapRoot: "../scripts/ts",
		apiRoot: "//localhost:8082",
		cdnRoot: "//localhost:8081",
		cdn3rd : "//cdn.bootcss.com"
	},
	rls: {
		buildversion: "rls-0.0.1-",
		webRoot: ".",
		staticRoot: ".",
		// import map 里模块路径的基址。页面产物在 webroot/html/ 下，
		// 脚本产物在 webroot/scripts/ts/ 下，所以要回退一级。
		// 换成 CDN 时填绝对地址，如 "//cdn.example.com/jadeutils.v3/scripts/ts"
		importMapRoot: "//cdn.example.com/jadeutils.v3/scripts/ts",
		apiRoot: "//:8082/src/mock-backend",
		cdnRoot: "//:8081/jadeutils.v2",
		cdn3rd : "//:8081/3rd.v2"
	}
};
