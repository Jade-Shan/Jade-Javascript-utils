import { PageConfig, SiteConfig, WebHtmlPage } from '../ui/webHtmlPage.js';

import { SyntaxHighlighterHelper, MathJaxHelper, BootStrapHelper, DataTableHelper } from '../3rdLibTool.js';

import { WebUtil } from '../web.js';

import { JADE_DUNGEON_SITE } from '../site.config.js';

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
	 * @param site - 站点配置（品牌名、导航树、主题列表），默认本站的 `JADE_DUNGEON_SITE`。
	 *               调用方在另一个 vimwiki 项目里，所以这个形参放在末尾、带默认值，
	 *               那边不改调用也能继续跑
	 * @returns {Promise<void>}
	 */
	static async initWikiPage(basePath: string, title: string,
		site: SiteConfig = JADE_DUNGEON_SITE) //
	{

		// 注册 `esp-unicode` 标签，页面里已有的该标签会在注册时被 upgrade
		WebUtil.initCustomElements();

		let cfg: PageConfig = { apiRoot: "/", pageTitle: "Study Notes", subTitle: title, ajaxTimeout: 500 };
		let page = new WebHtmlPage(cfg);
		page.renderSubTitle();
		// 页面是 Bootstrap 3 的，所以显式传 BS3 的导航栏模板
		page.renderTopNav(site, "#topnav", BootStrapHelper.renderTopNav);

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
		page.bindChangeTheme(site.themes);

		// 调整一下目录列表的大小
		changeTocWithWindow();
	}

}
