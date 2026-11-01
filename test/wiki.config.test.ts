/**
 * Wiki 页面的配置表
 *
 * P2 第三项的产物：`apiRoot` / `pageTitle` / brush 脚本目录原来写死在
 * `initWikiPage()` 的函数体里，其中 brush 目录指向本项目之外的 vimwiki 项目。
 * 现在三项都可注入，默认值保持原样（外部调用方不用改）。
 *
 * 这里只测配置表本身，不测 `initWikiPage()` —— 它要 jQuery、MathJax、
 * SyntaxHighlighter 三个全局库，脱离浏览器跑不起来。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	DEFAULT_WIKI_PAGE_CONFIG, WikiPageConfig,
} from '../src/scripts/ts/blog/wiki.js';

describe('DEFAULT_WIKI_PAGE_CONFIG', () => {

	test('四项默认值与重构前写死的值一致', () => {
		// 外部 vimwiki 项目靠这些默认值继续跑，改动等于悄悄改了那边的行为
		assert.deepEqual(DEFAULT_WIKI_PAGE_CONFIG, {
			apiRoot: '/',
			pageTitle: 'Study Notes',
			hlCodePath: '../../vimwiki-theme/3rd/SyntaxHighlighter/2.1.364/scripts',
			ajaxTimeout: 500,
		});
	});

	test('hlCodePath 不带尾斜杠', () => {
		// loadCodeHightlight 内部拼的是 `${root}${path}/`，带尾斜杠会出现 //
		assert.ok(!DEFAULT_WIKI_PAGE_CONFIG.hlCodePath.endsWith('/'));
	});

	test('展开覆盖时只改传了的项', () => {
		const opt: WikiPageConfig = { hlCodePath: '/my/brushes' };
		const merged = { ...DEFAULT_WIKI_PAGE_CONFIG, ...opt };
		assert.equal(merged.hlCodePath, '/my/brushes');
		assert.equal(merged.pageTitle, 'Study Notes', '没传的项不受影响');
	});

});
