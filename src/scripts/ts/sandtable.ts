import { ColorRGB } from "./basic.js";
import { CanvasCircle2D, CanvasLine2D, CanvasRectangle2D, CanvasShape2D, ICanvas2D, ICanvasCircle2D, ICanvasLine2D, ICanvasRectangle2D, ImageClip } from "./canvas.js";
import { Geo2DUtils, IPoint2D} from "./geo2d.js";
import { ImageProxyConfig, WebUtil } from "./web.js";

/** 可见性类型：default=默认, glimmer=微光, dark=黑暗 */
export type VisibilityType = "default" | "glimmer" | "dark";

/**
 * 观察者（玩家视角）
 */
export interface IObserver {
	/** 观察者位置 */
	c: IPoint2D,
	/** 根据可见性类型返回视野范围 */
	viewRange: (type: VisibilityType) => number
};

/**
 * 图片资源（序列化记录）
 */
export interface ImageResource {
	/** 资源类型 */
	type    : "Image" | "Other",
	/** 资源 ID */
	id      : string,
	/** 图片 URL */
	url     : string,
	/** 缓存的图片元素 */
	imgElem?: HTMLImageElement
}

/**
 * Token 序列化记录（基类）
 */
export interface IToken2DRec {
	/** Token 类型 */
	type     : "Circle" | "Rectangle" | "Line",
	/** Token ID */
	id       : string,
	/** X 坐标 */
	x        : number,
	/** Y 坐标 */
	y        : number,
	/** 是否可见 */
	visible : boolean,
	/** 是否阻挡视野 */
	blockView: boolean,
	/** 颜色 */
	color    : string,
}
/**
 * Token 2D 基础接口
 *
 * 所有沙盘 Token（圆形/矩形/线段）的公共接口。
 */
export interface IToken2D extends CanvasShape2D {
	/** Token ID */
	id       : string,
	/** 颜色 */
	color    : string,
	/** 是否可见 */
	visible : boolean,
	/** 是否阻挡视野 */
	blockView: boolean

	/** 在 Canvas 上绘制 Token */
	draw(cvsCtx: CanvasRenderingContext2D): void;
	/** 将 Token 转为可序列化的记录 */
	toRecord(): IToken2DRec;
}

/**
 * 圆形 Token 序列化记录
 */
export interface ICircleTokenRec extends IToken2DRec {
	/** Token 类型 */
	type  : "Circle",
	/** 半径 */
	radius: number,
	/** 图片裁剪 */
	img   : ImageClip,
}

/** 圆形 Token 接口 */
export interface ICircleToken extends ICanvasCircle2D { color: string, imgClip: ImageClip };
/**
 * 圆形 Token
 *
 * 继承 CanvasCircle2D，实现沙盘 Token 的绘制、序列化与视野阻挡。
 */
export class CircleToken extends CanvasCircle2D implements IToken2D, ICircleToken {
	/** Token ID */
	id       : string = "";
	/** 颜色 */
	color    : string;
	/** 是否可见 */
	visible : boolean = true;
	/** 是否阻挡视野 */
	blockView: boolean = true;
	/** 图片裁剪区域 */
	imgClip  : ImageClip;

	/**
	 * @param id - Token ID
	 * @param x - 圆心 X 坐标
	 * @param y - 圆心 Y 坐标
	 * @param radius - 半径
	 * @param lineWidth - 线宽
	 * @param strokeStyle - 描边颜色
	 * @param fillStyle - 填充颜色
	 * @param visible - 是否可见
	 * @param blockView - 是否阻挡视野
	 * @param color - Token 颜色
	 * @param image - 图片裁剪
	 */
	constructor(id: string, x: number, y: number, radius: number, //
		lineWidth: number, strokeStyle: string, fillStyle: string, //
		visible: boolean, blockView: boolean, color: string, image: ImageClip) //
	{
		super(x, y, radius, lineWidth, strokeStyle, fillStyle);
		this.id = id;
		this.visible = visible;
		this.blockView = blockView;
		this.color = color;
		this.imgClip = image;
	}

	/**
	 * 将圆形 Token 转为可序列化的记录
	 * @returns {ICircleTokenRec}
	 */
	toRecord(): ICircleTokenRec {
		return { "type": "Circle", "id": this.id, "x": this.c.x, "y": this.c.y, "radius": this.radius, //
			"visible": this.visible, "blockView": this.blockView, "color": this.color, "img": this.imgClip };
	}

	/**
	 * 从序列化记录重建圆形 Token
	 * @param rec - 圆形 Token 记录
	 * @param imageRecs - 图片资源列表
	 * @returns {CircleToken}
	 */
	static fromRecord(rec: ICircleTokenRec, imageRecs: Array<ImageResource>): CircleToken {
		const imgClip = { ...rec.img };
		const matched = imageRecs?.find(img => img.id === rec.img.imgKey);
		if (matched?.imgElem) {
			imgClip.imageElem = matched.imgElem;
		}
		let cc = new CircleToken(rec.id, rec.x, rec.y, rec.radius, 0, rec.color, rec.color, //
			rec.visible, rec.blockView, rec.color, imgClip);
		return cc;
	}

	/**
	 * 在 Canvas 上绘制圆形 Token（填充 + 图片裁剪）
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	/**
	 * 在 Canvas 上绘制矩形 Token（填充 + 图片裁剪）
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	draw(cvsCtx: CanvasRenderingContext2D): void {
		cvsCtx.save();
		cvsCtx.lineWidth = 0;
		cvsCtx.strokeStyle = this.color;
		// draw a circle
		cvsCtx.beginPath();
		cvsCtx.arc(this.c.x, this.c.y, this.radius, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.fillStyle = this.color;
		cvsCtx.fill();
		cvsCtx.stroke();
		// clip Image
		cvsCtx.beginPath();
		cvsCtx.arc(this.c.x, this.c.y, this.radius - 3, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.stroke();
		cvsCtx.clip();
		if (this.imgClip && this.imgClip.imageElem) {
			let dx = this.c.x - this.radius;
			let dy = this.c.y - this.radius;
			let dwidth  = this.radius * 2;
			let dheight = dwidth;
			cvsCtx.drawImage(this.imgClip.imageElem, this.imgClip.sx, this.imgClip.sy, 
				this.imgClip.width, this.imgClip.height, dx, dy, dwidth, dheight);
		}
		cvsCtx.restore();
	}

	/**
	 * 绘制 Token 的移动预览（目标位置半透明圆 + 移动轨迹）
	 * @param cvsCtx - Canvas 2D 上下文
	 * @param x - 目标 X 坐标
	 * @param y - 目标 Y 坐标
	 */
	drawNextLocation(cvsCtx: CanvasRenderingContext2D, x: number, y: number): void {
		cvsCtx.save();
		cvsCtx.fillStyle = "rgba(0,0,255,0.5)";
		// draw a circle out
		cvsCtx.beginPath();
		cvsCtx.arc(x, y, this.radius, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.closePath();
		cvsCtx.fill();
		// draw a circle inside 
		cvsCtx.fillStyle = "rgba(255,255,0,0.5)";
		cvsCtx.beginPath();
		cvsCtx.arc(x, y, this.radius - 3, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.closePath();
		cvsCtx.fill();
		//
		cvsCtx.lineWidth = 5;
		cvsCtx.strokeStyle= "rgba(255,0,255,0.5)";
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.c.x, this.c.y);
		cvsCtx.lineTo(x, y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		//
		cvsCtx.lineWidth = 3;
		cvsCtx.strokeStyle= "rgba(0,255,0,0.5)";
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.c.x, this.c.y);
		cvsCtx.lineTo(x, y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		//
		cvsCtx.restore();
	}

}

/**
 * 矩形 Token 序列化记录
 */
export interface IRectangleTokenRec extends IToken2DRec {
	/** Token 类型 */
	type  : "Rectangle",
	/** 宽度 */
	width : number,
	/** 高度 */
	height: number,
	/** 图片裁剪 */
	img   : ImageClip,
};
/** 矩形 Token 接口 */
export interface IRectangleToken extends ICanvasRectangle2D { color: string, imgClip: ImageClip }

/**
 * 矩形 Token
 *
 * 继承 CanvasRectangle2D，实现沙盘 Token 的绘制、序列化与视野阻挡。
 */
export class RectangleToken extends CanvasRectangle2D implements IToken2D, IRectangleToken {
	/** Token ID */
	id       : string = "";
	/** 颜色 */
	color    : string;
	/** 是否可见 */
	visible : boolean = true;
	/** 是否阻挡视野 */
	blockView: boolean = true;
	/** 图片裁剪区域 */
	imgClip  : ImageClip;

	/**
	 * @param id - Token ID
	 * @param x - 左上角 X 坐标
	 * @param y - 左上角 Y 坐标
	 * @param width - 宽度
	 * @param heigh - 高度
	 * @param lineWidth - 线宽
	 * @param strokeStyle - 描边颜色
	 * @param fillStyle - 填充颜色
	 * @param visible - 是否可见
	 * @param blockView - 是否阻挡视野
	 * @param color - Token 颜色
	 * @param image - 图片裁剪
	 */
	constructor(id: string, x: number, y: number, width: number, heigh: number,//
		lineWidth: number, strokeStyle: string, fillStyle: string, //
		visible: boolean, blockView: boolean, color: string, image: ImageClip) //
	{
		super(x, y, width, heigh, lineWidth, strokeStyle, fillStyle);
		this.id        = id;
		this.visible  = visible;
		this.blockView = blockView;
		this.color     = color;
		this.imgClip   = image;
	}

	/**
	 * 从序列化记录重建矩形 Token
	 * @param rec - 矩形 Token 记录
	 * @param imageRecs - 图片资源列表
	 * @returns {RectangleToken}
	 */
	static fromRecord(rec: IRectangleTokenRec, imageRecs: Array<ImageResource>): RectangleToken {
		const imgClip = { ...rec.img };
		const matched = imageRecs?.find(img => img.id === rec.img.imgKey);
		if (matched?.imgElem) {
			imgClip.imageElem = matched.imgElem;
		}
		let rtg = new RectangleToken(rec.id, rec.x, rec.y, rec.width, rec.height, 0, //
			rec.color, rec.color, rec.visible, rec.blockView, rec.color, imgClip);
		return rtg;
	}

	/**
	 * 将矩形 Token 转为可序列化的记录
	 * @returns {IRectangleTokenRec}
	 */
	toRecord(): IRectangleTokenRec {
		return {
			"type": "Rectangle", "id": this.id, "x": this.x, "y": this.y, //
			"width": this.width, "height": this.height, "visible": this.visible, //
			"blockView": this.blockView, "color": this.color, //
			"img": this.imgClip
		};
	}

	draw(cvsCtx: CanvasRenderingContext2D): void {
		cvsCtx.save();
		cvsCtx.lineWidth = 0;
		cvsCtx.beginPath();
		cvsCtx.fillStyle = this.color;
		cvsCtx.fillRect(this.x, this.y, this.width, this.height);
		cvsCtx.fill();
		cvsCtx.beginPath();
		cvsCtx.rect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
		cvsCtx.clip();
		if (this.imgClip && this.imgClip.imageElem) {
			let dx = this.x + 3;
			let dy = this.y + 3;
			let dwidth  = this.width  - 6;
			let dheight = this.height - 6;
			cvsCtx.drawImage(this.imgClip.imageElem, this.imgClip.sx, this.imgClip.sy,
				this.imgClip.width, this.imgClip.height, dx, dy, dwidth, dheight);
		}
		cvsCtx.restore();
	}
}

/**
 * 线段 Token 序列化记录
 */
export interface ILineTokenRec extends IToken2DRec {
	/** Token 类型 */
	type: "Line",
	/** 终点 X 坐标 */
	x2  : number,
	/** 终点 Y 坐标 */
	y2  : number,
}
/** 线段 Token 接口 */
export interface ILineToken extends ICanvasLine2D { color: string }
/**
 * 线段 Token
 *
 * 继承 CanvasLine2D，实现沙盘 Token 的绘制、序列化与视野阻挡。
 */
export class LineToken extends CanvasLine2D implements IToken2D, ILineToken {
	/** Token ID */
	id: string = "";
	/** 颜色 */
	color: string;
	/** 是否可见 */
	visible: boolean = true;
	/** 是否阻挡视野 */
	blockView: boolean = true;

	/**
	 * @param id - Token ID
	 * @param x1 - 起点 X 坐标
	 * @param y1 - 起点 Y 坐标
	 * @param x2 - 终点 X 坐标
	 * @param y2 - 终点 Y 坐标
	 * @param lineWidth - 线宽
	 * @param strokeStyle - 描边颜色
	 * @param color - Token 颜色
	 * @param visible - 是否可见
	 * @param blockView - 是否阻挡视野
	 */
	constructor(id: string, x1: number, y1: number, x2: number, y2: number, // 
		lineWidth: number, strokeStyle: string, color: string, // 
		visible: boolean, blockView: boolean ) // 
	{
		super({x: x1, y: y1}, {x: x2, y: y2}, lineWidth, strokeStyle);
		this.id        = id;
		this.color     = color;
		this.visible  = visible;
		this.blockView = blockView;
	}

	/**
	 * 从序列化记录重建线段 Token
	 * @param rec - 线段 Token 记录
	 * @returns {LineToken}
	 */
	static fromRecord(rec: ILineTokenRec): LineToken {
		return new LineToken(rec.id, rec.x, rec.y, rec.x2, rec.y2, 6, "", rec.color, rec.visible, rec.blockView);
	}

	/**
	 * 将线段 Token 转为可序列化的记录
	 * @returns {ILineTokenRec}
	 */
	toRecord(): ILineTokenRec {
		return {"type": "Line", "id": this.id, "x": this.a.x, "y": this.a.y, "x2":this.b.x, "y2": this.b.y,
			"color": this.color, "visible": this.visible, "blockView": this.blockView };
	}

	/**
	 * 在 Canvas 上绘制线段 Token（双层描边 + 对比色外框）
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	draw(cvsCtx: CanvasRenderingContext2D): void {
		cvsCtx.save();
		cvsCtx.lineWidth = 7;
		let color = ColorRGB.fromHexTo140(this.color);
		cvsCtx.strokeStyle = color.color.oppositeColor().color.toStrHex();
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.a.x, this.a.y);
		cvsCtx.lineTo(this.b.x, this.b.y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		cvsCtx.lineWidth = 3;
		cvsCtx.strokeStyle = this.color;
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.a.x, this.a.y);
		cvsCtx.lineTo(this.b.x, this.b.y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		cvsCtx.restore();
	}

}


/**
 * 场景数据接口响应（从后端加载的完整沙盘数据）
 */
export interface SceneDataResp {
	/** 用户名 */
	username    : string,
	/** 登录 Token */
	loginToken  : string,
	/** 图片资源列表 */
	imgResources: Array<ImageResource>,
	/** 地图数据 */
	mapDatas: {
		/** 队伍 */
		teams      : Array<ICircleTokenRec>,
		/** 生物 */
		creaters   : Array<ICircleTokenRec>,
		/** 摆设 */
		furnishings: Array<IRectangleTokenRec>,
		/** 门 */
		doors      : Array<IRectangleTokenRec>,
		/** 墙壁 */
		walls      : Array<ILineTokenRec>,
	}
}


/**
 * Canvas 帧缓冲接口
 */
export interface ICanvasFrame {
		/** Canvas 元素 */
		cvs: HTMLCanvasElement,
		/** 2D 渲染上下文 */
		ctx: CanvasRenderingContext2D
}
/**
 * 场景接口
 */
export interface IScene {
	/** 地图配置 */
	map: { imageUrl: string, width: number, height: number, shadowStyle: string },
	/** 可见性类型 */
	visibility: VisibilityType,
	/** 帧缓冲：buff=离屏缓冲, show=展示画布 */
	frame: { buff: ICanvasFrame, show: ICanvasFrame },
}
/**
 * 沙盘接口
 */
export interface ISandTable {
	/** 场景 */
	scene: IScene;
	/** 观察者（玩家） */
	observer: IObserver;
	/** 根据玩家视野渲染场景 */
	drawSceneWithUserView(tokens: Array<IToken2D>, proxyCfg?: ImageProxyConfig): Promise<void>;
}
/**
 * 沙盘
 *
 * 管理场景、观察者视野，根据 Token 阻挡关系渲染战争迷雾效果。
 */
export class SandTable implements ISandTable {
	/** 场景 */
	scene: IScene;
	/** 观察者（默认位置 250,300，视野 350） */
	observer: IObserver = {
		c: { x: 250, y: 300 },
		viewRange: (type: VisibilityType) => { return 350; }
	};

	/**
	 * @param scene - 场景配置
	 */
	constructor(scene: IScene) //
	{
		this.scene = scene;
	}

	/**
	 * 根据玩家视野渲染场景（加载地图 → 绘制黑暗/明亮层 → 裁剪视野）
	 * @param tokens - Token 列表
	 * @param proxyCfg - 可选的图片代理配置
	 * @returns {Promise<void>}
	 */
	async drawSceneWithUserView(tokens: Array<IToken2D>, proxyCfg?: ImageProxyConfig) {
		let oriMap = new Image();
		await WebUtil.loadImageByProxy(oriMap, this.scene.map.imageUrl, proxyCfg);
		this.scene.map.width  = oriMap.width ;
		this.scene.map.height = oriMap.height;
		await SandTableUtils.drawSceneWithUserView(this.scene, oriMap, this.observer, tokens);
	}


}


export namespace SandTableUtils {

	/**
	 * 加载图片资源列表中的所有图片
	 * @param imageRecs - 图片资源数组
	 * @param imgProxyUrl - 图片代理 URL
	 * @returns {Promise<void>}
	 */
	export let loadImageResources = async (imageRecs: Array<ImageResource>, imgProxyUrl?: string): Promise<void> => {
		if (null != imageRecs && imageRecs.length > 0) {
			for (let i = 0; i < imageRecs.length; i++) {
				let imgElem: HTMLImageElement = new Image();
				let cc = imageRecs[i];
				await WebUtil.loadImageByProxy(imgElem, cc.url, {proxyUrl: imgProxyUrl});
				cc.imgElem = imgElem;
			}
		}
	} 

	/**
	 * 绘制黑暗场景（原图 + 战争迷雾遮罩）
	 * @param frame - 帧缓冲
	 * @param oriMap - 原始地图图片
	 * @param shadowStyle - 迷雾填充样式
	 * @returns {Promise<HTMLImageElement>} 黑暗地图图片
	 */
	export let drawDarkScene = async (frame: ICanvasFrame, // 
		oriMap: HTMLImageElement, shadowStyle: string): Promise<HTMLImageElement> => // 
	{
		let width  = oriMap.width ;
		let height = oriMap.height;
		frame.ctx.clearRect(0, 0, width, height);
		frame.ctx.drawImage(oriMap, 0, 0, width, height, 0, 0, width, height);
		// 加上一层战争迷雾
		frame.ctx.fillStyle = shadowStyle
		frame.ctx.fillRect(0, 0, width, height);
		let darkMapData = frame.cvs.toDataURL('image/png', 1);
		let darkMapImage = new Image();
		darkMapImage.crossOrigin = 'Anonymous';
		await WebUtil.loadImageByProxy(darkMapImage, darkMapData);
		return darkMapImage;
	}



	/**
	 * 绘制明亮场景（原图 + 所有可见 Token）
	 * @param frame - 帧缓冲
	 * @param oriMap - 原始地图图片
	 * @param drawItems - 绘制 Token 的回调函数
	 * @returns {Promise<HTMLImageElement>} 明亮地图图片
	 */
	export let drawBrightScene = async (frame: ICanvasFrame, // 
		oriMap: HTMLImageElement , drawItems: (frame: ICanvasFrame) => Promise<void> //
	): Promise<HTMLImageElement> => // 
	{
		let width  = oriMap.width ;
		let height = oriMap.height;
		frame.ctx.clearRect(0, 0, width, height);
		frame.ctx.drawImage(oriMap, 0, 0, width, height, 0, 0, width, height);

		await drawItems(frame);

		let brightMapData = frame.cvs.toDataURL('image/png', 1);
		let brightMapImage = new Image();
		brightMapImage.crossOrigin = 'Anonymous';
		await WebUtil.loadImageByProxy(brightMapImage, brightMapData);
		return brightMapImage;
	}

	/**
	 * 在黑暗地图上裁剪出观察者的视野范围
	 * @param frame - 帧缓冲
	 * @param darkMapImage - 黑暗地图图片
	 * @param brightMapImage - 明亮地图图片
	 * @param observer - 观察者位置
	 * @param range - 视野半径
	 * @returns {Promise<HTMLImageElement>} 带视野裁剪的地图图片
	 */
	export let drawScopeOfVisionOnDarkMap = async (frame: ICanvasFrame, //
		darkMapImage: HTMLImageElement, brightMapImage: HTMLImageElement, //
		observer: {x: number, y: number}, range: number//
	): Promise<HTMLImageElement> => {
		let width  = darkMapImage.width ;
		let height = darkMapImage.height;
		frame.ctx.clearRect(0, 0, width, height);
		frame.ctx.drawImage(darkMapImage, 0, 0, width, height, 0, 0, width, height);
		frame.ctx.save();
		frame.ctx.beginPath();
		frame.ctx.arc(observer.x, observer.y, range, 0, Math.PI * 2);
		frame.ctx.clip();
		frame.ctx.drawImage(brightMapImage, 0, 0, width, height, 0, 0, width, height);
		frame.ctx.restore();
		let viewMapData = frame.cvs.toDataURL('image/png', 1);
		let viewMapImage = new Image();
		await WebUtil.loadImageByProxy(viewMapImage, viewMapData);
		return viewMapImage;
	}

	/**
	 * 根据玩家视野渲染完整场景（黑暗层 + 明亮层 + 视野裁剪）
	 *
	 * @param scene - 场景
	 * @param oriMap - 原始地图图片
	 * @param observer - 观察者
	 * @param tokens - Token 列表
	 * @returns {Promise<void>}
	 */
	export let drawSceneWithUserView = async (scene: IScene, oriMap: HTMLImageElement, observer: IObserver, tokens: Array<IToken2D>): Promise<void> => {
		//
		scene.frame.buff.cvs.width  = scene.map.width ;
		scene.frame.buff.cvs.height = scene.map.height;
		scene.frame.buff.cvs.style.width  = `${scene.map.width }px`;
		scene.frame.buff.cvs.style.height = `${scene.map.height}px`;
		scene.frame.show.cvs.width  = scene.map.width ;
		scene.frame.show.cvs.height = scene.map.height;
		scene.frame.show.cvs.style.width  = `${scene.map.width }px`;
		scene.frame.show.cvs.style.height = `${scene.map.height}px`;
		// 
		let darkMapImage = await drawDarkScene(scene.frame.buff, oriMap, scene.map.shadowStyle);
		let brightMapImage = await drawBrightScene(scene.frame.buff, oriMap, async (frame) => {
			for (let token of tokens) {
				if (token.visible) {
					token.draw(frame.ctx);
				}
			}
		});
		let viewMapImage = await drawScopeOfVisionOnDarkMap(scene.frame.buff, darkMapImage, brightMapImage,
			observer.c, observer.viewRange(scene.visibility));
		// 显示到展示的画布上
		scene.frame.show.ctx.clearRect(0, 0, scene.map.width, scene.map.height);
		scene.frame.show.ctx.drawImage(viewMapImage, 0, 0, scene.map.width, scene.map.height, 0, 0, scene.map.width, scene.map.height);
	}




}