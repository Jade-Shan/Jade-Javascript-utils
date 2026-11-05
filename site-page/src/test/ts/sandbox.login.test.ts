/**
 * 登录页：校验、cookie、跳转 URL 拼装
 *
 * sandbox 模块迁移的期 5 产物。这一页不碰 Canvas，所以能测得比较全。
 *
 * 要盯住的：
 *
 * - **跳转前检查登录态**：老代码是「点进入时顺便再登录一次」，
 *   那样每次进场景都换新 token、作废旧的，开两个标签页前一个就失效
 * - **三个场景参数缺一个就不跳**，而不是跳过去再报错
 * - **参数做 URL 编码**：战役名可能有空格和 `&`
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withDom, withDomAsync } from './_jsdom-setup.js';
import { initSandboxLogin } from '../../main/ts/sandbox/sandboxLogin.js';

/** 登录页的 DOM，和 html/sandbox/index.html 的结构一致 */
const PAGE = `
	<input id="username" type="text" />
	<input id="password" type="password" />
	<input id="campaignId" type="text" />
	<input id="placeId" type="text" />
	<input id="sceneId" type="text" />
	<button id="btn-login">登录</button>
	<button id="btn-regist">注册</button>
	<button id="btn-enter">进入场景</button>
	<button id="btn-edit">编辑场景</button>
	<p id="login-status"></p>`;

/** 记下假 XHR 收到的请求 */
let sent: Array<{ url: string, method: string, body?: string }> = [];

/**
 * 用假 XHR 顶替真实请求
 * @param resp - 响应体
 */
function stubXhr(resp: unknown): void {
	sent = [];
	class FakeXhr {
		status = 200;
		statusText = 'OK';
		responseText = '';
		timeout = 0;
		withCredentials = false;
		onload: ((e: unknown) => void) | null = null;
		onerror: ((e: unknown) => void) | null = null;
		private url = '';
		private method = '';
		open(m: string, u: string): void { this.method = m; this.url = u; }
		setRequestHeader(): void { }
		send(body?: string): void {
			sent.push({ url: this.url, method: this.method, body: body });
			this.responseText = JSON.stringify(resp);
			this.onload?.({});
		}
	}
	(globalThis as unknown as Record<string, unknown>).XMLHttpRequest = FakeXhr;
}

/** 点一个按钮 */
function click(id: string): void {
	document.getElementById(id)!.dispatchEvent(new MouseEvent('click'));
}

/** 读状态提示 */
const status = () => document.getElementById('login-status')!.textContent ?? '';

/** 填输入框 */
function fill(id: string, v: string): void {
	(document.getElementById(id) as HTMLInputElement).value = v;
}

describe('init 回填', () => {

	test('URL 带场景参数时回填进输入框', () => {
		withDom(PAGE, () => {
			initSandboxLogin({ apiRoot: '/' });
			assert.equal((document.getElementById('campaignId') as HTMLInputElement).value, 'c1');
			assert.equal((document.getElementById('placeId') as HTMLInputElement).value, 'p1');
			assert.equal((document.getElementById('sceneId') as HTMLInputElement).value, 's1');
		}, 'http://localhost/index.html?campaignId=c1&placeId=p1&sceneId=s1');
	});

	test('没有 cookie 时提示请先登录', () => {
		withDom(PAGE, () => {
			initSandboxLogin({ apiRoot: '/' });
			assert.ok(status().includes('请先登录'), `实际: ${status()}`);
		});
	});

	test('已有 cookie 时回填用户名并显示身份', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=teo|uuid|1;path=/';
			initSandboxLogin({ apiRoot: '/' });
			assert.equal((document.getElementById('username') as HTMLInputElement).value, 'teo');
			assert.ok(status().includes('已登录'), `实际: ${status()}`);
		});
	});

});

describe('登录', () => {

	test('成功后写 cookie 并显示身份', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'success', username: 'teo', token: 'teo|uuid|9' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'teo');
			fill('password', 'pw');
			click('btn-login');
			await new Promise(r => setTimeout(r, 10));
			assert.ok(status().includes('已登录'), `实际: ${status()}`);
			assert.ok(document.cookie.includes('username=teo'), `cookie: ${document.cookie}`);
			assert.ok(document.cookie.includes('loginToken='), `cookie: ${document.cookie}`);
		});
	});

	test('走 POST，密码不出现在 URL 里', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'success', username: 'teo', token: 't' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'teo');
			fill('password', 'secret-pw');
			click('btn-login');
			await new Promise(r => setTimeout(r, 10));
			assert.equal(sent[0].method, 'POST');
			assert.ok(!sent[0].url.includes('secret-pw'),
				'密码走 GET 会留在 URL、浏览器历史和访问日志里');
			assert.ok(sent[0].body?.includes('secret-pw'), '应该在请求体里');
		});
	});

	test('失败时显示后端给的原因，不写 cookie', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'err', msg: 'wrong password' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'teo');
			fill('password', 'bad');
			click('btn-login');
			await new Promise(r => setTimeout(r, 10));
			assert.ok(status().includes('wrong password'), `实际: ${status()}`);
			assert.ok(!document.cookie.includes('loginToken'), '失败不该写 token');
		});
	});

	test('用户名或密码为空时不发请求', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'success' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'teo');
			click('btn-login');
			await new Promise(r => setTimeout(r, 10));
			assert.equal(sent.length, 0, '不该发请求');
			assert.ok(status().includes('都要填'), `实际: ${status()}`);
		});
	});

	test('输入框的首尾空白被去掉', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'success', username: 'teo', token: 't' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', '  teo  ');
			fill('password', 'pw');
			click('btn-login');
			await new Promise(r => setTimeout(r, 10));
			assert.ok(sent[0].body?.includes('username=teo&'), `实际: ${sent[0].body}`);
		});
	});

});

describe('注册', () => {

	test('成功时提示可以登录了（不自动登录）', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'success', username: 'newbie' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'newbie');
			fill('password', 'pw');
			click('btn-regist');
			await new Promise(r => setTimeout(r, 10));
			assert.ok(status().includes('注册成功'), `实际: ${status()}`);
			assert.ok(!document.cookie.includes('loginToken'), '注册不该顺手登录');
		});
	});

	test('用户名被占用时给中文提示', async () => {
		await withDomAsync(PAGE, async () => {
			stubXhr({ status: 'err', msg: 'username exists' });
			initSandboxLogin({ apiRoot: '//api' });
			fill('username', 'teo');
			fill('password', 'pw');
			click('btn-regist');
			await new Promise(r => setTimeout(r, 10));
			assert.ok(status().includes('已被占用'), `实际: ${status()}`);
		});
	});

});

describe('进入场景', () => {

	test('没登录时不跳转，提示请先登录', () => {
		withDom(PAGE, () => {
			initSandboxLogin({ apiRoot: '//api' });
			fill('campaignId', 'c1');
			fill('placeId', 'p1');
			fill('sceneId', 's1');
			click('btn-enter');
			assert.ok(status().includes('请先登录'), `实际: ${status()}`);
		});
	});

	test('三个场景参数缺一个就不跳', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=t;path=/';
			initSandboxLogin({ apiRoot: '//api' });
			fill('campaignId', 'c1');
			fill('placeId', 'p1');
			// sceneId 空着
			click('btn-enter');
			assert.ok(status().includes('三个都要填'), `实际: ${status()}`);
		});
	});

	test('齐全时拼出带三个参数的 URL', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=t;path=/';
			// jsdom 的 window.location 不可重定义，所以用 navigate 这个口子观察
			let jumped = '';
			initSandboxLogin({ apiRoot: '//api', navigate: u => { jumped = u; } });
			fill('campaignId', 'c1');
			fill('placeId', 'p1');
			fill('sceneId', 's1');
			click('btn-enter');
			assert.ok(jumped.startsWith('./view.html?'), `实际: ${jumped}`);
			assert.ok(jumped.includes('campaignId=c1'), jumped);
			assert.ok(jumped.includes('placeId=p1'), jumped);
			assert.ok(jumped.includes('sceneId=s1'), jumped);
		});
	});

	test('编辑按钮跳 editor.html', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=t;path=/';
			let jumped = '';
			initSandboxLogin({ apiRoot: '//api', navigate: u => { jumped = u; } });
			fill('campaignId', 'c1');
			fill('placeId', 'p1');
			fill('sceneId', 's1');
			click('btn-edit');
			assert.ok(jumped.startsWith('./editor.html?'), `实际: ${jumped}`);
		});
	});

	test('场景名里的空格与 & 被编码', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=t;path=/';
			let jumped = '';
			initSandboxLogin({ apiRoot: '//api', navigate: u => { jumped = u; } });
			fill('campaignId', '深水城 & 大冒险');
			fill('placeId', 'p1');
			fill('sceneId', 's1');
			click('btn-enter');
			assert.ok(!jumped.includes('深水城 &'), `裸的 & 会把参数截断: ${jumped}`);
			assert.ok(jumped.includes(encodeURIComponent('深水城 & 大冒险')), jumped);
		});
	});

	test('自定义目标页地址生效', () => {
		withDom(PAGE, () => {
			document.cookie = 'username=teo;path=/';
			document.cookie = 'loginToken=t;path=/';
			let jumped = '';
			initSandboxLogin({ apiRoot: '//api', viewUrl: '/custom/v.html', navigate: u => { jumped = u; } });
			fill('campaignId', 'c1');
			fill('placeId', 'p1');
			fill('sceneId', 's1');
			click('btn-enter');
			assert.ok(jumped.startsWith('/custom/v.html?'), `实际: ${jumped}`);
		});
	});

});

describe('选择器可覆盖', () => {

	test('传了覆盖项时按覆盖后的 id 找元素', async () => {
		await withDomAsync(`
			<input id="my-user" /><input id="my-pw" /><p id="my-status"></p>
			<button id="my-login">登录</button>`, async () => {
			stubXhr({ status: 'success', username: 'teo', token: 't' });
			initSandboxLogin({
				apiRoot: '//api',
				selectors: {
					username: '#my-user', password: '#my-pw',
					loginBtn: '#my-login', status: '#my-status',
				},
			});
			(document.getElementById('my-user') as HTMLInputElement).value = 'teo';
			(document.getElementById('my-pw') as HTMLInputElement).value = 'pw';
			document.getElementById('my-login')!.dispatchEvent(new MouseEvent('click'));
			await new Promise(r => setTimeout(r, 10));
			assert.ok((document.getElementById('my-status')!.textContent ?? '')
				.includes('已登录'));
		});
	});

	test('元素缺失时不抛错', () => {
		withDom('<div></div>', () => {
			initSandboxLogin({ apiRoot: '//api' });
		});
	});

});
