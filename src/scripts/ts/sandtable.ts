import { ColorRGB, TimeUtil } from "./basic.js";
import { CanvasCircle2D, CanvasLine2D, CanvasRectangle2D, CanvasShape2D, ICanvas2D, ICanvasCircle2D, ICanvasLine2D, ICanvasRectangle2D, ImageClip } from "./canvas.js";
import { Geo2DUtils, IPoint2D} from "./geo2d.js";
import { ImageProxyConfig, WebUtil } from "./web.js";

export type VisibilityType = "default" | "glimmer" | "dark";

export interface IObserver {
	c: IPoint2D,
	viewRange: (type: VisibilityType) => number
};

/* ======================
 * 序列化的记录
 * ======================= */
export interface ImageResource {
	type    : "Image" | "Other",
	id      : string,
	url     : string,
	imgElem?: HTMLImageElement
}

export interface IToken2DRec {
	type     : "Circle" | "Rectangle" | "Line",
	id       : string,
	x        : number,
	y        : number,
	visiable : boolean,
	blockView: boolean,
	color    : string,
}
export interface IToken2D extends CanvasShape2D {
	id       : string,
	color    : string,
	visiable : boolean,
	blockView: boolean

	toRecord(): IToken2DRec;
}

export interface ICircleTokenRec extends IToken2DRec {
	type  : "Circle",
	radius: number,
	img   : ImageClip,
}

export interface ICircleToken extends ICanvasCircle2D { color: string, imgClip: ImageClip };
export class CircleToken extends CanvasCircle2D implements IToken2D, ICircleToken {
	id       : string = "";
	color    : string;
	visiable : boolean = true;
	blockView: boolean = true;
	imgClip  : ImageClip;

	constructor(id: string, x: number, y: number, radius: number, //
		lineWidth: number, strokeStyle: string, fillStyle: string, //
		visiable: boolean, blockView: boolean, color: string, image: ImageClip) //
	{
		super(x, y, radius, lineWidth, strokeStyle, fillStyle);
		this.id = id;
		this.visiable = visiable;
		this.blockView = blockView;
		this.color = color;
		this.imgClip = image;
	}

	toRecord(): ICircleTokenRec {
		return { "type": "Circle", "id": this.id, "x": this.c.x, "y": this.c.y, "radius": this.radius, // 
			"visiable": this.visiable, "blockView": this.blockView, "color": this.strokeStyle, "img": this.imgClip };
	}

	static fromRecord(rec: ICircleTokenRec, imageRecs: Array<ImageResource>): CircleToken {
		let cc = new CircleToken(rec.id, rec.x, rec.y, rec.radius, 0, rec.color, rec.color, // 
			rec.visiable, rec.blockView, rec.color, rec.img);
		if (null != imageRecs && imageRecs.length > 0) {
			for (let i = 0; i < imageRecs.length; i++) {
				let img = imageRecs[i];
				if (img.id == rec.img.imgKey) {
					if (img.imgElem) {
						rec.img.imageElem = img.imgElem;
					}
				}
			}
		}
		return cc;
	}

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

export interface IRectangleTokenRec extends IToken2DRec {
	type  : "Rectangle",
	width : number,
	height: number,
	img   : ImageClip,
};
export interface IRectangleToken extends ICanvasRectangle2D { color: string, imgClip: ImageClip }

export class RectangleToken extends CanvasRectangle2D implements IToken2D, IRectangleToken {
	id       : string = "";
	color    : string;
	visiable : boolean = true;
	blockView: boolean = true;
	imgClip  : ImageClip;

	constructor(id: string, x: number, y: number, width: number, heigh: number,//
		lineWidth: number, strokeStyle: string, fillStyle: string, //
		visiable: boolean, blockView: boolean, color: string, image: ImageClip) //
	{
		super(x, y, width, heigh, lineWidth, strokeStyle, fillStyle);
		this.id        = id;
		this.visiable  = visiable;
		this.blockView = blockView;
		this.color     = color;
		this.imgClip   = image;
	}

	static fromRecord(rec: IRectangleTokenRec, imageRecs: Array<ImageResource>): RectangleToken {
		let rtg = new RectangleToken(rec.id, rec.x, rec.y, rec.width, rec.height, 0, //
			rec.color, rec.color, rec.visiable, rec.blockView, rec.color, rec.img);
		if (null != imageRecs && imageRecs.length > 0) {
			for (let i = 0; i < imageRecs.length; i++) {
				let img = imageRecs[i];
				if (img.id == rec.img.imgKey) {
					if (img.imgElem) {
						rec.img.imageElem = img.imgElem;
					}
				}
			}
		}
		return rtg;
	}

	toRecord(): IRectangleTokenRec {
		return {
			"type": "Rectangle", "id": this.id, "x": this.x, "y": this.y, //
			"width": this.width, "height": this.height, "visiable": this.visiable, // 
			"blockView": this.blockView, "color": this.color, //
			"img": { "imgKey": "icons", "sx": 0, "sy": 0, "width": 50, "height": 50 }
		};
	}

	draw(cvsCtx: CanvasRenderingContext2D): void {
		cvsCtx.save();
		cvsCtx.lineWidth = 0;
		// draw a rectangle
		cvsCtx.beginPath();
		cvsCtx.fillStyle = this.color;
		cvsCtx.fillRect(this.x, this.y, this.width, this.height);
		cvsCtx.fill();
		// clip Image
		// cvsCtx.beginPath();
		cvsCtx.rect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
		// cvsCtx.stroke();
		// cvsCtx.clip();
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

export interface ILineTokenRec extends IToken2DRec {
	type: "Line",
	x2  : number,
	y2  : number,
}
export interface ILineToken extends ICanvasLine2D { color: string }
export class LineToken extends CanvasLine2D implements IToken2D, ILineToken {
	id: string = "";
	color: string;
	visiable: boolean = true;
	blockView: boolean = true;

	constructor(id: string, x1: number, y1: number, x2: number, y2: number, // 
		lineWidth: number, strokeStyle: string, color: string, // 
		visiable: boolean, blockView: boolean ) // 
	{
		super({x: x1, y: y1}, {x: x2, y: y2}, lineWidth, strokeStyle);
		this.id        = id;
		this.color     = color;
		this.visiable  = visiable;
		this.blockView = blockView;
	}

	static fromRecord(rec: ILineTokenRec): LineToken {
		return new LineToken(rec.id, rec.x, rec.y, rec.x2, rec.y2, 6, "", rec.color, rec.visiable, rec.blockView);
	}

	toRecord(): ILineTokenRec {
		return {"type": "Line", "id": this.id, "x": this.a.x, "y": this.a.y, "x2":this.b.x, "y2": this.b.y,
			"color": this.color, "visiable": this.visiable, "blockView": this.blockView };
	}

	draw(cvsCtx: CanvasRenderingContext2D): void {
		cvsCtx.save();
		// 
		cvsCtx.lineWidth = 7;
		// cvsCtx.fillStyle = this.color;
		let color = ColorRGB.fromHexTo140(this.color);
		cvsCtx.strokeStyle = color.color.oppColor.toString();
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.a.x, this.a.y);
		cvsCtx.lineTo(this.b.x, this.b.y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		// cvsCtx.fill();
		//
		cvsCtx.lineWidth = 3;
		// cvsCtx.fillStyle = this.color;
		cvsCtx.strokeStyle = this.color;
		cvsCtx.beginPath();
		cvsCtx.moveTo(this.a.x, this.a.y);
		cvsCtx.lineTo(this.b.x, this.b.y);
		cvsCtx.closePath();
		cvsCtx.stroke();
		// cvsCtx.fill();
		cvsCtx.restore();
	}

}


export interface ScenceDataResp {
	username    : string,
	loginToken  : string,
	imgResources: Array<ImageResource>,
	mapDatas: {
		teams      : Array<ICircleTokenRec>,
		creaters   : Array<ICircleTokenRec>,
		furnishings: Array<IRectangleTokenRec>,
		doors      : Array<IRectangleTokenRec>,
		walls      : Array<ILineTokenRec>,
	}
}


export interface ICanvasFrame {
		cvs: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D
}
export interface IScene {
	map: { imageUrl: string, width: number, height: number, shadowStyle: string },
	visibility: VisibilityType,
	frame: { buff: ICanvasFrame, show: ICanvasFrame },
}
export interface ISandTable {
}
export class SandTable implements ISandTable {
	scene: IScene;
	observer: IObserver = {
		c: { x: 250, y: 300 },
		viewRange: (type: string) => { return 350; }
	};

	constructor(scene: IScene) // 
	{
		this.scene = scene;
	}

	async drawSceneWithUserView(proxyCfg?: ImageProxyConfig) {
		// 加载地图
		let oriMap = new Image();
		await WebUtil.loadImageByProxy(oriMap, this.scene.map.imageUrl, proxyCfg);
		this.scene.map.width  = oriMap.width ;
		this.scene.map.height = oriMap.height;
		await SandTableUtils.drawSceneWithUserView(this.scene, oriMap, this.observer);
	}


}


//{

//	let rec = RGBColorMap.LemonChiffon;
//	let c1 = rec.color;
//	let c2 = rec.rev;
//	let c3 = c2.toName().color;
//	console.log(`%c${c2.toStrHex()}%c${c3.toStrHex()}`, //
//	`color:${c1.toStrHex()}; background:${c2.toStrHex()}; padding: 5px 7px; border-radius: 3px; font-weight: bold; font-size: 2.5em;`, //
//	`color:${c1.toStrHex()}; background:${c3.toStrHex()}; padding: 5px 7px; border-radius: 3px; font-weight: bold; font-size: 2.5em;`);

//}



export namespace SandTableUtils {

	/**
	 * 加载图片资源
	 * @param imageRecs 
	 * @param imgProxyUrl 
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

	//export let drawToken = (cvsCtx: CanvasRenderingContext2D, token :ICircleToken): void => {
	//		cvsCtx.save();
	//		cvsCtx.lineWidth = 0;
	//		// draw a circle
	//		cvsCtx.beginPath();
	//		cvsCtx.arc(token.c.x, token.c.y, token.radius, 0, Geo2DUtils.PI_DOUBLE, true);
	//		cvsCtx.fillStyle = token.color;
	//		cvsCtx.fill();
	//		// clip Image
	//		cvsCtx.beginPath();
	//		cvsCtx.arc(token.c.x, token.c.y, token.radius - 3, 0, Geo2DUtils.PI_DOUBLE, true);
	//		cvsCtx.clip();
	//		if (null != token.imgClip && null != token.imgClip.imageElem) {
	//			let dx = token.c.x - token.radius;
	//			let dy = token.c.y - token.radius;
	//			let dwidth = token.radius * 2;
	//			let dheight = dwidth;
	//			cvsCtx.drawImage(token.imgClip.imageElem, token.imgClip.sx, token.imgClip.sy,
	//				token.imgClip.width, token.imgClip.height, dx, dy, dwidth, dheight);
	//		}
	//		cvsCtx.restore();
	//}

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



	export let drawBrightScene = async (frame: ICanvasFrame, // 
		oriMap: HTMLImageElement , drawItems: (frame: ICanvasFrame) => Promise<void> //
	): Promise<HTMLImageElement> => // 
	{
		let width  = oriMap.width ;
		let height = oriMap.height;
		frame.ctx.clearRect(0, 0, width, height);
		frame.ctx.drawImage(oriMap, 0, 0, width, height, 0, 0, width, height);

		// TODO: add other things
		await drawItems(frame);

		let brightMapData = frame.cvs.toDataURL('image/png', 1);
		let brightMapImage = new Image();
		brightMapImage.crossOrigin = 'Anonymous';
		await WebUtil.loadImageByProxy(brightMapImage, brightMapData);
		return brightMapImage;
	}

	export let drawScopeOfVisionOnDarkMap = async (frame: ICanvasFrame, // 
		darkMapImage: HTMLImageElement, brightMapImage: HTMLImageElement, //
		// observer: IObserver, visiable: VisibilityType //
		observer: {x: number, y: number}, range: number//
	): Promise<HTMLImageElement> => {
		let width  = darkMapImage.width ;
		let height = darkMapImage.height;
		frame.ctx.drawImage(darkMapImage, 0, 0, width, height, 0, 0, width, height);
		frame.ctx.save();
		frame.ctx.beginPath();
		// frame.ctx.arc(observer.c.x, observer.c.y, observer.viewRange(visiable), 0, Math.PI * 2);
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
	 * 加载地图
	 * 
	 * @param scene 场景
	 * @param oriMap 图片
	 */
	export let drawSceneWithUserView = async (scene: IScene, oriMap: HTMLImageElement, observer: IObserver): Promise<void> => {
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
		let brightMapImage = await drawBrightScene(scene.frame.buff, oriMap, async (frame) => { //
			await TimeUtil.sleep(1000); 
		});
		let viewMapImage = await drawScopeOfVisionOnDarkMap(scene.frame.buff, darkMapImage, brightMapImage, 
			// observer, scene.visibility);
			observer.c, observer.viewRange(scene.visibility));
		// 显示到展示的画布上
		scene.frame.show.ctx.clearRect(0, 0, scene.map.width, scene.map.height);
		scene.frame.show.ctx.drawImage(viewMapImage, 0, 0, scene.map.width, scene.map.height, 0, 0, scene.map.width, scene.map.height);
	}




}