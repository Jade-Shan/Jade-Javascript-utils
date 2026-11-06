/**
 * 遮挡阴影的过滤与排序（filterOccluders）
 *
 * 这是给 view 页沙盘加战争迷雾「墙后阴影」的核心逻辑，纯几何、不碰 canvas
 *（jsdom 没有 2D 上下文，像素只能靠浏览器）。要盯住的是对齐老系统
 * `Observer.filterTokensInView` + `renderTokensOnSandbox` 的四条：
 *
 * - 不挡视线（`blockView === false`）的不投射阴影
 * - 距离超过视野范围的不投射阴影
 * - 观察者自己与 `spectator`（旁观者）不投射阴影
 * - 从远到近排序：远的先画、近的后画压在上面
 *
 * 距离用 `getMostCloseVertex`（点到图形的最短距离），
 * 对圆是「圆心到观察者的距离 - 半径」。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	CircleToken, RectangleToken, SandTableUtils, IObserver, IToken2D,
} from '../../main/ts/trpg/sandtable.js';

/** 观察者工厂：默认视野 500 */
const obs = (x: number, y: number, id?: string): IObserver => ({
	c: { x, y },
	viewRange: () => 500,
	id,
});

/** 一个最小的图片裁剪 */
const clip = () => ({ imgKey: 'icons', sx: 0, sy: 0, width: 50, height: 50 });

/** 半径 10 的圆形遮挡物，blockView 默认 true */
const blocker = (id: string, x: number, y: number, blockView = true): CircleToken =>
	new CircleToken(id, x, y, 10, 0, '#000', '#000', true, blockView, '#0000FF', clip());

describe('filterOccluders 的过滤', () => {

	test('blockView=false 的不投射阴影', () => {
		const tokens: Array<IToken2D> = [
			blocker('see-through', 30, 0, false),   // 距离 20，但挡视线
			blocker('wall', 60, 0, true),            // 距离 50，挡视线
		];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0), 100);
		assert.deepEqual(out.map(t => t.id), ['wall']);
	});

	test('距离 >= 视野范围的不投射阴影', () => {
		const tokens: Array<IToken2D> = [
			blocker('inside', 50, 0),   // 圆心距离 50 - 半径 10 = 40，在范围内
			blocker('edge', 110, 0),    // 100 - 10 = 90？圆心距离 110 - 10 = 100，恰好在边界
			blocker('far', 200, 0),     // 190，超范围
		];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0), 100);
		// 距离 100（edge 的圆心 110 - 半径 10）不小于 range，被过滤
		assert.deepEqual(out.map(t => t.id), ['inside']);
	});

	test('观察者自己不投射阴影', () => {
		const tokens: Array<IToken2D> = [
			blocker('me', 30, 0),          // 距离 20，但就是观察者自己
			blocker('other', 60, 0),       // 距离 50
		];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0, 'me'), 100);
		assert.deepEqual(out.map(t => t.id), ['other']);
	});

	test('spectator（旁观者棋子）不投射阴影', () => {
		const tokens: Array<IToken2D> = [
			blocker('spectator', 30, 0),   // 距离 20
			blocker('other', 60, 0),       // 距离 50
		];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0, 'me'), 100);
		assert.deepEqual(out.map(t => t.id), ['other']);
	});

	test('观察者没设 id 时不误排除（token.id !== undefined 恒真）', () => {
		const tokens: Array<IToken2D> = [blocker('a', 30, 0), blocker('b', 60, 0)];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0), 100);
		assert.equal(out.length, 2, '没有 id 时一个都不该被 id 条件排除');
	});

});

describe('filterOccluders 的排序', () => {

	test('从远到近（远的先画）', () => {
		const tokens: Array<IToken2D> = [
			blocker('near', 30, 0),    // 距离 20
			blocker('mid', 60, 0),     // 距离 50
			blocker('far', 90, 0),     // 距离 80
		];
		const out = SandTableUtils.filterOccluders(tokens, obs(0, 0), 100);
		assert.deepEqual(out.map(t => t.id), ['far', 'mid', 'near'],
			'远 → 近，近的阴影后画压在远的上面');
	});

	test('矩形用最近顶点算距离', () => {
		// 矩形 (40, -10) 40×20，中心 (60, 0)，最近顶点是左上 (40,-10)
		// 距离 sqrt(40² + 10²) ≈ 41.23，在范围内
		const rect = new RectangleToken('r', 40, -10, 40, 20, 0, '#000', '#000',
			true, true, '#0000FF', clip());
		const out = SandTableUtils.filterOccluders([rect], obs(0, 0), 100);
		assert.deepEqual(out.map(t => t.id), ['r']);
	});

});

describe('filterOccluders 的边界', () => {

	test('空列表不抛错', () => {
		assert.deepEqual(SandTableUtils.filterOccluders([], obs(0, 0), 100), []);
	});

	test('全部被过滤时返回空数组', () => {
		const tokens: Array<IToken2D> = [
			blocker('see', 30, 0, false),
			blocker('far', 200, 0, true),
		];
		assert.deepEqual(SandTableUtils.filterOccluders(tokens, obs(0, 0), 100), []);
	});

});
