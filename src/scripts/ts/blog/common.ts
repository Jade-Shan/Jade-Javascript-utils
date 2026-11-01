import { StrUtil } from '../basic.js';
import { PageConfig, WebHtmlPage, SITE_NAV_ITEMS, SITE_THEMES } from '../ui/webHtmlPage.js';
import { ShowdownUtils, BootStrapHelper } from '../3rdLibTool.js';
import { WebUtil, HttpResponse } from "../web.js"
import { SimpleMap } from '../dataStructure.js'


/**
 * 规整 API 根路径，保证以 `/` 结尾
 *
 * 调用处用 `${apiRoot}api/blog/xxx` 拼接，所以根路径必须带尾斜杠。
 * 而 `envs.js` 里的 `apiRoot` 是不带的（如 `//localhost:8082`），在此补上。
 *
 * @param apiRoot - 调用方传入的根路径，空值退化为同源根路径 `/`
 * @returns {string} 以 `/` 结尾的根路径
 */
export function normalizeApiRoot(apiRoot: string): string {
	if (!apiRoot || apiRoot.length < 1) { return "/"; }
	return apiRoot.endsWith("/") ? apiRoot : apiRoot + "/";
}


/** 相册缩略图的占位图（懒加载前显示） */
const imgPlaceHolder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAeXUlEQVR4Xu3dC4scxdcH4P7HEEKMRokRReL9FkRE/P7fQBER8RYTjYgSFdQYEW/vSw3MZrbSM909c05c9zwLEkhmTnU9dWR/VNf0/O/dd9/9v8EPAQIECBAgQIBAmMD/BKwwS4UIECBAgAABAisBAUsjECBAgA" + 
	"ABAgSCBQSsYFDlCBAgQIAAAQIClh4gQIAAAQIECAQLCFjBoMoRIECAAAECBAQsPUCAAAECBAgQCBYQsIJBlSNAgAABAgQICFh6gAABAgQIECAQLCBgBYMqR4AAAQIECBAQsPQAAQIECBAgQCBYQMAKBlWOAAECBAgQICBg6QECBAgQIECAQLCAgBUMqhwBAgQIECBAQMDSAwQIECBAgACBYAEBKxhUOQIECBAgQICAgKUHCBAgQIAAAQ" + 
	"LBAgJWMKhyBAgQIECAAAEBSw8QIECAAAECBIIFBKxgUOUIECBAgAABAgKWHiBAgAABAgQIBAsIWMGgyhEgQIAAAQIEBCw9QIAAAQIECBAIFhCwgkGVI0CAAAECBAgIWHqAAAECBAgQIBAsIGAFgypHgAABAgQIEBCw9AABAgQIECBAIFhAwAoGVY4AAQIECBAgIGDpAQIECBAgQIBAsICAFQyqHAECBAgQIEBAwNIDBAgQIECAAIFgAQ" + 
	"ErGFQ5AgQIECBAgICApQcIECBAgAABAsECAlYwqHIECBAgQIAAAQFLDxAgQIAAAQIEggUErGBQ5QgQIECAAAECApYeIECAAAECBAgECwhYwaDKESBAgAABAgQELD1AgAABAgQIEAgWELCCQZUjQIAAAQIECAhYeoAAAQIECBAgECwgYAWDKkeAAAECBAgQELD0AAECBAgQIEAgWEDACgZVjgABAgQIECAgYOkBAgQIECBAgECwgIAVDK" + 
	"ocAQIECBAgQEDA0gMECBAgQIAAgWABASsYVDkCBAgQIECAgIClBwgQIECAAAECwQICVjCocgQIECBAgAABAUsPECBAgAABAgSCBQSsYFDlCBAgQIAAAQIClh4gQIAAAQIECAQLCFjBoMoRIECAAAECBAQsPUCAAAECBAgQCBYQsIJBlSNAgAABAgQICFh6gAABAgQIECAQLCBgBYMqR4AAAQIECBAQsPQAAQIECBAgQCBYQMAKBlWOAA" + 
	"ECBAgQICBg6QECBAgQIECAQLCAgBUMqhwBAgQIECBAQMDSAwQIECBAgACBYAEBKxhUOQIECBAgQICAgKUHCBAgQIAAAQLBAgJWMKhyBAgQIECAAAEBSw8QIECAAAECBIIFBKxgUOUIECBAgAABAgKWHiBAgAABAgQIBAsIWMGgyhEgQIAAAQIEBCw9QIAAAQIECBAIFhCwgkGVI0CAAAECBAgIWHqAAAECBAgQIBAsIGAFgypHgAABAg" + 
	"QIEBCw9AABAgQIECBAIFhAwAoGVY4AAQIECBAgIGDpAQIECBAgQIBAsICAFQyqHAECBAgQIEBAwNIDBAgQIECAAIFgAQErGFQ5AgQIECBAgICApQcIECBAgAABAsECAlYwqHIECBAgQIAAAQFLDxAgQIAAAQIEggUErGBQ5QgQIECAAAECApYeIECAAAECBAgECwhYwaDKESBAgAABAgQELD1AgAABAgQIEAgWELCCQZUjQIAAAQIECA" + 
	"hYeoAAAQIECBAgECwgYAWDKkeAAAECBAgQELD0AAECBAgQIEAgWEDACgZVjgABAgQIECAgYOkBAgQIECBAgECwgIAVDKocAQIECBAgQEDA0gMECBAgQIAAgWABASsYVDkCBAgQIECAgIClBwgQIECAAAECwQICVjCocgQIECBAgAABAUsPECBAgAABAgSCBQSsYFDlCBAgQIAAAQIClh4gQIAAAQIECAQLCFjBoMoRIECAAAECBAQsPU" + 
	"CAAAECBAgQCBYQsIJBlSNAgAABAgQICFh6gAABAgQIECAQLCBgBYMqR4AAAQIECBAQsPQAAQIECBAgQCBYQMAKBlWOAAECBAgQICBg6QECBAgQIECAQLCAgBUMqhwBAgQIECBAQMDSAwQIECBAgACBYAEBKxhUOQIECBAgQICAgKUHCBAgQIAAAQLBAgJWMKhyBAgQIECAAAEBSw8QIECAAAECBIIFBKxgUOUIECBAgAABAgKWHiBAgA" + 
	"ABAgQIBAsIWMGgyhEgQIAAAQIEBCw9QIAAAQIECBAIFhCwgkGVI0CAAAECBAgIWHqAAAECBAgQIBAsIGAFgypHgAABAgQIEBCw9AABAgQIECBAIFhAwAoGVY4AAQIECBAgIGDpAQIECBAgQIBAsICAFQyqHAECBAgQIEBAwNIDBAgQIECAAIFgAQErGFQ5AgQIECBAgICApQcIECBAgAABAsECAlYwqHIECBAgQIAAAQFLDxAgQIAAAQ" + 
	"IEggUErGBQ5QgQIECAAAECApYeIECAAAECBAgECwhYwaDKESBAgAABAgQELD1AgAABAgQIEAgWELCCQZUjQIAAAQIECAhYeoAAAQIECBAgECwgYAWDKkeAAAECBAgQELD0AAECBAgQIEAgWEDACgZVjgABAgQIECAgYOkBAgQIECBAgECwgIAVDKocAQIECBAgQEDA0gMECBAgQIAAgWABASsYVDkCBAgQIECAgIClBwgQIECAAAECwQ" + 
	"ICVjCocgQIECBAgAABAUsPECBAgAABAgSCBQSsYFDlCBAgQIAAAQIClh4gQIAAAQIECAQLCFjBoMoRIECAAAECBAQsPUCAAAECBAgQCBYQsIJBlSNAgAABAgQICFh6gAABAgQIECAQLCBgBYMqR4AAAQIECBAQsPQAAQIECBAgQCBYQMAKBlWOAAECBAgQICBg6QECBAgQIECAQLCAgBUMqhwBAgQIECBAQMDSAwQIECBAgACBYAEBKx" + 
	"hUOQIECBAgQICAgKUHCBAgQIAAAQLBAgJWMKhyBAgQIECAAAEBSw8QIECAAAECBIIFBKxgUOUIECBAgAABAgKWHiBAgAABAgQIBAsIWMGgyhEgQIAAAQIEBCw9QIAAAQIECBAIFhCwgkGVI0CAAAECBAgIWHqAAAECBAgQIBAsIGAFgypHgAABAgQIEBCw9AABAgQIECBAIFhAwAoGVY4AAQIECBAgIGDpAQIECBAgQIBAsICAFQyqHA" + 
	"ECBAgQIEBAwNIDBAgQIECAAIFgAQErGFQ5AgQIECBAgICApQcIECBAgAABAsECAlYwqHIECBAgQIAAAQFLDxAgQIAAAQIEggUErGBQ5QgQIECAAAECApYeIECAAAECBAgECwhYwaDKERgTeOqpp4ZLly4N586dW/23+fP7778Pf/311/Drr78O33zzzWzAZ599dnj44YdX9c6ePbt63z///DP88ccfw927d4fvv/9+9ec+P4899thw5c" + 
	"qVVe3z588flWi1238///zz8N133+1T+tS8pxm99NJLx+bT1m+pS7Z1Zp+cmsU0EQIJAgJWAqqSBNYCLVitg8qUSgtaH3300dTLhieeeGJ45plnjkLVtje0sHX79u1Foa3VeuWVV4ZHH3108jp+++234datW3uHuMkBTvgLXnvtteHixYsHBaxM6+w+OeHL4/II/OsCAta/vgQu4LQKPP/888Ply5dnT29OwGrB6sknnxzOnDkzu27byW" + 
	"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";


/**
 * 用户信息接口响应
 */
export interface UserInfoResp {
	status: string;
	/** 用户信息 */
	user: {
		/** 用户名 */
		userName: string;
		/** 头像 URL */
		avatar: string;
		/** 个人描述 */
		desc: string;
		/** 加入时间 */
		joinTime: string;
		/** 用户组 */
		group: string;
		/** 个人主页 URL */
		homePageUrl: string;
	}
};

/**
 * 相册图片
 */
export interface PictureRec {
	id: number;
	title: string;
	desc: string;
	url: string;
}

/**
 * 用户文章
 */
export interface UserArticle {
	/** 发布时间（时间戳） */
	time: number;
	/** 作者 */
	auth: string;
	/** 文章标题 */
	title: string;
	/** 文章正文（Markdown） */
	text: string;
	ablum?: Array<PictureRec>;
};

/**
 * 用户文章列表接口响应
 */
export interface UserArticlesResp {
	/** 响应状态 */
	status: string;
	/** 当前页码 */
	page: number;
	/** 总页数（注：后端返回值比实际少 1，参见 CLAUDE.md 待跟进问题） */
	pageCount: number;
	/** 文章列表 */
	articles: Array<UserArticle>;
};

/**
 * 博客类页面的公共逻辑
 *
 * 博客（blog.ts）和相册（gallery.ts）共用的用户信息加载、文章渲染、
 * 分页列表加载和页面框架初始化。
 */
export class BlogCommon {

	/**
	 * 相册缩略图的懒加载监听器
	 *
	 * 翻页会用 innerHTML 换掉整个列表，旧监听器必须先 disconnect()，
	 * 否则会一直持有已经被移除的 img 元素
	 */
	private static lazyImgObserver: IntersectionObserver | null = null;

	/**
	 * 加载用户信息并渲染到侧栏 Widget
	 *
	 * @param apiRoot - API 根路径
	 * @param userId - 用户 ID
	 * @returns {Promise<void>}
	 */
	static async loadUserInfo(apiRoot: string, userId: string) {
		let userInfoResp: HttpResponse<UserInfoResp> = await WebUtil.requestHttp<string, UserInfoResp>({
			method: "GET", url: `${apiRoot}api/blog/loadUserById?userId=${encodeURIComponent(userId)}`
		}, {
			onLoad: (evt, xhr, req) => {
				let userInfo = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return {statusCode: xhr.status, statusMsg: xhr.statusText, body: userInfo};
			},
		});
		let userInfo: UserInfoResp = userInfoResp.body ? userInfoResp.body : {
			status: "success",
			user: {
				userName: "Guest",
				avatar: "",
				desc: "Demo post with formatted elements and comments.",
				joinTime: "2021-03-21",
				group: "Guest",
				homePageUrl: "#"
			}
		};
		let t1 = document.querySelector('#widget-username'   );
		let t2 = document.querySelector<HTMLImageElement>('#widget-avatar'     );
		let t3 = document.querySelector('#widget-user-desc'  );
		let t4 = document.querySelector('#widget-user-joined');
		let t5 = document.querySelector('#widget-user-group' );
		let t6 = document.querySelector<HTMLLinkElement>('#widget-avatar-lnk' );

		if (t1) t1.textContent = userInfo.user.userName;
		if (t2) t2.alt         = userInfo.user.userName;
		if (t2) t2.src         = userInfo.user.avatar;
		if (t3) t3.textContent = userInfo.user.desc;
		if (t4) t4.textContent = userInfo.user.joinTime;
		if (t5) t5.textContent = userInfo.user.group;
		if (t6) t6.href        = userInfo.user.homePageUrl;
	}

	/**
	 * 将文章对象渲染为 HTML
	 *
	 * @param atc - 用户文章
	 * @returns {string} 渲染后的 HTML 字符串
	 */
	static renderArticle(atc: UserArticle) {
		let date = new Date();
		date.setTime(atc.time);
		let st = ShowdownUtils.makeHtml(atc.text);
		let html = `
			<div class="item">
				<div class="title">${StrUtil.escapeHtml(atc.title)}</div>
      			<div class="metadata metadata-time">${StrUtil.escapeHtml(date.toLocaleString())}</div>
				<div class="metadata metadata-auth"> by ${StrUtil.escapeHtml(atc.auth)}</div>
     			<div class="body">${st}</div>
    		</div>`;
		if (atc.ablum && atc.ablum.length > 0) {
			html = html + `
				<div class="row">`;
			for (const pic of atc.ablum) {
				html = html + `
					<div class="col-sm-6 col-md-3">
						<div class="thumbnail">
							<img class="atc-img img-frame" id="${pic.id}" src="${imgPlaceHolder }" data-origin="${StrUtil.escapeHtml(pic.url)}" alt="${StrUtil.escapeHtml(pic.title)}" />
						</div>
						<div class="caption"><p>${StrUtil.escapeHtml(pic.desc)}</p></div>
					</div>`;
			}
			html = html + `
				</div>`;
		}


			html = html + `
			<div class="divider"><span></span></div>`;
		return html;
	}

	/**
	 * 加载文章列表（分页）并渲染到 `#articles`
	 *
	 * 文章列表和相册列表的接口返回结构一致，只有 URL 不同，
	 * 所以用 `urlBuilder` 把 URL 的差异交给调用方。
	 *
	 * @param urlBuilder - 按页码生成请求 URL 的函数
	 * @param currPage - 当前页码
	 * @returns {Promise<void>}
	 */
	static async loadArticleList(urlBuilder: (page: number) => string, currPage: number) {
		let headers: SimpleMap<string, string> = new SimpleMap([["Accept","application/json, text/javascript, */*; q=0.01"]]);
		let list: HttpResponse<UserArticlesResp> = await WebUtil.requestHttp<string, UserArticlesResp>({
			method: "GET", url: urlBuilder(currPage),
			opt: {
				headers: headers
			}
		}, {
			onLoad: (evt, xhr, req) => {
				let articles = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return {statusCode: xhr.status, statusMsg: xhr.statusText, body: articles};
			},
		});

		let articles: UserArticlesResp = list.body ? list.body : {
			status: "success", page: 1, pageCount: 1, articles: []
		};

		let html = `
			<div class="spacer"></div>`;
		for (const t of articles.articles) {
			html += BlogCommon.renderArticle(t);
		}
		let tk = document.querySelector("#articles");
		// 旧列表即将被替换，先停掉上一页图片的懒加载监听
		BlogCommon.lazyImgObserver?.disconnect();
		if (tk) tk.innerHTML = html;

		// 服务端返回的pageCount是总页数不准确，所以需要+1。正在催促后端修改。等他们修好了，就可以去掉+1了。
		let pagging = WebHtmlPage.renderPaging(articles.page, articles.pageCount + 1,
			n => {BlogCommon.loadArticleList(urlBuilder, n);});
		tk?.appendChild(pagging);

		let br = document.createElement("br");
		tk?.appendChild(br);

		// 翻页后内容已替换，把页面滚回顶部，避免停留在上一页的滚动位置
		window.scrollTo({top: 0, behavior: "smooth"});
		//
		BootStrapHelper.initPhotoFrame("photo-frame");
		//
		BootStrapHelper.bindImageFrame("img.img-frame");
		// 滚到可视区域附近才加载缩略图原图，先滚回顶部再绑定，避免按旧滚动位置判断
		BlogCommon.lazyImgObserver = WebUtil.lazyLoadImages("#articles img[data-origin]");
	}

	/**
	 * 初始化页面框架：自定义元素、副标题、导航栏、图片框和主题
	 *
	 * @param apiRoot - API 根路径
	 * @param title - 页面副标题
	 * @param pageTitle - 页面类型标题
	 * @returns {WebHtmlPage} 初始化完成的页面对象
	 */
	static initPageFrame(apiRoot: string, title: string, pageTitle: string = "Diary"): WebHtmlPage {

		// 注册 `esp-unicode` 标签，页面里已有的该标签会在注册时被 upgrade
		WebUtil.initCustomElements();

		let cfg: PageConfig = { apiRoot: apiRoot, pageTitle: pageTitle, subTitle: title, ajaxTimeout: 500 };
		let page = new WebHtmlPage(cfg);
		page.renderSubTitle();
		//
		page.renderTopNav(SITE_NAV_ITEMS);

		//
		BootStrapHelper.initPhotoFrame("photo-frame");
		//
		BootStrapHelper.bindImageFrame("img.img-frame");
		//

		page.initUITheme();
		page.bindChangeTheme(SITE_THEMES);

		return page;
	}

}
