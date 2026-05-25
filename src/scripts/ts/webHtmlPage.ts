import { WebUtil } from './web.js';


declare interface BootstrapModalDialog {
	modal(type: string): void;
}

export interface PageConfig {
	apiRoot: string;
	pageTitle: string;
	subTitle: string;
	ajaxTimeout: number;

	//constructor(apiRoot: string = "/", pageTitle: string = "New Page", subTitle: string = "new Desc",
	//	ajaxTimeout: number = 5000) //
	//{
	//	this.apiRoot = apiRoot;
	//	this.pageTitle = pageTitle;
	//	this.subTitle = subTitle;
	//	this.ajaxTimeout = ajaxTimeout;
	//}

}

export interface NavTreeNode {
	id?: string;
	title: string;
	link?: string
	isNewWin?: boolean;
	subs?: Array<NavTreeNode>;
}


export class WebHtmlPage {

	cfg: PageConfig;

	constructor(cfg: PageConfig) {
		this.cfg = cfg;
	}

	/**
	 * 
	 * @param cfg 顶部导航栏
	 * @param items 
	 */
	renderTopNav(cfg: PageConfig, items: Array<NavTreeNode>, elemSlt?: string): void {
		let navhtml = '<div class="navbar-header"> <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#example-navbar-collapse"> <span class="sr-only">切换导航</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span> </button> <a class="navbar-brand" href="/">Jade Dungeon</a> </div> <div class="collapse navbar-collapse" id="example-navbar-collapse"> <ul class="nav navbar-nav">';
		let addLink = (item: NavTreeNode, cfg: PageConfig) =>  {
			if (item.title === "") {
				navhtml = navhtml + '<li class="divider"></li>';
			} else {
				if (cfg && cfg.pageTitle === item.title) {
					navhtml = navhtml + '<li class="active">';
				} else { navhtml = navhtml + '<li>'; }
				navhtml = navhtml + '<a ' ;
				if (item.isNewWin) { navhtml = navhtml + ' target="_blank" '; } 
				if (item.id) { navhtml = navhtml + ' id="' + item.id + '" '; } 
				navhtml = navhtml + ' href="' + item.link + '">' + item.title + '</a></li>';
			}
		};

		let addSub = function (item: NavTreeNode) {
			navhtml = navhtml + '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">';
			navhtml = navhtml + item.title;
			navhtml = navhtml + '<b class="caret"></b></a><ul class="dropdown-menu">';
			if (item.subs && item.subs.length > 0) {
				item.subs.forEach((value, idx, arrys) => { addLink(value, cfg); });
			}
			navhtml = navhtml + '</ul></li>';
		};

		if (items && items.length > 0) {
			items.forEach((item, idx, arrys) => {
				if (item.link) { addLink(item, cfg); } else if (item.subs) { addSub(item); }
			})
		}
		navhtml = navhtml + '</ul></div>';
		let navElem = document.querySelector(elemSlt ? elemSlt : "#topnav");
		if (navElem) {
			navElem.innerHTML = navhtml;
		}
	}

	static parseHTML(html: string) {
		let t = document.createElement('template');
		t.innerHTML = html;
		return t.content;
	}

	static renderPaging(pageNo: number, count: number, genHref?: (n: number) => string, 
		goPageFunc?: (n: number) => void): HTMLUListElement //
	{
		pageNo = pageNo && pageNo > 0 ? pageNo : 1;
		count  = count  && count  > 0 ? count  : 1;

		let genGoPage = (n0: number) => {
			return goPageFunc ? (ev: MouseEvent) => { goPageFunc(n0) } :
			(ev: MouseEvent) => {console.log(`go-page(${n0})`)}; 
		}

		let size = 5;
		// 1 ... 3 4 5 6 7 _8_ 9 10 11 12 13 ... 20
		let ulNode = document.createElement('ul');
		ulNode.classList.add("pagination", "center");
		let i = 1;
		// first page
		if (pageNo === 1) {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = "&laquo;";
			a.onclick = ev => {console.log("already-page-1")};
			if (genHref) { a.href = "javascript:void(0);"; }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
		} else {
			{
				let a: HTMLAnchorElement = document.createElement("a");
				a.innerHTML = "&laquo;";
				a.onclick = genGoPage(pageNo - i);
				if (genHref) { a.href = genHref(pageNo - 1); }
				let li = document.createElement("li");
				li.appendChild(a);
				ulNode.appendChild(li);
			}
			//
			{
				let a: HTMLAnchorElement = document.createElement("a");
				a.innerHTML = `${i}`;
				a.onclick = genGoPage(i);
				if (genHref) { a.href = genHref(i) }
				let li = document.createElement("li");
				li.appendChild(a);
				ulNode.appendChild(li);
			}
		}
		i = i + 1;
		// elps
		if (pageNo > (size + 2)) {
			i = pageNo - size;
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = "...";
			a.classList.add("disable");
			a.onclick = ev => console.log(`elips`);
			if (genHref) { a.href = "javascript:void(0);"; }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
		}
		// pre no
		while (pageNo > i) {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = `${i}`;
			a.onclick = genGoPage(i);
			if (genHref) { a.href = genHref(i); }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
			i = i + 1;
		}
		// curr page
		{
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = `${pageNo}`;
			a.onclick = ev => console.log(`already-curr-page`);
			if (genHref) { a.href = "javascript:void(0);"; }
			let li = document.createElement("li");
			li.classList.add("active")
			li.appendChild(a);
			ulNode.appendChild(li);
			i = i + 1;
		}
		// post no
		i = pageNo + 1;
		while (i < count && i <= (pageNo + size)) {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = `${i}`;
			a.onclick = genGoPage(i);
			if (genHref) { a.href = genHref(i); }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
			i = i + 1;
		}
		// elps
		if (i < count) {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = "...";
			a.classList.add("disable");
			a.onclick = ev => console.log(`elips`);
			if (genHref) { a.href = "javascript:void(0);"; }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
		}
		if (pageNo === count) {
			let a: HTMLAnchorElement = document.createElement("a");
			a.innerHTML = "&raquo;";
			a.classList.add("disable");
			a.onclick = ev => console.log("already-page-max");
			if (genHref) { a.href = "javascript:void(0);"; }
			let li = document.createElement("li");
			li.appendChild(a);
			ulNode.appendChild(li);
		} else {
			{
				let a: HTMLAnchorElement = document.createElement("a");
				a.innerHTML = `${count}`;
				a.onclick = genGoPage(count);
				if (genHref) { a.href = genHref(count); }
				let li = document.createElement("li");
				li.appendChild(a);
				ulNode.appendChild(li);
			}
			{
				let a: HTMLAnchorElement = document.createElement("a");
				a.innerHTML = "&raquo;";
				a.onclick = genGoPage(pageNo + 1);
				if (genHref) { a.href = genHref(pageNo + 1); }
				let li = document.createElement("li");
				li.appendChild(a);
				ulNode.appendChild(li);
			}
		}
		return ulNode;
	};


	static renderPagination(pageNo: number, count: number, genPageHref?: (n: number) => string): string {
		pageNo = pageNo && pageNo > 0 ? pageNo : 1;
		count  = count  && count  > 0 ? count  : 1;
		let size = 5;
		// 1 ... 3 4 5 6 7 _8_ 9 10 11 12 13 ... 20
		genPageHref = genPageHref ? genPageHref : (num: number) =>`javascript:nextPage(${num});`; 
		let i = 1;
		let html = '<ul class="pagination center">';
		// first page
		if (pageNo === 1) {
			html = html + '<li><a class="disable" href="javascript:void(0);">&laquo;</a></li>';
		} else {
			html = html + `<li><a href="${genPageHref(pageNo - 1)}">&laquo;</a></li>`;
			html = html + `<li><a href="${genPageHref(i)}'">${i}</a></li>`;
		}
		i = i + 1;
		// elps
		if (pageNo > (size + 2)) {
			i = pageNo - size;
			html = html + '<li><a class="disable" href="javascript:void(0);">...</a></li>';
		}
		// pre no
		while (pageNo > i) {
			html = html + `<li><a href="${genPageHref(i)}'">${i}</a></li>`;
			i = i + 1;
		}
		// curr page
		html = html + `<li class="active"><a href="javascript:void(0);">${pageNo }</a></li>`;
		// post no
		i = pageNo + 1;
		while (i < count && i <= (pageNo + size)) {
			html = html + `<li><a href="${genPageHref(i)}'">${i}</a></li>`;
			i = i + 1;
		}
		// elps
		if ((i + 2) < count) {
			html = html + '<li><a class="disable" href="javascript:void(0);">...</a></li>';
		}
		if (pageNo === count) {
			html = html + '<li><a class="disable" href="javascript:void(0);">&raquo;</a></li>';
		} else {
			html = html + `<li><a href="${genPageHref(count)}">${count}</a></li>`;
			html = html + `<li><a href="${genPageHref(pageNo + 1)}">&raquo;</a></li>`;
		}
		html = html + '</ul>';
		return html;
	};

	/**
	 * 
	 * @param page 
	 * @param elemSlt 
	 */
	renderSubTitle(cfg: PageConfig, elemSlt?: string): void {
		let elem = document.querySelector(elemSlt ? elemSlt : "#subTitle");
		if (elem) {
			elem.innerHTML = cfg.subTitle;
		}
	};

	/**
	 * 
	 * @param elemSlt 
	 */
	bindImageNewTab(elemSlt?: string): void {
		let elemArr = document.querySelectorAll<HTMLImageElement>(elemSlt = elemSlt ? elemSlt : 'img.atc-img');
		elemArr.forEach((photoImg: HTMLImageElement, key: number, parent: NodeListOf<HTMLImageElement>) => {
			if (photoImg) {
				photoImg.onclick = (ev: MouseEvent): any => { WebUtil.openWindow(photoImg.src); };
			}
		});
	} 

	static removeElemClass<T extends HTMLElement>(elemList: NodeListOf<T>, ...className: string[]): void {
		if (null != elemList && elemList.length > 0) {
			if (null != className) {
				elemList.forEach((elem, idx, parent) => {
					elem.classList.remove(...className);
				});
			}
		}
	}

	static removeElemClassBySelectorAll(selectorAll: string, ...className: string[]): void {
		let elemArr = document.querySelectorAll<HTMLElement>(selectorAll);
		WebHtmlPage.removeElemClass(elemArr, ...className);		

	}

	static addElemClass<T extends HTMLElement>(elemList: NodeListOf<T>, ...className: string[]): void {
		if (null != elemList && elemList.length > 0) {
			if (null != className) {
				elemList.forEach((elem, idx, parent) => {
					elem.classList.add(...className);
				});
			}
		}
	}

	static addElemClassBySelectorAll(selectorAll: string, ...className: string[]): void {
		let elemArr = document.querySelectorAll<HTMLElement>(selectorAll);
		WebHtmlPage.addElemClass(elemArr, ...className);		
	}

	static setElemHtml<T extends HTMLElement>(elemList: NodeListOf<T>, html: string): void {
		if (null != elemList && elemList.length > 0) {
				elemList.forEach((elem, idx, parent) => {
					elem.innerHTML = html;
				});
		}
	}

	static setElemHtmlBySelectorAll(selectorAll: string, html: string): void {
		let elemArr = document.querySelectorAll<HTMLElement>(selectorAll);
		WebHtmlPage.setElemHtml(elemArr, html);		
	}

	static bindOnClick<T extends HTMLElement>(elemList: NodeListOf<T>, func: () => void): void {
		if (null != elemList && elemList.length > 0) {
			elemList.forEach((elem, idx, parent) => {
				elem.onclick = func;
			});
		}
	}

	static bindOnClickBySelectorAll(selectorAll: string, func: () => void): void {
		let elemArr = document.querySelectorAll<HTMLElement>(selectorAll);
		WebHtmlPage.bindOnClick(elemArr, func);		
	}

	/**
	 * 大窗口时用的固定边栏目录
	 * @param srcSlt 
	 * @param tagSlt 
	 */
	static prepareTocIndex(html: string, tagSlt?: string): void {
		tagSlt = tagSlt ? tagSlt : "div.sideTocIdx";
		// document.querySelectorAll
		let elemList = document.querySelectorAll<HTMLElement>(tagSlt);
		if (null != elemList && elemList.length > 0) {
			elemList.forEach((elem, idx, parent) => {
				elem.innerHTML = html;
			});
		}
		this.removeElemClassBySelectorAll(`${tagSlt}    ul`, 'toc-icon-close');
		this.   addElemClassBySelectorAll(`${tagSlt}    ul`, 'toc-icon-open' );
		this.removeElemClassBySelectorAll(`${tagSlt}>ul ul`, 'toc-sub-close' );
		this.   addElemClassBySelectorAll(`${tagSlt}>ul ul`, 'toc-sub-open'  );
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
	changeTocPanelSize(elemSlt?: string, margin?: number): void {
		margin = margin ? margin : 80;

		elemSlt = elemSlt? elemSlt: "div.sideTocIdx";
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (null != elemList && elemList.length > 0) {
			elemList.forEach((elem, idx, parent) => {
				if (elem.classList.contains("toc-close")) {
					// do nothing
				} else {
					elem.style  =  `height: ${WebHtmlPage.caculateSideTocBoxHeight(margin)}px; transition: 1s;`;
				}
			});
		}
	};


	/**
	 * 展开与折叠目录面板
	 */
	toggleSideTocWrap(elemSlt?: string, margin?: number, innerSlt?: string): void {
		elemSlt = elemSlt ? elemSlt : "div.sideTocIdx";
		margin = margin ? margin : 80;
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (null != elemList && elemList.length > 0) {
			innerSlt = innerSlt ? innerSlt : "div.sideToc";
			let innerList = document.querySelectorAll<HTMLElement>(innerSlt);
			elemList.forEach((elem, idx, parent) => {
				if (elem.classList.contains("toc-close")) {
					elem.classList.remove("toc-close");
					if (null != innerList && innerList.length > 0) {
						innerList.forEach((elemInn, idx, parent) => {
							// elemInn.style = `overflow: hidden; padding: 10px 20px; height: ${WebHtmlPage.caculateSideTocBoxHeight(margin)}px; transition: 1s;`;
							elemInn.style = ``;
						});
					}
				} else {
					elem.classList.add("toc-close");
					innerList.forEach((elemInn, idx, parent) => {
						elemInn.style = `overflow: auto; padding: 0px 20px; height: 0px; transition: 1s;`;
					});
				}
			});
		}
	};

	/**
	 * 展开与折叠目录树
	 */
	toggleSideTocContract(elemSlt?: string): void {
		let effect = (elem: HTMLElement, elemSlt: string) => {
			if (elem.classList.contains('toc-cont-flg')) {
				elem.classList.remove('toc-cont-flg');
				WebHtmlPage.removeElemClassBySelectorAll(`${elemSlt}    ul`, 'toc-icon-close');
				WebHtmlPage.   addElemClassBySelectorAll(`${elemSlt}    ul`, 'toc-icon-open' );
				WebHtmlPage.removeElemClassBySelectorAll(`${elemSlt}>ul ul`, 'toc-sub-close' );
				WebHtmlPage.   addElemClassBySelectorAll(`${elemSlt}>ul ul`, 'toc-sub-open'  );
			} else {
				elem.classList.add('toc-cont-flg');
				WebHtmlPage.removeElemClassBySelectorAll(`${elemSlt}    ul`, 'toc-icon-open' );
				WebHtmlPage.   addElemClassBySelectorAll(`${elemSlt}    ul`, 'toc-icon-close');
				WebHtmlPage.removeElemClassBySelectorAll(`${elemSlt}>ul ul`, 'toc-sub-open'  );
				WebHtmlPage.   addElemClassBySelectorAll(`${elemSlt}>ul ul`, 'toc-sub-close' );
			}
		};
		elemSlt = elemSlt ? elemSlt : "div.sideTocIdx";
		let elemList = document.querySelectorAll<HTMLElement>(elemSlt);
		if (null != elemList && elemList.length > 0) {
			elemList.forEach((elem, idx, parent) => { effect(elem, elemSlt) });
		}
	};



	/**
	 * 
	 * @param themeName 
	 * @param cookieKey 
	 * @param elemSlt 
	 */
	changeTheme(themeName: string, cookieKey?: string, elemSlt?: string): void {
		let styles = document.querySelectorAll<HTMLLinkElement>(elemSlt ? elemSlt : 'link[title]');
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
				WebUtil.setCookieValue(cookieKey ? cookieKey : "ui.theme", themeName, {sameSite:'Lax'});
				activeLink.disabled = false; 
		}
	};

	/**
	 * 
	 * @param cookieKey 
	 */
	initUITheme(cookieKey?: string): void {
		let currUITheme = WebUtil.loadCookieValue(cookieKey ? cookieKey : "ui.theme");
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











