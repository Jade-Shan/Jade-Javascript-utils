import { StrUtil } from '../basic.js';
import { WebUtil } from '../web.js';
/**
 * 通用 HTML 页面框架
 *
 * 提供导航栏渲染、分页、主题切换、目录面板等页面级功能。
 */
export class WebHtmlPage {
    /**
     * @param cfg - 页面配置
     */
    constructor(cfg) {
        this.cfg = cfg;
    }
    /**
     * 渲染页首导航栏
     *
     * 骨架 HTML 由 `render` 产出，本方法只负责把结果写进 DOM。
     * 不传 `render` 时用框架无关的 {@link WebHtmlPage.renderPlainTopNav}，
     * 用 Bootstrap 3 的页面传 `BootStrapHelper.renderTopNav`。
     *
     * @param site - 站点配置（品牌名、导航树）
     * @param elemSlt - 目标元素选择器，默认 "#topnav"
     * @param render - 导航栏模板，默认 {@link WebHtmlPage.renderPlainTopNav}
     * @returns {void}
     */
    renderTopNav(site, elemSlt = "#topnav", render = WebHtmlPage.renderPlainTopNav) {
        let navhtml = render({
            items: site.navItems, brandName: site.brandName,
            brandLink: site.brandLink, activeTitle: this.cfg.pageTitle,
        });
        let navElem = document.querySelector(elemSlt);
        if (navElem) {
            navElem.innerHTML = navhtml;
        }
    }
    /**
     * 默认导航栏模板：只有语义结构，不带任何 CSS 框架的 class
     *
     * 产出 `<a class="nav-brand">` + `<ul class="nav-list">`，子菜单是嵌套的
     * `<ul class="nav-sub">`。当前页高亮用 `li.active`，`title` 为空串的项是分隔符
     * `li.divider`。想换成 Bootstrap / 其他框架的骨架，传自己的
     * {@link TopNavRenderer} 给 {@link WebHtmlPage.renderTopNav}。
     *
     * @param ctx - 渲染所需的导航树与品牌信息
     * @returns {string} 导航栏的 HTML 字符串
     */
    static renderPlainTopNav(ctx) {
        let esc = StrUtil.escapeHtml;
        let addLink = (item) => {
            // title 为空串是分隔符，不是导航项
            if (item.title === "") {
                return '<li class="divider"></li>';
            }
            let html = ctx.activeTitle === item.title ? '<li class="active">' : '<li>';
            html = html + '<a';
            if (item.isNewWin) {
                html = html + ' target="_blank"';
            }
            if (item.id) {
                html = html + ' id="' + esc(item.id) + '"';
            }
            return html + ' href="' + esc(item.link || '') + '">' + esc(item.title) + '</a></li>';
        };
        let addSub = (item) => {
            let html = '<li class="nav-group"><span class="nav-group-title">' +
                esc(item.title) + '</span><ul class="nav-sub">';
            if (item.subs && item.subs.length > 0) {
                item.subs.forEach((sub) => { html = html + addLink(sub); });
            }
            return html + '</ul></li>';
        };
        let navhtml = '<a class="nav-brand" href="' + esc(ctx.brandLink) + '">' +
            esc(ctx.brandName) + '</a><ul class="nav-list">';
        if (ctx.items && ctx.items.length > 0) {
            ctx.items.forEach((item) => {
                if (item.link) {
                    navhtml = navhtml + addLink(item);
                }
                else if (item.subs) {
                    navhtml = navhtml + addSub(item);
                }
            });
        }
        return navhtml + '</ul>';
    }
    /**
     * 将 HTML 字符串解析为 DocumentFragment
     *
     * @param html - HTML 字符串
     * @returns {DocumentFragment} 解析后的文档片段
     */
    static parseHTML(html) {
        let t = document.createElement('template');
        t.innerHTML = html;
        return t.content;
    }
    /**
     * 渲染分页导航
     *
     * @param pageNo - 当前页码
     * @param count - 总页数
     * @param callBack - 页码点击回调
     * @returns {HTMLUListElement} 分页 ul 元素
     */
    static renderPaging(pageNo, count, callBack) {
        pageNo = pageNo && pageNo > 0 ? pageNo : 1;
        count = count && count > 0 ? count : 1;
        let bindCallback = (elem, html, n0, addClass, callBack) => {
            let a = document.createElement("a");
            a.innerHTML = html;
            if (callBack && typeof callBack === 'function') {
                a.onclick = (ev) => { callBack(n0); };
            }
            else {
                a.onclick = () => { console.log(`link-not-bind:(${n0})`); };
            }
            let li = document.createElement("li");
            if (addClass && addClass.length > 0) {
                li.classList.add(addClass);
            }
            li.appendChild(a);
            elem.appendChild(li);
        };
        let size = 5;
        // 1 ... 3 4 5 6 7 _8_ 9 10 11 12 13 ... 20
        let ulNode = document.createElement('ul');
        ulNode.classList.add("pagination", "center");
        let i = 1;
        // first page
        if (pageNo === 1) {
            bindCallback(ulNode, "&laquo;", pageNo - 1, "", n => { console.log("already-page-1"); });
        }
        else {
            bindCallback(ulNode, "&laquo;", pageNo - 1, "", callBack);
            bindCallback(ulNode, `${i}`, i, "", callBack);
        }
        i = i + 1;
        // elps
        if (pageNo > (size + 2)) {
            i = pageNo - size;
            bindCallback(ulNode, "...", i, "disable", n => { console.log("elips"); });
        }
        // pre no
        while (pageNo > i) {
            bindCallback(ulNode, `${i}`, i, "", callBack);
            i = i + 1;
        }
        // curr page
        {
            bindCallback(ulNode, `${pageNo}`, pageNo, "active", n => { console.log("already-curr-page"); });
            i = i + 1;
        }
        // post no
        i = pageNo + 1;
        while (i < count && i <= (pageNo + size)) {
            bindCallback(ulNode, `${i}`, i, "", callBack);
            i = i + 1;
        }
        // elps
        if (i < count) {
            bindCallback(ulNode, "...", i, "disable", n => { console.log("elips"); });
        }
        if (pageNo === count) {
            bindCallback(ulNode, "&raquo;", pageNo + 1, "disable", n => { console.log("already-page-max"); });
        }
        else {
            bindCallback(ulNode, `${count}`, count, "", callBack);
            bindCallback(ulNode, "&raquo;", pageNo + 1, "", callBack);
        }
        return ulNode;
    }
    ;
    // static renderPagination(pageNo: number, count: number, genPageHref: (n: number) => string = (num: number) => `javascript:nextPage(${num});`): string {
    // 	pageNo = pageNo && pageNo > 0 ? pageNo : 1;
    // 	count = count && count > 0 ? count : 1;
    // 	let size = 5;
    // 	// 1 ... 3 4 5 6 7 _8_ 9 10 11 12 13 ... 20
    // 	let i = 1;
    // 	let html = '<ul class="pagination center">';
    // 	// first page
    // 	if (pageNo === 1) {
    // 		html = html + '<li><a class="disable">&laquo;</a></li>';
    // 	} else {
    // 		html = html + `<li><a href="${genPageHref(pageNo - 1)}">&laquo;</a></li>`;
    // 		html = html + `<li><a href="${genPageHref(i)}">${i}</a></li>`;
    // 	}
    // 	i = i + 1;
    // 	// elps
    // 	if (pageNo > (size + 2)) {
    // 		i = pageNo - size;
    // 		html = html + '<li><a class="disable">...</a></li>';
    // 	}
    // 	// pre no
    // 	while (pageNo > i) {
    // 		html = html + `<li><a href="${genPageHref(i)}">${i}</a></li>`;
    // 		i = i + 1;
    // 	}
    // 	// curr page
    // 	html = html + `<li class="active"><a>${pageNo }</a></li>`;
    // 	// post no
    // 	i = pageNo + 1;
    // 	while (i < count && i <= (pageNo + size)) {
    // 		html = html + `<li><a href="${genPageHref(i)}">${i}</a></li>`;
    // 		i = i + 1;
    // 	}
    // 	// elps
    // 	if (i < count) {
    // 		html = html + '<li><a class="disable">...</a></li>';
    // 	}
    // 	if (pageNo === count) {
    // 		html = html + '<li><a class="disable">&raquo;</a></li>';
    // 	} else {
    // 		html = html + `<li><a href="${genPageHref(count)}">${count}</a></li>`;
    // 		html = html + `<li><a href="${genPageHref(pageNo + 1)}">&raquo;</a></li>`;
    // 	}
    // 	html = html + '</ul>';
    // 	return html;
    // };
    /**
     * 渲染副标题
     *
     * @param elemSlt - 目标元素选择器，默认 "#subTitle"
     * @returns {void}
     */
    renderSubTitle(elemSlt = "#subTitle") {
        let elem = document.querySelector(elemSlt);
        if (elem) {
            elem.textContent = this.cfg.subTitle;
        }
    }
    ;
    /**
     * 为图片绑定新标签页打开事件
     *
     * @param elemSlt - 图片元素的 CSS 选择器，默认 "img.atc-img"
     * @returns {void}
     */
    bindImageNewTab(elemSlt = 'img.atc-img') {
        let elemArr = document.querySelectorAll(elemSlt);
        elemArr.forEach((photoImg, key, parent) => {
            if (photoImg) {
                photoImg.onclick = (ev) => { WebUtil.openWindow(photoImg.src); };
            }
        });
    }
    static removeElemClass(selectorOrList, ...className) {
        const elemList = typeof selectorOrList === 'string'
            ? document.querySelectorAll(selectorOrList)
            : selectorOrList;
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem) => {
                elem.classList.remove(...className);
            });
        }
    }
    static addElemClass(selectorOrList, ...className) {
        const elemList = typeof selectorOrList === 'string'
            ? document.querySelectorAll(selectorOrList)
            : selectorOrList;
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem) => {
                elem.classList.add(...className);
            });
        }
    }
    static setElemHtml(selectorOrList, html) {
        const elemList = typeof selectorOrList === 'string'
            ? document.querySelectorAll(selectorOrList)
            : selectorOrList;
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem) => {
                elem.innerHTML = html;
            });
        }
    }
    static bindOnClick(selectorOrList, func) {
        const elemList = typeof selectorOrList === 'string'
            ? document.querySelectorAll(selectorOrList)
            : selectorOrList;
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem) => {
                elem.onclick = func;
            });
        }
    }
    /**
     * 准备侧栏目录索引（大窗口固定边栏）
     *
     * @param html - 目录 HTML 字符串
     * @param tagSlt - 目标容器选择器，默认 "div.sideTocIdx"
     * @returns {void}
     */
    static prepareTocIndex(html, tagSlt = "div.sideTocIdx") {
        // document.querySelectorAll
        let elemList = document.querySelectorAll(tagSlt);
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem, idx, parent) => {
                elem.innerHTML = html;
            });
        }
        WebHtmlPage.removeElemClass(`${tagSlt}    ul`, 'toc-icon-close');
        WebHtmlPage.addElemClass(`${tagSlt}    ul`, 'toc-icon-open');
        WebHtmlPage.removeElemClass(`${tagSlt}>ul ul`, 'toc-sub-close');
        WebHtmlPage.addElemClass(`${tagSlt}>ul ul`, 'toc-sub-open');
    }
    ;
    /**
     * 计算边栏目录的高度
     *
     * @param margin - 上下留白边距
     * @returns {number} 计算后的高度
     */
    static caculateSideTocBoxHeight(margin) {
        return document.documentElement.clientHeight - margin - margin - 1;
    }
    ;
    /**
     * 调整目录面板尺寸（大窗口固定边栏）
     *
     * @param elemSlt - 目标元素选择器，默认 "div.sideTocIdx"
     * @param margin - 上下留白边距，默认 80
     * @returns {void}
     */
    changeTocPanelSize(elemSlt = "div.sideTocIdx", margin = 80) {
        let elemList = document.querySelectorAll(elemSlt);
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem, idx, parent) => {
                if (elem.classList.contains("toc-close")) {
                    // do nothing
                }
                else {
                    elem.style.height = `${WebHtmlPage.caculateSideTocBoxHeight(margin)}px`;
                    elem.style.transition = '1s';
                }
            });
        }
    }
    ;
    /**
     * 展开与折叠目录面板
     *
     * @param elemSlt - 目标元素选择器，默认 "div.sideTocIdx"
     * @param margin - 边距，默认 80
     * @param innerSlt - 内部容器选择器，默认 "div.sideToc"
     * @returns {void}
     */
    toggleSideTocWrap(elemSlt = "div.sideTocIdx", margin = 80, innerSlt = "div.sideToc") {
        let elemList = document.querySelectorAll(elemSlt);
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            let innerList = document.querySelectorAll(innerSlt);
            elemList.forEach((elem, idx, parent) => {
                if (elem.classList.contains("toc-close")) {
                    elem.classList.remove("toc-close");
                    if (innerList === null || innerList === void 0 ? void 0 : innerList.length) {
                        innerList.forEach((elemInn, idx, parent) => {
                            // elemInn.style = `overflow: hidden; padding: 10px 20px; height: ${WebHtmlPage.caculateSideTocBoxHeight(margin)}px; transition: 1s;`;
                            elemInn.style.overflow = '';
                            elemInn.style.padding = '';
                            elemInn.style.height = '';
                            elemInn.style.transition = '';
                        });
                    }
                }
                else {
                    elem.classList.add("toc-close");
                    if (innerList === null || innerList === void 0 ? void 0 : innerList.length) {
                        innerList.forEach((elemInn, idx, parent) => {
                            elemInn.style.overflow = 'auto';
                            elemInn.style.padding = '0px 20px';
                            elemInn.style.height = '0px';
                            elemInn.style.transition = '1s';
                        });
                    }
                }
            });
        }
    }
    ;
    /**
     * 展开与折叠目录树
     *
     * @param elemSlt - 目标元素选择器，默认 "div.sideTocIdx"
     * @returns {void}
     */
    toggleSideTocContract(elemSlt = "div.sideTocIdx") {
        let effect = (elem, elemSlt) => {
            if (elem.classList.contains('toc-cont-flg')) {
                elem.classList.remove('toc-cont-flg');
                WebHtmlPage.removeElemClass(`${elemSlt}    ul`, 'toc-icon-close');
                WebHtmlPage.addElemClass(`${elemSlt}    ul`, 'toc-icon-open');
                WebHtmlPage.removeElemClass(`${elemSlt}>ul ul`, 'toc-sub-close');
                WebHtmlPage.addElemClass(`${elemSlt}>ul ul`, 'toc-sub-open');
            }
            else {
                elem.classList.add('toc-cont-flg');
                WebHtmlPage.removeElemClass(`${elemSlt}    ul`, 'toc-icon-open');
                WebHtmlPage.addElemClass(`${elemSlt}    ul`, 'toc-icon-close');
                WebHtmlPage.removeElemClass(`${elemSlt}>ul ul`, 'toc-sub-open');
                WebHtmlPage.addElemClass(`${elemSlt}>ul ul`, 'toc-sub-close');
            }
        };
        let elemList = document.querySelectorAll(elemSlt);
        if (elemList === null || elemList === void 0 ? void 0 : elemList.length) {
            elemList.forEach((elem, idx, parent) => { effect(elem, elemSlt); });
        }
    }
    ;
    /**
     * 切换页面主题
     *
     * @param themeName - 主题名称
     * @param cookieKey - 持久化主题的 Cookie 键，默认 "ui.theme"
     * @param elemSlt - 样式 link 元素选择器，默认 "link[title]"
     * @returns {void}
     */
    changeTheme(themeName, cookieKey = "ui.theme", elemSlt = 'link[title]') {
        let styles = document.querySelectorAll(elemSlt);
        let activeLink = null;
        for (let i = 0; i < styles.length; i++) {
            let lnk = styles[i];
            let ttitle = lnk.title;
            if (ttitle == themeName) {
                activeLink = lnk;
            }
            lnk.disabled = true;
        }
        if (activeLink) {
            WebUtil.setCookieValue(cookieKey, themeName, { sameSite: 'Lax' });
            activeLink.disabled = false;
        }
    }
    ;
    /**
     * 从 Cookie 恢复用户之前选择的主题
     *
     * @param cookieKey - Cookie 键名，默认 "ui.theme"
     * @returns {void}
     */
    initUITheme(cookieKey = "ui.theme") {
        let currUITheme = WebUtil.loadCookieValue(cookieKey);
        if (currUITheme) {
            this.changeTheme(currUITheme);
        }
    }
    ;
    /**
     * 绑定主题切换事件到指定元素
     *
     * @param themes - 主题绑定列表
     * @returns {void}
     */
    bindChangeTheme(themes) {
        let self = this;
        for (let theme of themes) {
            let elem = document.querySelector(theme.elemSlt);
            if (elem) {
                elem.onclick = (ev) => {
                    self.changeTheme(theme.themeName);
                };
            }
        }
    }
}
//# sourceMappingURL=webHtmlPage.js.map