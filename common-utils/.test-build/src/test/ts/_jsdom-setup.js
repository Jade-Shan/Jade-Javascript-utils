var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * jsdom 环境装配
 *
 * 被测模块读取 `document` / `location` 这些全局是在**方法调用时**，不是模块加载时
 * （这是之前专门改过的，见 design-pkg.md 的「顶层 DOM 求值」一节）。
 * 所以这里不需要在 import 之前装配，测试用例里按需调用即可。
 *
 * 用法：
 * ```typescript
 * import { withDom } from './_jsdom-setup.js';
 *
 * test('xxx', () => {
 *   withDom('<div id="a"></div>', () => {
 *     // 这里 document 可用
 *   });
 * });
 * ```
 */
import { JSDOM } from 'jsdom';
/** 装配时被覆盖的全局名，退出时要逐个还原 */
const PATCHED = [
    'window', 'document', 'location', 'navigator',
    'HTMLElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLAnchorElement',
    'customElements', 'Node', 'NodeList', 'Element', 'Event', 'MouseEvent',
    'Blob', 'URL', 'XMLHttpRequest', 'IntersectionObserver', 'FileReader',
];
/** 默认的页面地址。cookie 相关的测试需要一个非 about:blank 的源 */
const DEFAULT_URL = 'http://localhost/';
/**
 * 在一个临时的 jsdom 环境里执行 `fn`，结束后还原所有被覆盖的全局
 *
 * 每次调用都新建一个 DOM，所以用例之间不会通过 document 或 cookie 互相影响。
 *
 * @param html - body 的初始 HTML
 * @param fn - 在 DOM 环境里跑的函数
 * @param url - 页面地址，默认 `http://localhost/`
 * @returns {T} `fn` 的返回值
 */
export function withDom(html, fn, url = DEFAULT_URL) {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
        url: url,
        // 不执行页面里的 <script>，测试只需要 DOM 结构
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    const restore = installGlobals(dom);
    try {
        return fn(dom);
    }
    finally {
        restore();
        dom.window.close();
    }
}
/**
 * 把 jsdom 的全局装到 globalThis 上，返回还原函数
 *
 * 用 `Object.defineProperty` 而不是直接赋值：Node 21+ 自带只读的 `navigator`
 * （只有 getter），直接赋值会抛 `Cannot set property navigator`。
 */
function installGlobals(dom) {
    var _a;
    const g = globalThis;
    /** 装配前的属性描述符，null 表示原本不存在 */
    const saved = new Map();
    for (const key of PATCHED) {
        const v = dom.window[key];
        // jsdom 没有的全局（如 IntersectionObserver）保持原样，由用例自己塞
        if (v === undefined) {
            continue;
        }
        saved.set(key, (_a = Object.getOwnPropertyDescriptor(g, key)) !== null && _a !== void 0 ? _a : null);
        Object.defineProperty(g, key, {
            value: v, writable: true, configurable: true, enumerable: true,
        });
    }
    return () => {
        for (const [key, desc] of saved) {
            if (desc) {
                Object.defineProperty(g, key, desc);
            }
            else {
                delete g[key];
            }
        }
    };
}
/**
 * `withDom` 的异步版本
 *
 * 注意全局会在 `fn` 的 promise 落定后才还原。所以同一时刻只能有一个
 * `withDomAsync` 在跑 —— 并发调用会互相覆盖全局。测试用例默认是顺序执行的，
 * 不特意开并发就没问题。
 */
export function withDomAsync(html_1, fn_1) {
    return __awaiter(this, arguments, void 0, function* (html, fn, url = DEFAULT_URL) {
        const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
            url: url, runScripts: 'outside-only', pretendToBeVisual: true,
        });
        const restore = installGlobals(dom);
        try {
            return yield fn(dom);
        }
        finally {
            restore();
            dom.window.close();
        }
    });
}
//# sourceMappingURL=_jsdom-setup.js.map