import { StrUtil } from '../basic.js';
import { WebUtil, HttpResponse } from "../web.js"
import { normalizeApiRoot, BlogCommon } from './common.js';


/**
 * 推荐文章
 */
interface RecommendArticle {
	/** 文章标题 */
	title: string;
	/** 缩略图 URL */
	thumbnail: string;
	/** 文章链接 */
	link: string;
};

/**
 * 推荐文章列表接口响应
 */
interface RecommendArticlesResp {
	/** 响应状态 */
	status: string;
	/** 推荐文章列表（字段名与后端 API 保持一致） */
	recommands: Array<RecommendArticle>;
};

/**
 * 博客页面
 *
 * 组织博客页面的完整初始化流程，包括用户信息加载、推荐文章列表、
 * 文章分页列表以及主题切换。用户信息、文章渲染和分页列表的公共逻辑
 * 在 `BlogCommon` 中。
 */
export class BlogPage {

	/**
	 * 加载推荐文章列表并渲染到侧栏 Widget
	 *
	 * @param apiRoot - API 根路径
	 * @returns {Promise<void>}
	 */
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

	/**
	 * 加载用户文章列表（分页）并渲染
	 *
	 * @param apiRoot - API 根路径
	 * @param userId - 用户 ID
	 * @param currPage - 当前页码
	 * @returns {Promise<void>}
	 */
	static async loadUserArticles (apiRoot: string, userId: string, currPage: number) {
		await BlogCommon.loadArticleList(
			page => `${apiRoot}api/blog/loadByUser?userId=${encodeURIComponent(userId)}&page=${page}`,
			currPage);
	}

	/**
	 * 博客页面初始化入口
	 *
	 * @param basePath - 后端 API 根路径。由页面从 `envs.js` 的 `apiRoot` 传入，
	 *                   空值退化为同源根路径 `/`
	 * @param title - 页面副标题
	 * @param userId - 用户 ID，默认为 "teo"
	 * @returns {Promise<void>}
	 */
	static async initBlogPage(basePath: string, title: string, userId: string = "teo", currPage = 1) {

		let apiRoot = normalizeApiRoot(basePath);
		BlogCommon.initPageFrame(apiRoot, title, "Journal");

		try {
			await Promise.all([
				BlogCommon.loadUserInfo(apiRoot, userId),
				BlogPage.loadRecommendArticles(apiRoot),
				BlogPage.loadUserArticles(apiRoot, userId, currPage),
			]);
		} catch (e) {
			console.error("Blog page init failed:", e);
		}

	}

}
