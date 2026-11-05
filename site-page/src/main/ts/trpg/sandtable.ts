import { ColorRGB } from '@jade-dungeon/jade-utils/basic';
import { CanvasCircle2D, CanvasLine2D, CanvasRectangle2D, CanvasShape2D, ICanvas2D, ICanvasCircle2D, ICanvasLine2D, ICanvasRectangle2D, ImageClip } from '@jade-dungeon/jade-utils/canvas';
import { Geo2DUtils, IPoint2D} from '@jade-dungeon/jade-utils/geo2d';
import { ImageProxyConfig, WebUtil } from '@jade-dungeon/jade-utils/web';

/** 可见性类型：default=默认, glimmer=微光, dark=黑暗 */
export type VisibilityType = "default" | "glimmer" | "dark";

/**
 * 线段 Token 的命中容差（像素）
 *
 * 线段没有面积，点中它靠「距离小于容差」。取 6 是因为 `draw()` 的外层描边
 * 就是 7px —— 容差比视觉宽度小一点，但足够让鼠标点得中。
 * 调小了编辑器里几乎选不中墙。
 */
export const LINE_HIT_TOLERANCE = 6;

/** 编辑器里线段两端那个方块手柄的半边长（像素） */
export const LINE_HANDLE_SIZE = 3;

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
	/**
	 * 是否可见（**存量数据的拼写错误**，`visible` 之误）
	 *
	 * 老沙盘应用一直这么存，而后端只存整块 JSON、不解析字段
	 *（`save-map` 只取 `loginToken`），所以存量数据里是哪个拼写、读出来就是哪个。
	 * 实测老样例场景文件里 57 处 `visiable`、0 处 `visible`。
	 *
	 * **读的时候两种都认**（见 {@link readVisible}）、
	 * **写的时候只写 `visible`**（见各类的 `toRecord()`）——
	 * 所以每个场景在 GM 第一次「保存并发布」之后就自动转正了。
	 *
	 * @deprecated 过渡字段。**不能提前删** —— 删了之后没转正过的场景会变成
	 * 「整张图的棋子全部隐形」且不报错（`undefined` 按 falsy 处理）。
	 * 要删得先确认 Redis 里所有场景都重存过一遍。
	 */
	visiable?: boolean,
	/** 是否阻挡视野 */
	blockView: boolean,
	/** 颜色 */
	color    : string,
}

/**
 * 读取记录里的可见性，兼容存量数据的拼写错误
 *
 * 优先级：`visible` > `visiable` > `false`。
 *
 * **兜底是 `false` 而不是 `true`**：两个拼写都没有时说明这条记录既不是新数据
 * 也不是老数据（字段真缺了）。棋子隐形是**可观测的异常**，
 * 而默认可见会把「数据有问题」伪装成「一切正常」。
 *
 * @param rec - Token 记录
 * @returns {boolean} 是否可见
 */
export function readVisible(rec: { visible?: boolean, visiable?: boolean }): boolean {
	return rec.visible ?? rec.visiable ?? false;
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

	/**
	 * 编辑器用：不带视野迷雾地绘制自己（看全图）
	 *
	 * 和 {@link IToken2D.draw} 的区别只在于**编辑器要看见隐形的 Token** ——
	 * 墙壁、未触发的门这些 `visible: false` 的元素在玩家视图里不画，
	 * 但编辑时必须看得见才能调。
	 */
	drawDesign(cvsCtx: CanvasRenderingContext2D): void;

	/**
	 * 点 `(x, y)` 是否命中本 Token
	 *
	 * 编辑器靠它做「点一下选中棋子」，玩家视图靠它判断「点的是不是自己的棋子」。
	 */
	isHit(x: number, y: number): boolean;

	/**
	 * 平移 `(dx, dy)` 之后的**新** Token
	 *
	 * ⚠️ **返回新实例，不改当前对象。** 几何层的坐标字段是 `readonly`，
	 * 而且 `Rectangle2D` 把顶点与边缓存在构造函数里 —— 原地改坐标会让缓存
	 * 失效，碰撞检测与阴影投射会静默按旧位置算（图形却画在新位置）。
	 *
	 * 所以调用方要把容器里的那一项**换成返回值**，不是改引用指向的对象。
	 */
	moveTo(dx: number, dy: number): IToken2D;

	/**
	 * 缩放之后的**新** Token
	 *
	 * 同 {@link IToken2D.moveTo}，返回新实例。
	 *
	 * @param dx - 水平方向的尺寸增量
	 * @param dy - 垂直方向的尺寸增量。圆形只用 `dx`（半径增量）
	 */
	scaleTo(dx: number, dy: number): IToken2D;

	/** 复制一个独立的 Token（图片裁剪也复制，不共享引用） */
	clone(): IToken2D;
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
			readVisible(rec), rec.blockView, rec.color, imgClip);
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

	/**
	 * 编辑器用：画出自己 + 一圈虚线轮廓
	 *
	 * 轮廓的作用是让 `visible: false` 的 Token 在编辑器里也看得见 ——
	 * 玩家视图不画它们，编辑时必须看得见才能调。
	 *
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	drawDesign(cvsCtx: CanvasRenderingContext2D): void {
		this.draw(cvsCtx);
		cvsCtx.save();
		cvsCtx.setLineDash([4, 3]);
		cvsCtx.lineWidth   = 1;
		cvsCtx.strokeStyle = this.visible ? "rgba(0,0,0,0.6)" : "rgba(255,0,255,0.9)";
		cvsCtx.beginPath();
		cvsCtx.arc(this.c.x, this.c.y, this.radius + 1, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.stroke();
		cvsCtx.restore();
	}

	/**
	 * 点是否落在圆内（含边界）
	 *
	 * @param x - 点的 X 坐标
	 * @param y - 点的 Y 坐标
	 * @returns {boolean}
	 */
	isHit(x: number, y: number): boolean {
		let dx = x - this.c.x;
		let dy = y - this.c.y;
		return dx * dx + dy * dy <= this.radius * this.radius;
	}

	/**
	 * 平移后的新 CircleToken
	 *
	 * ⚠️ 返回新实例，不改当前对象，理由见 {@link IToken2D.moveTo}。
	 *
	 * @param dx - X 方向位移
	 * @param dy - Y 方向位移
	 * @returns {CircleToken} 位置变了、其余属性照搬的新 Token
	 */
	moveTo(dx: number, dy: number): CircleToken {
		return new CircleToken(this.id, this.c.x + dx, this.c.y + dy, this.radius, //
			this.lineWidth, this.strokeStyle, this.fillStyle, //
			this.visible, this.blockView, this.color, { ...this.imgClip });
	}

	/**
	 * 缩放后的新 CircleToken。圆形只认 `dx`（半径增量），`dy` 忽略
	 *
	 * 半径下限 1 —— 0 或负半径画不出来，而且 `isHit` 会永远返回 false，
	 * 变成一个选不中、删不掉的幽灵 Token。
	 *
	 * @param dx - 半径增量
	 * @param _dy - 未使用（圆形只有一个尺寸维度）
	 * @returns {CircleToken}
	 */
	scaleTo(dx: number, _dy: number): CircleToken {
		let radius = Math.max(1, this.radius + dx);
		return new CircleToken(this.id, this.c.x, this.c.y, radius, //
			this.lineWidth, this.strokeStyle, this.fillStyle, //
			this.visible, this.blockView, this.color, { ...this.imgClip });
	}

	/**
	 * 复制一份
	 *
	 * `imgClip` 浅拷贝一层 —— 裁剪参数独立，但 `imageElem` 共享同一个
	 * `HTMLImageElement`（那是加载好的图片资源，本来就该共享）。
	 *
	 * @returns {CircleToken}
	 */
	clone(): CircleToken {
		return this.moveTo(0, 0);
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
			rec.color, rec.color, readVisible(rec), rec.blockView, rec.color, imgClip);
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

	/**
	 * 编辑器用：画出自己 + 一圈虚线轮廓（隐形的 Token 也看得见）
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	drawDesign(cvsCtx: CanvasRenderingContext2D): void {
		this.draw(cvsCtx);
		cvsCtx.save();
		cvsCtx.setLineDash([4, 3]);
		cvsCtx.lineWidth   = 1;
		cvsCtx.strokeStyle = this.visible ? "rgba(0,0,0,0.6)" : "rgba(255,0,255,0.9)";
		cvsCtx.strokeRect(this.x, this.y, this.width, this.height);
		cvsCtx.restore();
	}

	/**
	 * 点是否落在矩形内（含边界）
	 *
	 * @param x - 点的 X 坐标
	 * @param y - 点的 Y 坐标
	 * @returns {boolean}
	 */
	isHit(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width
			&& y >= this.y && y <= this.y + this.height;
	}

	/**
	 * 平移后的新 RectangleToken
	 *
	 * ⚠️ 返回新实例。`Rectangle2D` 把 `vertexs` / `sides` 缓存在构造函数里，
	 * 原地改 `x`/`y` 会让这些缓存停在旧位置 —— 阴影投射与碰撞检测会出错而不报错。
	 *
	 * @param dx - X 方向位移
	 * @param dy - Y 方向位移
	 * @returns {RectangleToken}
	 */
	moveTo(dx: number, dy: number): RectangleToken {
		return new RectangleToken(this.id, this.x + dx, this.y + dy, this.width, this.height, //
			this.lineWidth, this.strokeStyle, this.fillStyle, //
			this.visible, this.blockView, this.color, { ...this.imgClip });
	}

	/**
	 * 缩放后的新 RectangleToken
	 *
	 * 宽高下限都是 1，理由同 {@link CircleToken.scaleTo} —— 0 尺寸的 Token
	 * 画不出来也选不中。
	 *
	 * @param dx - 宽度增量
	 * @param dy - 高度增量
	 * @returns {RectangleToken}
	 */
	scaleTo(dx: number, dy: number): RectangleToken {
		let width  = Math.max(1, this.width  + dx);
		let height = Math.max(1, this.height + dy);
		return new RectangleToken(this.id, this.x, this.y, width, height, //
			this.lineWidth, this.strokeStyle, this.fillStyle, //
			this.visible, this.blockView, this.color, { ...this.imgClip });
	}

	/**
	 * 复制一份（`imgClip` 浅拷贝，`imageElem` 共享）
	 * @returns {RectangleToken}
	 */
	clone(): RectangleToken {
		return this.moveTo(0, 0);
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
		return new LineToken(rec.id, rec.x, rec.y, rec.x2, rec.y2, 6, "", rec.color,
			readVisible(rec), rec.blockView);
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

	/**
	 * 编辑器用：画出线段 + 两端的端点手柄
	 *
	 * **墙壁几乎都是 `visible: false`**（玩家不该看见墙本身，只受它遮挡），
	 * 所以编辑器里这个方法是唯一能看见墙的途径。
	 * 两端画方块手柄，提示这里可以拖。
	 *
	 * @param cvsCtx - Canvas 2D 上下文
	 */
	drawDesign(cvsCtx: CanvasRenderingContext2D): void {
		this.draw(cvsCtx);
		cvsCtx.save();
		cvsCtx.fillStyle = this.visible ? "rgba(0,0,0,0.6)" : "rgba(255,0,255,0.9)";
		for (const p of [this.a, this.b]) {
			cvsCtx.fillRect(p.x - LINE_HANDLE_SIZE, p.y - LINE_HANDLE_SIZE, //
				LINE_HANDLE_SIZE * 2, LINE_HANDLE_SIZE * 2);
		}
		cvsCtx.restore();
	}

	/**
	 * 点是否命中线段
	 *
	 * 线段没有面积，所以判定是「点到线段的距离小于容差」。
	 * 容差取 {@link LINE_HIT_TOLERANCE}，和描边宽度相当 ——
	 * 太小了编辑器里几乎点不中墙。
	 *
	 * 用点到**线段**（不是无限长直线）的距离：超出两端范围时取到端点的距离，
	 * 否则取垂距。老代码的 `pointToLineDistence` 做的是同一件事。
	 *
	 * @param x - 点的 X 坐标
	 * @param y - 点的 Y 坐标
	 * @returns {boolean}
	 */
	isHit(x: number, y: number): boolean {
		let dx = this.b.x - this.a.x;
		let dy = this.b.y - this.a.y;
		let len2 = dx * dx + dy * dy;
		if (len2 < 1e-10) {
			// 退化成一个点（两端重合），按到该点的距离判
			return Geo2DUtils.distanceP2P({ x, y }, this.a) <= LINE_HIT_TOLERANCE;
		}
		// 投影参数夹到 [0,1]，保证落在线段上而不是延长线上
		let t = ((x - this.a.x) * dx + (y - this.a.y) * dy) / len2;
		t = Math.max(0, Math.min(1, t));
		let px = this.a.x + t * dx;
		let py = this.a.y + t * dy;
		return Geo2DUtils.distanceP2P({ x, y }, { x: px, y: py }) <= LINE_HIT_TOLERANCE;
	}

	/**
	 * 平移后的新 LineToken（两端一起移）
	 *
	 * ⚠️ 返回新实例，理由见 {@link IToken2D.moveTo}。
	 *
	 * @param dx - X 方向位移
	 * @param dy - Y 方向位移
	 * @returns {LineToken}
	 */
	moveTo(dx: number, dy: number): LineToken {
		return new LineToken(this.id, this.a.x + dx, this.a.y + dy, //
			this.b.x + dx, this.b.y + dy, //
			this.lineWidth, this.strokeStyle, this.color, this.visible, this.blockView);
	}

	/**
	 * 缩放线段：**只移动终点**，起点不动
	 *
	 * 线段没有「宽高」，所以缩放的语义就是拖动终点改变长度与方向 ——
	 * 这也是老代码 `onScaleing` 的行为（编辑器里按 Alt 拖动）。
	 *
	 * @param dx - 终点的 X 增量
	 * @param dy - 终点的 Y 增量
	 * @returns {LineToken}
	 */
	scaleTo(dx: number, dy: number): LineToken {
		return new LineToken(this.id, this.a.x, this.a.y, //
			this.b.x + dx, this.b.y + dy, //
			this.lineWidth, this.strokeStyle, this.color, this.visible, this.blockView);
	}

	/**
	 * 复制一份
	 * @returns {LineToken}
	 */
	clone(): LineToken {
		return this.moveTo(0, 0);
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