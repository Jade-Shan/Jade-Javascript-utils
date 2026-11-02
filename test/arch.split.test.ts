/**
 * 切分边界的架构约束
 *
 * 阶段 2 要把代码切成「库」和「web 项目」两块
 * （`docs/refactor-20261101.md` 第 18 节，16 条决定）。切分的硬前提是
 * **库不能依赖 web 项目** —— 否则两边编译不开。
 *
 * 这个前提靠人记是记不住的：往库的 `index.ts` 加一行 `export *`
 * 就能悄悄破坏它，而且在目录还没切开的现在，TypeScript 查不出任何问题。
 * 所以用测试钉住。
 *
 * 测的是**源码的 import 关系**，不是编译产物 —— 这是本项目唯一一个
 * 这样做的测试文件（其余都测 `.test-build/` 下的产物，见 12.2 节）。
 * 因为约束本身是关于源码结构的。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * 源码根
 *
 * 用 `process.cwd()` 而不是 `import.meta.dirname` —— 本项目的
 * `module` 是 `ES6`，TS 不允许 `import.meta`（TS1343）。
 * `npm test` 是从仓库根跑的，所以 cwd 就是仓库根。
 */
const ROOT = path.resolve(process.cwd(), 'src/scripts/ts');

/** 第 18 节决定归库侧的文件 */
const LIB: ReadonlySet<string> = new Set([
	'basic.ts', 'dataStructure.ts', 'web.ts', 'resource.ts', 'index.ts',
	'ui/geo2d.ts', 'ui/canvas.ts', 'ui/webHtmlPage.ts', 'ui/uiResource.ts',
	'ui/UIWindow.ts', 'ui/bootstrapTemplate.ts',
]);

/** 第 18 节决定归 web 侧的文件 */
const WEB: ReadonlySet<string> = new Set([
	'blog/blog.ts', 'blog/common.ts', 'blog/gallery.ts', 'blog/wiki.ts',
	'trpg/sandtable.ts', 'trpg/testJadeTRPG.ts',
	'workout/workout.ts', 'workout/workoutData.ts', 'workout/workoutPoseData.ts',
	'workout/testWorkout.ts',
	'site.config.ts', 'testJadeUtils.ts', 'ui/testJadeUI.ts',
	'3rdLibTool.ts',
]);

/** 两边各留一份的 */
const BOTH: ReadonlySet<string> = new Set(['env.demo.ts']);

/** 全局脚本变量。库侧不该出现这些 */
const GLOBAL_LIBS = ['SyntaxHighlighter', 'MathJax', 'showdown'];

/** 列出 `src/scripts/ts` 下全部 `.ts`，路径用 `/` 分隔、相对源码根 */
function listTs(dir: string = ROOT): Array<string> {
	const out: Array<string> = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) { out.push(...listTs(p)); }
		else if (e.name.endsWith('.ts')) {
			out.push(path.relative(ROOT, p).split(path.sep).join('/'));
		}
	}
	return out;
}

/**
 * 取一个文件的内部 import 目标（相对路径的那些），解析成相对源码根的路径
 *
 * `import type` 不算 —— 它编译后被擦除，不构成运行时依赖。
 */
function internalImports(rel: string): Array<string> {
	const txt = fs.readFileSync(path.join(ROOT, rel), 'utf8');
	const out: Array<string> = [];
	// 跳过 import type，它不产生运行时依赖
	const re = /^\s*import\s+(?!type\s)[^;]*?from\s*['"](\.[^'"]+)['"]/gm;
	for (const m of txt.matchAll(re)) {
		let t = path.posix.normalize(
			path.posix.join(path.posix.dirname(rel), m[1]));
		if (t.endsWith('.js')) { t = t.slice(0, -3) + '.ts'; }
		out.push(t);
	}
	return out;
}

/** 文件归哪边 */
function side(rel: string): 'LIB' | 'WEB' | 'BOTH' | 'UNASSIGNED' {
	if (LIB.has(rel)) { return 'LIB'; }
	if (WEB.has(rel)) { return 'WEB'; }
	if (BOTH.has(rel)) { return 'BOTH'; }
	return 'UNASSIGNED';
}

describe('切分边界：库不能依赖 web 项目', () => {

	test('每个 .ts 文件都有明确归属', () => {
		// 新增文件时忘了归类，这条会失败 —— 提醒去更新第 18 节和本文件
		const un = listTs().filter(f => side(f) === 'UNASSIGNED');
		assert.deepEqual(un, [],
			`这些文件还没定归属，去 docs/refactor-20261101.md 第 18 节补上：${un.join(', ')}`);
	});

	test('库侧没有指向 web 侧的运行时 import', () => {
		// 这是切分的硬前提。往库的 index.ts 加一行 export * 就会破坏它
		const bad: Array<string> = [];
		for (const f of listTs()) {
			if (side(f) !== 'LIB') { continue; }
			for (const d of internalImports(f)) {
				if (side(d) === 'WEB') { bad.push(`${f} → ${d}`); }
			}
		}
		assert.deepEqual(bad, [],
			`库侧出现了指向 web 的依赖，切开之后会编译不过：\n  ${bad.join('\n  ')}`);
	});

	test('库侧不依赖任何全局脚本变量', () => {
		// 决定 6 把 renderTopNav 拆进库、其余留 web，就是为了这一条
		const bad: Array<string> = [];
		for (const f of listTs()) {
			if (side(f) !== 'LIB') { continue; }
			const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
			// 去掉注释行再查：注释里提到类名不算依赖
			const code = txt.split('\n')
				.filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
			for (const g of GLOBAL_LIBS) {
				if (code.includes(g)) { bad.push(`${f} 用了 ${g}`); }
			}
			// jQuery 的 $(...) 调用
			if (/[^\w$]\$\(/.test(code)) { bad.push(`${f} 用了 jQuery 的 $()`); }
		}
		assert.deepEqual(bad, [],
			`库侧出现了全局脚本依赖：\n  ${bad.join('\n  ')}`);
	});

	test('库的 index.ts 只汇总库模块', () => {
		// 决定 2：那 6 个 web 模块的 export * 已删掉
		const txt = fs.readFileSync(path.join(ROOT, 'index.ts'), 'utf8');
		const leaked: Array<string> = [];
		for (const m of txt.matchAll(/^export \* from '\.\/(.+)\.js';/gm)) {
			const rel = m[1] + '.ts';
			if (side(rel) !== 'LIB') { leaked.push(rel); }
		}
		assert.deepEqual(leaked, [],
			`库的汇总入口不该 re-export 这些：${leaked.join(', ')}`);
	});

	test('web → 库的依赖是允许的（确认方向判断没写反）', () => {
		// 反向的自检：这个方向应该存在不少条，如果是 0 说明上面的解析逻辑坏了
		let n = 0;
		for (const f of listTs()) {
			if (side(f) !== 'WEB') { continue; }
			n += internalImports(f).filter(d => side(d) === 'LIB').length;
		}
		assert.ok(n > 10, `web → 库应该有很多条依赖，实际只有 ${n} 条，解析逻辑可能坏了`);
	});

});
