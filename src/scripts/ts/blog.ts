import { PageConfig, WebHtmlPage } from './webHtmlPage.js';
import { ShowdownUtils, BootStrapHelper } from './3rdLibTool.js';
import { WebUtil, HttpResponse } from "./web.js"


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

interface RecommandArticle {
	title: string;
	thumbnail: string;
	link: string;
};

interface RecommandArticlesResp {
	status: string;
	recommands: Array<RecommandArticle>;
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

	static async loadUserInfo(userId: string) {
		let userInfoResp: HttpResponse<UserInfoResp> = await WebUtil.requestHttp<string, UserInfoResp>({
			method: "GET", url: `http://www.jade-dungeon.cn:8088/api/blog/loadUserById?userId=${userId}`
		}, {
			onLoad: (evt, xhr, req) => {
				// console.log(xhr.response);
				let userInfo = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return {statusCode: xhr.status, statusMsg: xhr.statusText, body: userInfo};
			},	
		});
		console.log(userInfoResp);
		let userInfo: UserInfoResp = userInfoResp.body ? userInfoResp.body : {
			status: "success",
			user: {
				userName: "Guest",
				avatar: "http://47.102.120.187:8081/jadeutils.v2/themes/hobbit/images/atc-01.jpg",
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

		if (t1) t1.innerHTML = userInfo.user.userName   ;
		if (t2) t2.alt       = userInfo.user.userName   ;
		if (t2) t2.src       = userInfo.user.avatar     ;
		if (t3) t3.innerHTML = userInfo.user.desc       ;
		if (t4) t4.innerHTML = userInfo.user.joinTime   ;
		if (t5) t5.innerHTML = userInfo.user.group      ;
		if (t6) t6.href      = userInfo.user.homePageUrl;
	}

	static async loadRecommandArticles () {
		let recoms: HttpResponse<RecommandArticlesResp> = await WebUtil.requestHttp<string, RecommandArticlesResp>({
			method: "GET", url: "http://www.jade-dungeon.cn:8088/api/blog/loadRecommandArticles"
		}, {
			onLoad: (evt, xhr, req) => {
				// console.log(xhr.response);
				let recommands = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return { statusCode: xhr.status, statusMsg: xhr.statusText, body: recommands };
			},
		});
		console.log(recoms);
		let recommands: RecommandArticlesResp = recoms.body ? recoms.body : {
			status: "success", recommands: []
		};
		let html = "";
		for (let i = 0; i < recommands.recommands.length; i++) {
			let t = recommands.recommands[i];
			html = html + `
				<li><div class="img-text-itm"><div class="item-thumbnail">
					<a href="${t.link}" target="_blank"><img class="img-hov" alt="" src="${t.thumbnail}" border="0"></a></div><div class="item-title">
					<a href="${t.link}">${t.title}</a></div></div><div style="clear: both;">
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
				<div class="title">${atc.title}</div>
      			<div class="metadata metadata-time">${date.toLocaleString()}</div>
				<div class="metadata metadata-auth"> by ${atc.auth}</div>
     			<div class="body">${st}</div>
    		</div>
			<div class="divider"><span></span></div>`;
		return html;
	}

	static async loadUserArticles (userId: string, currPage: number) {
		let list: HttpResponse<UserArticlesResp> = await WebUtil.requestHttp<string, UserArticlesResp>({
			method: "GET", url: `http://www.jade-dungeon.cn:8088/api/blog/loadByUser?userId=${userId}&page=${currPage}`
		}, {
			onLoad: (evt, xhr, req) => {
				// console.log(xhr.response);
				let articles = xhr.responseText ? JSON.parse(xhr.responseText) : null;
				return {statusCode: xhr.status, statusMsg: xhr.statusText, body: articles};
			},	
		});
		console.log(list);

		let articles: UserArticlesResp = list.body ? list.body : {
			status: "success", page: 1, pageCount: 1, articles: []
		};

		let html = `
			<div class="spacer"></div>`;
		for (let i = 0; i < articles.articles.length; i++) {
			let t = articles.articles[i];
			html = html + this.renderArticle(t);
		}
		// this.renderPagination(articles.page, articles.pageCount, 'BlogPage.loadPage');
		let tk = document.querySelector("#articles");
		//  html = html + WebHtmlPage.renderPagination( 1, 20, n => `javascript:queryBlog(${n})`)
		//  html = html + WebHtmlPage.renderPagination( 7, 20, n => `javascript:queryBlog(${n})`)
		//  html = html + WebHtmlPage.renderPagination( 8, 20, n => `javascript:queryBlog(${n})`)
		//  html = html + WebHtmlPage.renderPagination(13, 20, n => `javascript:queryBlog(${n})`)
		//  html = html + WebHtmlPage.renderPagination(14, 20, n => `javascript:queryBlog(${n})`)
		//  html = html + WebHtmlPage.renderPagination(20, 20, n => `javascript:queryBlog(${n})`)
		if (tk) tk.innerHTML = html;

		let pagging = WebHtmlPage.renderPaging(articles.page, articles.pageCount);
		tk?.appendChild(pagging);

		let br = document.createElement("br");
		pagging = WebHtmlPage.renderPaging( 1, 20); tk?.appendChild(pagging);tk?.appendChild(br);
		pagging = WebHtmlPage.renderPaging( 7, 20); tk?.appendChild(pagging);tk?.appendChild(br);
		pagging = WebHtmlPage.renderPaging( 8, 20); tk?.appendChild(pagging);tk?.appendChild(br);
		pagging = WebHtmlPage.renderPaging(13, 20); tk?.appendChild(pagging);tk?.appendChild(br);
		pagging = WebHtmlPage.renderPaging(14, 20); tk?.appendChild(pagging);tk?.appendChild(br);
		pagging = WebHtmlPage.renderPaging(20, 20); tk?.appendChild(pagging);tk?.appendChild(br);
	}

	static async initWikiPage(basePath: string, title: string) {


		let cfg: PageConfig = { apiRoot: "/", pageTitle: "Diary", subTitle: title, ajaxTimeout: 500 };
		let page = new WebHtmlPage(cfg);
		page.renderSubTitle(cfg);
		//
		page.renderTopNav(cfg, [
			{ title: "Journal", link: "/" },
			{ title: "Gallery", link: "/gallery.html" },
			{ title: "Note", link: "//118.178.197.156/study/study/wiki_html" },
			{
				title: "About Me", subs: [
					{ title: "Github", link: "//github.com/Jade-Shan/", isNewWin: true },
					{ title: "", link: "" },
					{ title: "Resume", link: "/resume.html" }]
			},
			{
				title: "Themes", subs: [
					{ title: "hobbit", id: "switch-theme-hobbit"     , link: "#" },
					{ title: "lo-fi" , id: "switch-theme-lo-fi"      , link: "#" },
					{ title: "paper" , id: "switch-theme-paper-print", link: "#" }]
			}
		]);

		// 
		BootStrapHelper.initPhotoFrame("photo-frame");
		//
		BootStrapHelper.bindImageFrame("img.img-frame");
		//

		page.initUITheme();
		let themes = [
			{ elemSlt: "#switch-theme-hobbit"     , themeName: "hobbit"      },
			{ elemSlt: "#switch-theme-lo-fi"      , themeName: "lo-fi"       },
			{ elemSlt: "#switch-theme-paper-print", themeName: "paper-print" },
		]
		page.bindChangeTheme(themes);

		let userId = "teo";
		let currPage = 1;

		// 
		await BlogPage.loadUserInfo(userId);

		//
		await BlogPage.loadRecommandArticles();

		//
		await BlogPage.loadUserArticles(userId, currPage);

	}

}
