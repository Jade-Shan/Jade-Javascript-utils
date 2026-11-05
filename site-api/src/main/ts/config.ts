import path from 'path';
import { ICliArgs, IGlobalCfg } from '@/types';
import dotenv from 'dotenv';
// 配置文件用 config[.环境].properties 命名，而非 dotenv 默认的 .env——
// 后者是隐藏文件，在文件管理器和 IDE 里容易被忽略。
// 注意路径相对**进程工作目录**（项目根）解析，不是相对本文件，所以必须从项目根启动。

// 加载公共配置
dotenv.config({ path: 'config.properties' });

// 加载环境专属配置，覆盖同名变量
const appEnv = process.env.APP_ENV || 'dev';
// dotenv.config({ path: `config.${appEnv}.properties`, override: true });
console.log(`🌍 当前环境: ${appEnv}`);

export const initGlobalCfg = (args: ICliArgs): IGlobalCfg => {

	const port = args['--port'] || process.env.PORT || '3000';
	const host = args['--host'] || process.env.HOST || 'localhost';
	const uploadPath = args['--uploadPath'] || process.env.UPLOAD_PATH || '/tmp/';

	// Redis 连接参数来自 config.properties，不再硬编码。
	// 三个命名连接（trpg / blog / auth）沿用旧后端的划分，共用同一个实例，
	// 靠 key 前缀隔离数据，所以 host / port 对三者相同。
	const redisHost = process.env.REDIS_HOST || '127.0.0.1';
	const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
	// REDIS_NAME 只做连接标签（ioredis 的 connectionName），用于在 Redis 的
	// CLIENT LIST 里识别是哪个服务、哪个环境连进来的，便于排查。
	// 它不参与 key 的拼接，所以改它不影响读写存量数据。
	const redisName = process.env.REDIS_NAME || 'jade-dungeon';

	// SQLite 数据库文件路径。auth 模块的数据存在这里，不再走 Redis。
	// 相对路径按进程工作目录（项目根）解析，与 config.properties 一致。
	const sqlitePath = process.env.SQLITE_PATH || 'data/jade-dungeon.db';
	const sqliteReadPoolSize = parseInt(process.env.SQLITE_READ_POOL_SIZE || '8', 10);

	// 允许跨域的来源，逗号分隔。留空或不配则放开所有来源（等同 '*'）。
	// 注意这里要填带协议和端口的完整 origin，如 http://www.example.com:8082，
	// 浏览器发来的 Origin 头就是这个形式，字符串必须完全匹配。
	const crosSite = (process.env.CROS_SITE || '')
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	const globalCfg: IGlobalCfg = {
		server: { hostname: host, port: port },
		sqlite: { path: sqlitePath, readPoolSize: sqliteReadPoolSize },
		crosSite: crosSite,
		redis: [
			{ key: 'trpg', host: redisHost, port: redisPort, name: `${redisName}:trpg` },
			{ key: 'blog', host: redisHost, port: redisPort, name: `${redisName}:blog` },
			{ key: 'auth', host: redisHost, port: redisPort, name: `${redisName}:auth` },
		],
		path: {
			appRootDir: path.resolve(__dirname),
			staticFile: [{ path: "/static", folder: "static" }],
		},
		upload: {
			tmpPath: uploadPath,
			maxSize: 1 * 1024 * 1024,
		}
	};
	return globalCfg;
};