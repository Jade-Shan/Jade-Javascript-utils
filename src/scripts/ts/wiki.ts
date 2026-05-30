import { PageConfig, WebHtmlPage, SITE_NAV_ITEMS, SITE_THEMES } from './webHtmlPage.js';

import { SyntaxHighlighterHelper, MathJaxHelper, BootStrapHelper, DataTableHelper } from './3rdLibTool.js';

/**
 * Wiki 页面
 *
 * 组织 Wiki 页面的完整初始化流程，包括导航、代码高亮、数学公式、
 * 图片查看、DataTable 以及目录面板的交互。
 */
export class WikiPage {

	/**
	 * Wiki 页面初始化入口
	 *
	 * @param basePath - 站点根路径前缀，用于加载 SyntaxHighlighter 脚本
	 * @param title - 页面副标题
	 * @returns {Promise<void>}
	 */
	static async initWikiPage(basePath: string, title: string) {

		let cfg: PageConfig = { apiRoot: "/", pageTitle: "Study Notes", subTitle: title, ajaxTimeout: 500 };
		let page = new WebHtmlPage(cfg);
		page.renderSubTitle();
		//
		page.renderTopNav(SITE_NAV_ITEMS);

		//
		DataTableHelper.bindInitDataTable();

		//
		page.bindImageNewTab("img.img-newwin");

		//
		BootStrapHelper.initPhotoFrame("photo-frame");
		//
		BootStrapHelper.bindImageFrame("img.img-frame");
		//
		SyntaxHighlighterHelper.loadCodeHightlight(basePath, "../../vimwiki-theme/3rd/SyntaxHighlighter/2.1.364/scripts");
		//
		MathJaxHelper.initMathJax();
		//
		let tocOri = document.querySelector<HTMLElement>("div.toc");
		if (null != tocOri) {
			WebHtmlPage.prepareTocIndex(tocOri.innerHTML, "div.sideTocIdx" );
			tocOri.remove();
		}
		//
		WebHtmlPage.bindOnClick('#tocLevBtn' ,  () => {page.toggleSideTocContract("div.sideTocIdx")});
		WebHtmlPage.bindOnClick('#tocLevBtn2',  () => {page.toggleSideTocContract("div.sideTocIdx")});
		WebHtmlPage.bindOnClick('#tocBoxBtn' ,  () => {page.toggleSideTocWrap    ("div.sideTocIdx", 90, "div.sideToc")});
		WebHtmlPage.bindOnClick('#tocBoxBtn2',  () => {page.toggleSideTocWrap    ("div.sideTocIdx", 80, "div.sideToc")});

		let changeTocWithWindow = () => {
			page.changeTocPanelSize("div#sideTocIdxTree" , 80);
			page.changeTocPanelSize("div#floatTocIdxTree", 90);
		};

		window.addEventListener('resize', changeTocWithWindow);

		page.initUITheme();
		page.bindChangeTheme(SITE_THEMES);

		// 调整一下目录列表的大小
		changeTocWithWindow();
	}

}
