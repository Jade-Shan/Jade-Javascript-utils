
declare namespace SyntaxHighlighter {
	function all(): void;
	namespace autoloader {
		function apply(arg1: any, arg2: any): any;
	}
}

export class SyntaxHighlighterHelper {

	/**
	 * 各语言高亮脚本的路径
	 * 
	 * @param hlRootPath 
	 * @param hlCodePath 
	 */
	static loadCodeHightlight(hlRootPath?: string, hlCodePath?: string) {
		hlRootPath = hlRootPath ? hlRootPath : "";
		hlCodePath = hlCodePath ? hlCodePath : "../../vimwiki-theme/3rd/SyntaxHighlighter/2.1.364/scripts/";
		let basePath = `${hlRootPath}${hlCodePath}/`;
		let parsePath = (arr: Array<string>): Array<string> => {
			let lines: Array<string> = [];
			for (let i = 0; i < arr.length; i++) {
				let arg = arr[i];
				let line = arg.replace('@', basePath);
				lines.push(line);
			}
			return lines;
		};
		let pathArr = parsePath([
			'applescript            @shBrushAppleScript.js',
			'actionscript3 as3      @shBrushAS3.js',
			'bash shell             @shBrushBash.js',
			'coldfusion cf          @shBrushColdFusion.js',
			'cpp c                  @shBrushCpp.js',
			'c# c-sharp csharp      @shBrushCSharp.js',
			'css                    @shBrushCss.js',
			'delphi pascal          @shBrushDelphi.js',
			'diff patch pas         @shBrushDiff.js',
			'erl erlang             @shBrushErlang.js',
			'groovy                 @shBrushGroovy.js',
			'java                   @shBrushJava.js',
			'jfx javafx             @shBrushJavaFX.js',
			'js jscript javascript  @shBrushJScript.js',
			'perl pl                @shBrushPerl.js',
			'php                    @shBrushPhp.js',
			'text plain             @shBrushPlain.js',
			'py python              @shBrushPython.js',
			'ruby rails ror rb      @shBrushRuby.js',
			'sass scss              @shBrushSass.js',
			'latex                  @shBrushLatex.js',
			'less                   @shBrushLess.js',
			'scala                  @shBrushScala.js',
			'scheme                 @shBrushScheme.js',
			'clojure                @shBrushClojure.js',
			'sql                    @shBrushSql.js',
			'vb vbnet               @shBrushVb.js',
			'xml xhtml xslt html    @shBrushXml.js'])
		SyntaxHighlighter.autoloader.apply(null, pathArr);
		SyntaxHighlighter.all();
	};

}
declare class MathJaxNode {
	parentNode: MathJaxNode;
	className: string;
}
declare class MathJaxRec {
	SourceElement(): MathJaxNode;
}

declare namespace MathJax {
	namespace Hub {
		function Config(cofig: any): void;
		function Queue(func: () => void): void;
		function getAllJax(): Array<MathJaxRec>;
	}
}

export class MathJaxHelper {

	private static defalutMathJaxCfg = {
		TeX: { equationNumbers: { autoNumber: ["AMS"], useLabelIds: true }, extensions: ["color.js", "enclose.js"] },
		extensions: ["tex2jax.js", "TeX/AMSmath.js", "TeX/AMSsymbols.js"],
		tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']], skipTags: ['script', 'noscript', 'style', 'textarea', 'code', 'pre'] },
		"HTML-CSS": {
			// fonts: ["Latin-Modern"],
			availableFonts: ["TeX"],
			linebreaks: { automatic: false }
		},
		SVG: { linebreaks: { automatic: false } }
	};

	// Fix <code> tags after MathJax finishes running. This is a
	// hack to overcome a shortcoming of Markdown. Discussion at
	// https://github.com/mojombo/jekyll/issues/199
	private static defaultQueue() {
		let all = MathJax.Hub.getAllJax();
		for (let i = 0; i < all.length; i += 1) {
			if (all[i].SourceElement().parentNode.className.indexOf('has-jax') == -1) {
				all[i].SourceElement().parentNode.className += ' has-jax';
			}
			if (all[i].SourceElement().parentNode.className.indexOf('no-highlight') == -1) {
				all[i].SourceElement().parentNode.className += ' no-highlight';
			}
		}
	}

	static initMathJax(config?: any, queueFunc?: () => void) {
		MathJax.Hub.Config(config ? config : MathJaxHelper.defalutMathJaxCfg);
		MathJax.Hub.Queue(queueFunc ? queueFunc : MathJaxHelper.defaultQueue);
	}

}

// import jQuery from '@types/jquery'
// import $ from 'jquery';
// declare type $ = any;
declare function $(cc: any): any;

export class BootStrapHelper {

	/**
	 * 必须要在页面上加上：
	 * `<div id="photo-frame" class="modal fade photo-frame" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"></div>`
	 * 因为bootstrap的导入在是最前面。如果bootstrap.js已经导入了，再添加`div`就没有用了。
	 * 
	 * @param photoFrameId 
	 */
	static initPhotoFrame(photoFrameId?: string): void {
		let photoElem = document.querySelector(`#${photoFrameId ? photoFrameId : "photo-frame"}`);
		if (photoElem) {
			photoElem.innerHTML = `
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h4 class="modal-title" id="${photoFrameId}-label"></h4>
						</div>
						<div class="modal-body row">
							<img id="${photoFrameId}-img" alt="" src="" class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
						</div>
					</div>
				</div>`;
		}
	};

	/**
	 * 依赖bootstrap与JQuery 
	 * 
	 * @param elemSlt 
	 */
	static viewPic(title: string, url: string, photoFrameId?: string): void {
		photoFrameId = photoFrameId ? photoFrameId : "photo-frame";
		let photoLabel = document.querySelector(`#${photoFrameId}-label`);
		if (photoLabel) {
			photoLabel.innerHTML = title;
		}
		let photoImg: HTMLImageElement | null = document.querySelector(`#${photoFrameId}-img`);
		if (photoImg) {
			photoImg.src = url;
			photoImg.alt = title;
		}
		($(`#${photoFrameId}`) as any).modal('show');
	};

	/**
	 * 
	 * @param elemSlt 
	 */
	static bindImageFrame(elemSlt?: string, photoFrameId?: string): void {
		let elemArr = document.querySelectorAll<HTMLImageElement>(elemSlt = elemSlt ? elemSlt : 'img.atc-img');
		elemArr.forEach((photoImg: HTMLImageElement, key: number, parent: NodeListOf<HTMLImageElement>) => {
			if (photoImg) {
				photoImg.onclick = (ev: MouseEvent): any => {
					BootStrapHelper.viewPic(photoImg.alt, photoImg.src, photoFrameId);
				};
			}
		});
	}

}


export class DataTableHelper {

	/**
	 * 
	 * @param elemSlt 
	 */
	static bindInitDataTable(elemSlt?: string): void {
		$(elemSlt ? elemSlt : 'div.content>table').each((n: any, t: any) => {
			let table = $(t);
			let thead = table.find('thead');
			if (thead.size() < 1) {
				thead = $('<thead></thead>');
				let rows = table.find('tbody>tr');
				rows.each((ln: any, r: any) => {
					let row = $(r); let th = row.find("th");
					if (th.size() > 0) { thead.append(row); }
				});
				if (thead.find('th').size() > 0) { // 要有表头才能加上DataTable
					table.append(thead);
					let rowCount = rows.size() as number;
					if (rowCount > 20) {  // 20行不到的表就不加DataTable了
						try {
							let info = false; let paging = false; let searching = false;
							if (rowCount > 30) { // 大于30行的表要加上搜索和分页
								info = true;
								paging = true;
								searching = true;
							}
							table.DataTable({ info: info, paging: paging, searching: searching });
						} catch (e) { console.error(e); }
					}
				}
			}
		});
	}

}

// showdown.js
declare namespace showdown {

	class Converter {
		makeHtml(markdownStr: string): string;
	}

}

let showdownConveter: any | null = null; // new showdown.Converter();
export class ShowdownUtils {

	static makeHtml(markdown: string): string {
		showdownConveter = showdownConveter != null ? showdownConveter : new showdown.Converter();
		return showdownConveter.makeHtml(markdown);
	}
}
