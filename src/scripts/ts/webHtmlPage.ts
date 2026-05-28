import { StrUtil } from './basic.js';
import { WebUtil } from './web.js';


export interface PageConfig {
	apiRoot: string;
	pageTitle: string;
	subTitle: string;
	ajaxTimeout: number;

}

export interface NavTreeNode {
	id?: string;
	title: string;
	link?: string;
	isNewWin?: boolean;
	subs?: Array<NavTreeNode>;
}


export class WebHtmlPage {

	cfg: PageConfig;

	constructor(cfg: PageConfig) {
		this.cfg = cfg;
	}

	/**
	 * @param cfg 页面配置
	 * @param items 导航节点列表
	 * @param elemSlt 目标元素选择器
	 */
	renderTopNav(items: Array<NavTreeNode>, elemSlt: string = "#topnav"): void {
		let navhtml = '<div class="navbar-header"> <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#example-navbar-collapse"> <span class="sr-only">切换导航</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span> </button> <a class="navbar-brand" href="/">Jade Dungeon</a> </div> <div class="collapse navbar-collapse" id="example-navbar-collapse"> <ul class="nav navbar-nav">';
		let addLink = (item: NavTreeNode) => {
			if (item.title === "") {
				navhtml = navhtml + '<li class="divider"></li>';
			} else {
				if (this.cfg.pageTitle === item.title) {
					navhtml = navhtml + '<li class="active">';
				} else { navhtml = navhtml + '<li>'; }
				navhtml = navhtml + '<a ' ;
				if (item.isNewWin) { navhtml = navhtml + ' target="_blank" '; }
				if (item.id) { navhtml = navhtml + ' id="' + StrUtil.escapeHtml(item.id) + '" '; }
				navhtml = navhtml + ' href="' + StrUtil.escapeHtml(item.link || '') + '">' + StrUtil.escapeHtml(item.title) + '</a></li>';
			}
		};

		let addSub = function (item: NavTreeNode) {
			navhtml = navhtml + '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">';
			navhtml = navhtml + StrUtil.escapeHtml(item.title);
			navhtml = navhtml + '<b class="caret"></b></a><ul class="dropdown-menu">';
			if (item.subs && item.subs.length > 0) {
				item.subs.forEach((value) => { addLink(value); });
			}
			navhtml = navhtml + '</ul></li>';
		};

		if (items && items.length > 0) {
			items.forEach((item) => {
				if (item.link) { addLink(item); } else if (item.subs) { addSub(item); }
			})
		}
		navhtml = navhtml + '</ul></div>';
		let navElem = document.querySelector(elemSlt);
		if (navElem) {
			navElem.innerHTML = navhtml;
		}
	}

	static parseHTML(html: string): DocumentFragment {
		let t = document.createElement('template');
		t.innerHTML = html;
		return t.content;
	}

	static renderPaging(pageNo: number, count: number, callBack?: (n: number) => void): HTMLUListElement //
	{
		pageNo = pageNo && pageNo > 0 ? pageNo : 1;
		count = count && count > 0 ? count : 1;

		let bindCallback = (elem: HTMLElement, html: string, n0: number, addClass: string, callBack?: (n: number) => void) => {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = html;
			if (callBack && typeof callBack === 'function') {
				a.onclick = (ev: MouseEvent) => { callBack(n0) };
			} else {
				return (ev: MouseEvent) => { console.log(`link-not-bind:(${n0})`) };
			}
			let li = document.createElement("li");
			if (addClass && addClass.length > 0) {
				li.classList.add(addClass)
			}
			li.appendChild(a);
			elem.appendChild(li);
		}

		let size = 5;
		// 1 ... 3 4 5 6 7 _8_ 9 10 11 12 13 ... 20
		let ulNode = document.createElement('ul');
		ulNode.classList.add("pagination", "center");
		let i = 1;
		// first page
		if (pageNo === 1) {
			bindCallback(ulNode, "&laquo;", pageNo - 1, "", n => { console.log("already-page-1") });
		} else {
			bindCallback(ulNode, "&laquo;", pageNo - 1, "", callBack);
			bindCallback(ulNode, `${i}`, i, "", callBack);
		}
		i = i + 1;
		// elps
		if (pageNo > (size + 2)) {
			i = pageNo - size;
			bindCallback(ulNode, "...", i, "disable", n => { console.log("elips") });
		}
		// pre no
		while (pageNo > i) {
			bindCallback(ulNode, `${i}`, i, "", callBack);
			i = i + 1;
		}
		// curr page
		{
			bindCallback(ulNode, `${pageNo}`, pageNo, "active", n => { console.log("already-curr-page") });
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
			bindCallback(ulNode, "...", i, "disable", n => { console.log("elips") });
		}
		if (pageNo === count) {
			bindCallback(ulNode, "&raquo;", pageNo + 1, "disable", n => { console.log("already-page-max") });
		} else {
			bindCallback(ulNode, `${count}`, count, "", callBack);
			bindCallback(ulNode, "&raquo;", pageNo + 1, "", callBack);
		}
		return ulNode;
	};


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
	 * @param cfg 页面配置
	 * @param elemSlt 目标元素选择器
	 */
	renderSubTitle(elemSlt: string = "#subTitle"): void {
		let elem = document.querySelector(elemSlt);
		if (elem) {
			elem.innerHTML = this.cfg.subTitle;
		}
	};

	/**
	 * 
	 * @param elemSlt 
	 */
	bindImageNewTab(elemSlt: string = 'img.atc-img'): void {
		let elemArr = document.querySelectorAll<HTMLImageElement>(elemSlt);
		elemArr.forEach((photoImg: HTMLImageElement, key: number, parent: NodeListOf<HTMLImageElement>) => {
			if (photoImg) {
				photoImg.onclick = (ev: MouseEvent): any => { WebUtil.openWindow(photoImg.src); };
			}
		});
	} 

	static removeElemClass(selector: string, ...className: string[]): void;
	static removeElemClass<T extends HTMLElement>(elemList: NodeListOf<T>, ...className: string[]): void;
	static removeElemClass<T extends HTMLElement>(selectorOrList: string | NodeListOf<T>, ...className: string[]): void {
		const elemList: NodeListOf<HTMLElement> =
			typeof selectorOrList === 'string'
				? document.querySelectorAll<HTMLElement>(selectorOrList)
				: selectorOrList;
		if (elemList?.length) {
			elemList.forEach((elem) => {
				elem.classList.remove(...className);
			});
		}
	}

	static addElemClass(selector: string, ...className: string[]): void;
	static addElemClass<T extends HTMLElement>(elemList: NodeListOf<T>, ...className: string[]): void;
	static addElemClass<T extends HTMLElement>(selectorOrList: string | NodeListOf<T>, ...className: string[]): void {
		const elemList: NodeListOf<HTMLElement> =
			typeof selectorOrList === 'string'
				? document.querySelectorAll<HTMLElement>(selectorOrList)
				: selectorOrList;
		if (elemList?.length) {
			elemList.forEach((elem) => {
				elem.classList.add(...className);
			});
		}
	}

	static setElemHtml(selector: string, html: string): void;
	static setElemHtml<T extends HTMLElement>(elemList: NodeListOf<T>, html: string): void;
	static setElemHtml<T extends HTMLElement>(selectorOrList: string | NodeListOf<T>, html: string): void {
		const elemList: NodeListOf<HTMLElement> =
			typeof selectorOrList === 'string'
				? document.querySelectorAll<HTMLElement>(selectorOrList)
				: selectorOrList;
		if (elemList?.length) {
			elemList.forEach((elem) => {
				elem.innerHTML = html;
			});
		}
	}

	static bindOnClick(selector: string, func: () => void): void;
	static bindOnClick<T extends HTMLElement>(elemList: NodeListOf<T>, func: () => void): void;
	static bindOnClick<T extends HTMLElement>(selectorOrList: string | NodeListOf<T>, func: () => void): void {
		const elemList: NodeListOf<HTMLElement> =
			typeof selectorOrList === 'string'
				? document.querySelectorAll<HTMLElement>(selectorOrList)
				: selectorOrList;
		if (elemList?.length) {
			elemList.forEach((elem) => {
				elem.onclick = func;
			});
		}
	}

	/**
	 * 大窗口时用的固定边栏目录
	 * @param srcSlt 
	 * @param tagSlt 
	 */
	static prepareTocIndex(html: string, tagSlt: string = "div.sideTocIdx"): void {
		// document.querySelectorAll
		let elemList = document.querySelectorAll<HTMLElement>(tagSlt);
		if (elemList?.length) {
			elemList.forEach((elem, idx, parent) => {
				elem.innerHTML = html;
			});
		}
		WebHtmlPage.removeElemClass(`${tagSlt}    ul`, 'toc-icon-close');
		WebHtmlPage.addElemClass   (`${tagSlt}    ul`, 'toc-icon-open' );
		WebHtmlPage.removeElemClass(`${tagSlt}>ul ul`, 'toc-sub-close' );
		WebHtmlPage.addElemClass   (`${tagSlt}>ul ul`, 'toc-sub-open'  );
	};

	/**
	 * 计算边栏目录的高度
	 * 
	 * @param margin 
	 * @returns 
	 */
	static caculateSideTocBoxHeight(margin: number): number {
		return document.documentElement.clientHeight - margin - margin -1;
	};


	/**
	 * 大窗口时用的固定调整边栏目录的高度
	 * 
	 * @param elemSlt 
	 */
	changeTocPanelSize(elemSlt: string = "div.sideTocIdx", margin: number = 80): void {
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (elemList?.length) {
			elemList.forEach((elem, idx, parent) => {
				if (elem.classList.contains("toc-close")) {
					// do nothing
				} else {
					elem.style.height = `${WebHtmlPage.caculateSideTocBoxHeight(margin)}px`;
				elem.style.transition = '1s';
				}
			});
		}
	};


	/**
	 * 展开与折叠目录面板
	 */
	toggleSideTocWrap(elemSlt: string = "div.sideTocIdx", margin: number = 80, innerSlt: string = "div.sideToc"): void {
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (elemList?.length) {
			let innerList = document.querySelectorAll<HTMLElement>(innerSlt);
			elemList.forEach((elem, idx, parent) => {
				if (elem.classList.contains("toc-close")) {
					elem.classList.remove("toc-close");
					if (innerList?.length) {
						innerList.forEach((elemInn, idx, parent) => {
							// elemInn.style = `overflow: hidden; padding: 10px 20px; height: ${WebHtmlPage.caculateSideTocBoxHeight(margin)}px; transition: 1s;`;
							elemInn.style.overflow = '';
							elemInn.style.padding = '';
							elemInn.style.height = '';
							elemInn.style.transition = '';
						});
					}
				} else {
					elem.classList.add("toc-close");
					if (innerList?.length) {
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
	};

	/**
	 * 展开与折叠目录树
	 */
	toggleSideTocContract(elemSlt: string = "div.sideTocIdx"): void {
		let effect = (elem: HTMLElement, elemSlt: string) => {
			if (elem.classList.contains('toc-cont-flg')) {
				elem.classList.remove('toc-cont-flg');
				WebHtmlPage.removeElemClass(`${elemSlt}    ul`, 'toc-icon-close');
				WebHtmlPage.   addElemClass(`${elemSlt}    ul`, 'toc-icon-open' );
				WebHtmlPage.removeElemClass(`${elemSlt}>ul ul`, 'toc-sub-close' );
				WebHtmlPage.   addElemClass(`${elemSlt}>ul ul`, 'toc-sub-open'  );
			} else {
				elem.classList.add('toc-cont-flg');
				WebHtmlPage.removeElemClass(`${elemSlt}    ul`, 'toc-icon-open' );
				WebHtmlPage.   addElemClass(`${elemSlt}    ul`, 'toc-icon-close');
				WebHtmlPage.removeElemClass(`${elemSlt}>ul ul`, 'toc-sub-open'  );
				WebHtmlPage.   addElemClass(`${elemSlt}>ul ul`, 'toc-sub-close' );
			}
		};
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (elemList?.length) {
			elemList.forEach((elem, idx, parent) => { effect(elem, elemSlt) });
		}
	};



	/**
	 * 
	 * @param themeName 
	 * @param cookieKey 
	 * @param elemSlt 
	 */
	changeTheme(themeName: string, cookieKey: string = "ui.theme", elemSlt: string = 'link[title]'): void {
		let styles = document.querySelectorAll<HTMLLinkElement>(elemSlt);
		let activeLink: HTMLLinkElement|null = null;
		for (let i=0; i < styles.length; i++) {
			let lnk = styles[i];
			let ttitle = lnk.title;
			if (ttitle == themeName) { 
				activeLink = lnk;
			} 
			lnk.disabled = true;
		}
		if (activeLink) {
				WebUtil.setCookieValue(cookieKey, themeName, {sameSite:'Lax'});
				activeLink.disabled = false; 
		}
	};

	/**
	 * 
	 * @param cookieKey 
	 */
	initUITheme(cookieKey: string = "ui.theme"): void {
		let currUITheme = WebUtil.loadCookieValue(cookieKey);
		if (currUITheme) {
			this.changeTheme(currUITheme);
		}
	};

	/**
	 * 
	 * @param themes 
	 */
	bindChangeTheme(themes: Array<{elemSlt: string, themeName: string}>): void {
		let self = this;
		for(let theme of themes) {
			let elem = document.querySelector<HTMLElement>(theme.elemSlt);
			if (elem) {
				elem.onclick = (ev: MouseEvent): any => {
					self.changeTheme(theme.themeName);
				}
			}
		}
	}

}
