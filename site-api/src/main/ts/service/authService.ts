import crypto from 'crypto';
import { getSqlite } from '@/db';

/** token 有效期：100 天，与旧后端一致 */
export const EXPIRE_RANGE = 1000 * 60 * 60 * 24 * 100;

/** scrypt 参数。N=16384 是 Node 默认值，对登录这种低频操作足够。 */
const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

export interface IAuthUser {
	username: string;
	password_hash: string;
	salt: string;
	hash_algo: string;
	created_at: number;
	updated_at: number;
}

export interface IAuthToken {
	token: string;
	username: string;
	expire_at: number;
	created_at: number;
}

// ───────────────────────── 密码哈希 ─────────────────────────

const scryptAsync = (password: string, salt: string): Promise<string> =>
	new Promise((resolve, reject) => {
		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derived) => {
			if (err) { reject(err); } else { resolve(derived.toString('hex')); }
		});
	});

/** 生成新的盐 + 哈希。注册和密码升级时用。 */
export const hashPassword = async (password: string): Promise<{ hash: string; salt: string }> => {
	const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
	const hash = await scryptAsync(password, salt);
	return { hash, salt };
};

/**
 * 校验密码。用 `timingSafeEqual` 做定长时间比较，避免通过响应时间差推测哈希。
 */
export const verifyPassword = async (password: string, user: IAuthUser): Promise<boolean> => {
	const actual = await scryptAsync(password, user.salt);
	const a = Buffer.from(actual, 'hex');
	const b = Buffer.from(user.password_hash, 'hex');
	if (a.length !== b.length) { return false; }
	return crypto.timingSafeEqual(a, b);
};

// ───────────────────────── token ─────────────────────────

/**
 * 生成登录 token，格式 `username|uuid|expire`，与旧后端一致——
 * 前端把它存进 cookie 后原样回传，改格式会让存量 cookie 失效。
 *
 * 注意用 `crypto.randomUUID()` 而非 `common/jadeutils.ts` 的 `uuid()`：
 * 后者基于 `Math.random()`，不是密码学安全的随机源，token 会可预测。
 */
export const genLoginToken = (username: string): { token: string; expireAt: number } => {
	const expireAt = Date.now() + EXPIRE_RANGE;
	return { token: `${username}|${crypto.randomUUID()}|${expireAt}`, expireAt };
};

export interface IParsedToken {
	username?: string;
	expire?: number;
}

/** 解析 token 字符串。格式不合法时返回空对象，与旧后端行为一致。 */
export const parseLoginToken = (str?: string): IParsedToken => {
	const result: IParsedToken = {};
	if (!str || str.length <= 38) { return result; }
	const arr = str.split('|');
	if (arr.length !== 3 || arr[0].length === 0 || arr[1].length !== 36 || arr[2].length === 0) {
		return result;
	}
	const expire = parseInt(arr[2], 10);
	if (Number.isNaN(expire)) { return result; }
	result.username = arr[0];
	result.expire = expire;
	return result;
};

// ───────────────────────── 用户 ─────────────────────────

export const findUser = async (username: string): Promise<IAuthUser | undefined> =>
	getSqlite().queryOne<IAuthUser>('SELECT * FROM auth_user WHERE username = ?', [username]);

export interface IRegistResult {
	ok: boolean;
	msg: string;
}

/**
 * 注册。用户名已存在时返回 `username exists`，与旧后端的提示一致。
 *
 * 并发注册同名用户时依赖主键约束兜底——两个请求同时通过存在性检查，
 * 后插入的那个会撞 UNIQUE 约束，这里捕获并返回同样的提示。
 */
export const registUser = async (username: string, password: string): Promise<IRegistResult> => {
	const existing = await findUser(username);
	if (existing) { return { ok: false, msg: 'username exists' }; }

	const { hash, salt } = await hashPassword(password);
	const now = Date.now();
	try {
		await getSqlite().run(
			`INSERT INTO auth_user (username, password_hash, salt, hash_algo, created_at, updated_at)
			 VALUES (?, ?, ?, 'scrypt', ?, ?)`,
			[username, hash, salt, now, now]);
		return { ok: true, msg: 'regist success' };
	} catch (err) {
		const msg = (err as Error).message;
		if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY')) {
			return { ok: false, msg: 'username exists' };
		}
		throw err;
	}
};

// ───────────────────────── 登录 ─────────────────────────

export interface ILoginResult {
	ok: boolean;
	msg: string;
	username?: string;
	token?: string;
}

/** 签发 token 并落库。多会话模式，不清除该用户的其他 token。 */
const issueToken = async (username: string): Promise<string> => {
	const { token, expireAt } = genLoginToken(username);
	await getSqlite().run(
		'INSERT INTO auth_token (token, username, expire_at, created_at) VALUES (?, ?, ?, ?)',
		[token, username, expireAt, Date.now()]);
	return token;
};

/** 用户名 + 密码登录 */
export const loginByPassword = async (username: string, password: string): Promise<ILoginResult> => {
	const user = await findUser(username);
	if (!user) { return { ok: false, msg: 'username or password err' }; }

	const matched = user.hash_algo === 'plain'
		? user.password_hash === password          // 旧数据兼容分支，当前无此类数据
		: await verifyPassword(password, user);
	if (!matched) { return { ok: false, msg: 'username or password err' }; }

	// 命中 plain 的话顺手升级成 scrypt
	if (user.hash_algo === 'plain') {
		const { hash, salt } = await hashPassword(password);
		await getSqlite().run(
			`UPDATE auth_user SET password_hash = ?, salt = ?, hash_algo = 'scrypt', updated_at = ?
			 WHERE username = ?`,
			[hash, salt, Date.now(), username]);
		console.log(`🔐 用户 ${username} 的密码已从明文升级为 scrypt 哈希`);
	}

	const token = await issueToken(username);
	return { ok: true, msg: 'login success', username, token };
};

/**
 * 凭 token 续期登录。
 *
 * 旧后端这个分支是坏的（查 key 时用了未定义的变量、又拿包装对象去比字符串），
 * 从来没成功过。这里修好，并且**签发新 token** 来真正延长有效期——
 * 旧实现只是把原样旧 token 重存一遍，而有效期编码在 token 字符串里，所以并没延长。
 *
 * 旧 token 续期后立即失效（一次性），避免同一个 token 被无限期反复续期。
 */
export const loginByToken = async (token: string): Promise<ILoginResult> => {
	const parsed = parseLoginToken(token);
	if (!parsed.username || !parsed.expire) { return { ok: false, msg: 'login expire' }; }

	// 先看 token 字符串自带的有效期，省掉一次查库
	if (parsed.expire < Date.now()) { return { ok: false, msg: 'login expire' }; }

	const row = await getSqlite().queryOne<IAuthToken>(
		'SELECT * FROM auth_token WHERE token = ? AND expire_at > ?', [token, Date.now()]);
	if (!row) { return { ok: false, msg: 'login expire' }; }

	// token 里的用户名必须与库里记录的一致，防止构造跨用户的 token
	if (row.username !== parsed.username) { return { ok: false, msg: 'login expire' }; }

	const fresh = await issueToken(row.username);
	await getSqlite().run('DELETE FROM auth_token WHERE token = ?', [token]);
	return { ok: true, msg: 'login success', username: row.username, token: fresh };
};

/** 校验 token 是否有效，供其他模块做权限判断用 */
export const verifyToken = async (token?: string): Promise<string | undefined> => {
	const parsed = parseLoginToken(token);
	if (!parsed.username || !parsed.expire || parsed.expire < Date.now()) { return undefined; }
	const row = await getSqlite().queryOne<IAuthToken>(
		'SELECT username FROM auth_token WHERE token = ? AND expire_at > ?', [token!, Date.now()]);
	return row && row.username === parsed.username ? row.username : undefined;
};
