import { StrUtil } from './basic.js';
import { PageConfig, WebHtmlPage, SITE_NAV_ITEMS, SITE_THEMES } from './webHtmlPage.js';
import { ShowdownUtils, BootStrapHelper } from './3rdLibTool.js';
import { WebUtil, HttpResponse } from "./web.js"
import { SimpleMap } from './dataStructure.js'


interface UserInfoResp {
	status: string;
	user: {
		userName: string;
		avatar: string;
		desc: string;
		joinTime: string;
		group: string;
		homePageUrl: string;
	}
};

interface RecommendArticle {
	title: string;
	thumbnail: string;
	link: string;
};

interface RecommendArticlesResp {
	status: string;
	recommands: Array<RecommendArticle>;
};

interface UserArticle {
	time: number;
	auth: string;
	title: string;
	text: string;
};

interface UserArticlesResp {
	status: string;
	page: number;
	pageCount: number;
	articles: Array<UserArticle>;
};

export class BlogPage {

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

	static async loadRecommendArticles (apiRoot: string) {
		let recoms: HttpResponse<RecommendArticlesResp> = await WebUtil.requestHttp<string, RecommendArticlesResp>({
			method: "GET", url: `${apiRoot}api/blog/loadRecommandArticles`
		}, {
			onLoad: (evt, xhr, req) => {
				let recommends = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return { statusCode: xhr.status, statusMsg: xhr.statusText, body: recommends };
			},
		});
		let recommends: RecommendArticlesResp = recoms.body ? recoms.body : {
			status: "success", recommands: []
		};
		let html = "";
		for (const t of recommends.recommands) {
			html += `
				<li><div class="img-text-itm"><div class="item-thumbnail">
					<a href="${StrUtil.escapeHtml(t.link)}" target="_blank"><img class="img-hov" alt="" src="${StrUtil.escapeHtml(t.thumbnail)}" border="0"></a></div><div class="item-title">
					<a href="${StrUtil.escapeHtml(t.link)}">${StrUtil.escapeHtml(t.title)}</a></div></div><div style="clear: both;">
				</div></li>`;
		}
		let tk = document.querySelector("#widget-recommends-articles");
		if (tk) tk.innerHTML = html;
	}

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
    		</div>
			<div class="divider"><span></span></div>`;
		return html;
	}

	static async loadUserArticles (apiRoot: string, userId: string, currPage: number) {
		let headers: SimpleMap<string, string> = new SimpleMap([["Accept","application/json, text/javascript, */*; q=0.01"]]);
		let list: HttpResponse<UserArticlesResp> = await WebUtil.requestHttp<string, UserArticlesResp>({
			method: "GET", url: `${apiRoot}api/blog/loadByUser?userId=${encodeURIComponent(userId)}&page=${currPage}`,
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
			html += this.renderArticle(t);
		}
		let tk = document.querySelector("#articles");
		if (tk) tk.innerHTML = html;

		// 服务端返回的pageCount是总页数不准确，所以需要+1。正在催促后端修改。等他们修好了，就可以去掉+1了。
		let pagging = WebHtmlPage.renderPaging(articles.page, articles.pageCount + 1, n => {this.loadUserArticles(apiRoot, userId, n);});
		tk?.appendChild(pagging);

		let br = document.createElement("br");
		tk?.appendChild(br);
	}

	static async initWikiPage(basePath: string, title: string, userId: string = "teo") {

		let apiRoot = "//www.jade-dungeon.cn:8088/";
		let cfg: PageConfig = { apiRoot: apiRoot, pageTitle: "Diary", subTitle: title, ajaxTimeout: 500 };
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

		let currPage = 1;

		try {
			await Promise.all([
				BlogPage.loadUserInfo(apiRoot, userId),
				BlogPage.loadRecommendArticles(apiRoot),
				BlogPage.loadUserArticles(apiRoot, userId, currPage),
			]);
		} catch (e) {
			console.error("Blog page init failed:", e);
		}

	}

}
