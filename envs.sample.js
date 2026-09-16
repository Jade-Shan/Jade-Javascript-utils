exports.deployEnvs = {
	dev: {
		buildversion: "dev-0.0.1-",
		webRoot: ".",
		staticRoot: ".",
		apiRoot: "//localhost:8082",
		cdnRoot: "//localhost:8081",
		cdn3rd : "//cdn.bootcss.com"
	},
	rls: {
		buildversion: "rls-0.0.1-",
		webRoot: ".",
		staticRoot: ".",
		apiRoot: "//:8082/src/mock-backend",
		cdnRoot: "//:8081/jadeutils.v2",
		cdn3rd : "//:8081/3rd.v2"
	}
};
