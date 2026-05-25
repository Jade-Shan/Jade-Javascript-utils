import { GeoShape2D, GeoPolygon2D, Geo2DUtils, Point2D, Line2D, IRay2D, 
	IPoint2D, ILine2D, IRectangle2D, Rectangle2D, Ray2D, IGeo2D, GeoCurve2D, 
	IRevolveOption, ICircle2D, Circle2D } from './geo2d.js';
import { WebUtil } from './web.js';

/**
 * 从图片中截取一部分
 */
export interface ImageClip {
	imgKey    : string, // 对应的图片ID
	sx        : number, // 左上角X
	sy        : number, // 左上角Y
	width     : number, // 宽度
	height    : number, // 高度
	imageElem?: HTMLImageElement;
};

export interface ICanvasStyle {
	lineWidth  ?: number;
	strokeStyle?: string;
	fillStyle  ?: string;
	imgClip    ?: ImageClip;
}

export namespace CanvasUtils {


	/**
	 * 下载canvas所转的图片
	 * @param cvsElem canvas element
	 * @param type image type
	 * @param filename file name
	 */
	export let downloadCanvasImage = (cvsElem: HTMLCanvasElement, type?: string, filename?: string) => {
		const fileType = type && type.length > 2 ? type.toLowerCase() : 'png';
		const mimeType = `image/${fileType}`;
		const fileName = filename ? filename : `download-${(new Date()).getTime()}.${fileType}`;
		cvsElem.toBlob((blob) => {
			if (blob) { WebUtil.downloadBlob(blob, fileName); }
		}, mimeType);
	}


	function drawWithCanvas(cvsCtx: CanvasRenderingContext2D, // 
		func: (cvs: CanvasRenderingContext2D) => void, style?: ICanvasStyle //
	): void //
	{
		cvsCtx.save();
		if (style?.lineWidth  ) { cvsCtx.lineWidth   = style.lineWidth  ; }
		if (style?.strokeStyle) { cvsCtx.strokeStyle = style.strokeStyle; }
		if (style?.fillStyle  ) { cvsCtx.fillStyle   = style.fillStyle  ; }
		cvsCtx.beginPath();
		func(cvsCtx);
		if (style?.lineWidth && style.lineWidth > 0) { cvsCtx.stroke(); }
		if (style?.fillStyle) { cvsCtx.fill(); }
		if (style?.imgClip?.imageElem) {
			cvsCtx.stroke();
			cvsCtx.clip();
			cvsCtx.drawImage(style.imgClip.imageElem, 
				style.imgClip.sx, style.imgClip.sy, //
				style.imgClip.width, style.imgClip.height, //
				style.imgClip.sx, style.imgClip.sy, //
				style.imgClip.width, style.imgClip.height);
		}
		cvsCtx.restore();
	}

	export function drawArc(cvsCtx: CanvasRenderingContext2D, // 
		center: IPoint2D, radius: number, revole: IRevolveOption, style?: ICanvasStyle // 
	): void //
	{
		//drawWithCanvas(cvsCtx, (cvsCtx) => {
		//	// 因为Canvas的原点坐标是在左上角，所以顺时钟和逆时钟的方向和笛卡尔坐标系是反的
		//	cvsCtx.arc(center.x, center.y, radius, revole.start, revole.end, revole.diff < 0);
		//}, style);
		cvsCtx.save();
		if (style?.lineWidth) { cvsCtx.lineWidth = style.lineWidth; }
		if (style?.strokeStyle) { cvsCtx.strokeStyle = style.strokeStyle; }
		if (style?.fillStyle) { cvsCtx.fillStyle = style.fillStyle; }
		cvsCtx.beginPath();
		cvsCtx.arc(center.x, center.y, radius, revole.start, revole.end, revole.diff < 0);
		if (style?.lineWidth && style.lineWidth > 0) { cvsCtx.stroke(); }
		if (style?.fillStyle) { cvsCtx.fill(); }
		cvsCtx.restore();
	}

	/**
	 * 画一条线段
	 * @param cvsCtx 
	 * @param a 
	 * @param b 
	 * @param width 
	 * @param style 
	 */
	export function drawLine(cvsCtx: CanvasRenderingContext2D, line: ICanvasLine2D): void {
		cvsCtx.save();
		cvsCtx.strokeStyle = line.strokeStyle;
		cvsCtx.lineWidth = line.lineWidth;
		cvsCtx.beginPath();
		cvsCtx.moveTo(line.a.x, line.a.y);
		cvsCtx.lineTo(line.b.x, line.b.y);
		cvsCtx.stroke();
		cvsCtx.restore();
	}

	/**
	 * 绘制多条相同样式的线段
	 * @param cvsCtx 
	 * @param lines 
	 */
	export function drawLines(cvsCtx: CanvasRenderingContext2D, lines: Array<ICanvasLine2D>): void {
		if (lines && lines.length > 0) {
			for (let i = 0; i < lines.length; i++) {
				drawLine(cvsCtx, lines[i]);
			}
		}
	}

	export function drawRay(cvsCtx: CanvasRenderingContext2D, ray: ICanvasRay2D): void {
		drawLine(cvsCtx, {
			a: ray.start, b: ray.mid, // 
			lineWidth: ray.lineWidth, strokeStyle: ray.strokeStyle, //
			lineCap: ray.lineCap, lineJoin: ray.lineJoin
		})
	}

	export function drawRays(cvsCtx: CanvasRenderingContext2D, rays: Array<ICanvasRay2D>): void {
		if (rays && rays.length > 0) {
			for (let i = 0; i < rays.length; i++) {
				drawRay(cvsCtx, rays[i]);
			}
		}
	}

	export function drawPoint(cvsCtx: CanvasRenderingContext2D, point: ICanvasPoint2D): void {
		cvsCtx.save();
		cvsCtx.fillStyle = point.fillStyle;
		cvsCtx.beginPath();
		cvsCtx.arc(point.x, point.y, point.radius, 0, Geo2DUtils.PI_DOUBLE, true);
		cvsCtx.fill();
		cvsCtx.restore();
	}

	export function drawPoints(cvsCtx: CanvasRenderingContext2D, points: Array<ICanvasPoint2D>): void  {
		if (points && points.length > 0) {
			for (let i = 0; i < points.length; i++) {
				drawPoint(cvsCtx, points[i]);
			}
		}
	}

	export function drawRectangle(cvsCtx: CanvasRenderingContext2D, rect: ICanvasRectangle2D): void {
		cvsCtx.save();
		if (rect.fillStyle && rect.fillStyle.length > 0) {
			cvsCtx.beginPath();
			cvsCtx.fillStyle = rect.fillStyle;
			cvsCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
		}
		if (rect.lineWidth > 0) {
			cvsCtx.beginPath();
			cvsCtx.strokeStyle = rect.strokeStyle;
			cvsCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
		}
		cvsCtx.restore();
	}

	export function drawCircle(cvsCtx: CanvasRenderingContext2D, circle: ICanvasCircle2D): void {
		cvsCtx.save();
		if (circle.fillStyle && circle.fillStyle.length > 0) {
			cvsCtx.beginPath();
			cvsCtx.fillStyle = circle.fillStyle;
			cvsCtx.arc(circle.c.x, circle.c.y, circle.radius, 0, Geo2DUtils.PI_DOUBLE, false);
			cvsCtx.fill();
		}
		if (circle.lineWidth > 0) {
			cvsCtx.beginPath();
			cvsCtx.strokeStyle = circle.strokeStyle;
			cvsCtx.arc(circle.c.x, circle.c.y, circle.radius, 0, Geo2DUtils.PI_DOUBLE, false);
			cvsCtx.stroke();
		}
		cvsCtx.restore();
	}

	export function genVertexes(shape: CanvasPolygon2D, radius: number, fillStyle: string): //
		Array<CanvasPoint2D> //
	{
		let result: Array<CanvasPoint2D> = [];
		let vtxs = shape.getVertex();
		if (vtxs && vtxs.length > 0) {
			for (let i = 0; i < vtxs.length; i++) {
				let vtx = vtxs[i];
				result.push(new CanvasPoint2D(vtx.x, vtx.y, radius, fillStyle));
			}
		}
		return result;
	}

	export function drawShapeVertexes(cvsCtx: CanvasRenderingContext2D, // 
		shape: CanvasPolygon2D, radius: number, fillStyle: string): void //
	{
		let vtxs: Array<CanvasPoint2D> = genVertexes(shape, radius, fillStyle);
		drawPoints(cvsCtx, vtxs);
	}

	export function drawVertexRaysFrom(cvsCtx: CanvasRenderingContext2D, x: number, y: number, shape: GeoShape2D, // 
		length: number, lineWidth: number, strokeStyle: string) // 
	{
		let vtxRays: Array<{ vertex: Point2D, ray: Ray2D }> = Geo2DUtils.genVertexRaysFrom(x, y, shape, length);
		if (vtxRays && vtxRays.length > 0) {
			for (let i = 0; i < vtxRays.length; i++) {
				let ray = vtxRays[i].ray;
				drawLine(cvsCtx, {
					a: { x: ray.start.x, y: ray.start.y }, b: { x: ray.mid.x, y: ray.mid.y },  //
					lineWidth, strokeStyle
				});
			}
		}
	}

	export function drawVertexShadowFrom(cvsCtx: CanvasRenderingContext2D, x: number, y: number, shape: GeoShape2D, //
		length: number, style: ICanvasStyle) //
	{
		let vtxRays: Array<{ vertex: Point2D, ray: Ray2D }> = Geo2DUtils.genVertexRaysFrom(x, y, shape, length);
		if (vtxRays && vtxRays.length < 2) {
			return;
		}
		for (let i = 0; i < vtxRays.length - 1; i++) {
			drawFanByRays(cvsCtx, vtxRays[i], vtxRays[i + 1], style);
		}
		drawFanByRays(cvsCtx, vtxRays[vtxRays.length - 1], vtxRays[0], style);
	}

	export function drawFanByRays(cvsCtx: CanvasRenderingContext2D, //  
		start: { vertex: Point2D, ray: Ray2D }, end: { vertex: Point2D, ray: Ray2D }, style?: ICanvasStyle) //
	{
		let revole = Geo2DUtils.revolveRay(start.ray.start, start.ray.mid, end.ray.mid);
		// let a1 = Geo2DUtils.formatAngle(revole.start);
		// let a2 = Geo2DUtils.formatAngle(revole.end);
		// let a3 = Geo2DUtils.formatAngle(revole.diff);
		// console.log(` 
		//=================================================================================	${(new Date()).getUTCMilliseconds()}
		//		 c: (${start.ray.start.x},${start.ray.start.y}), radius ${start.ray.length}, 
		//		 from: ${NumUtil.toFixed(a1.oriAgl, 3)} = ${NumUtil.toFixed(a1.fmtAgl, 3)} = ${NumUtil.toFixed(a1.oriDgr, 2)}° = ${NumUtil.toFixed(a1.fmtDgr, 2)}°
		//		   to: ${NumUtil.toFixed(a2.oriAgl, 3)} = ${NumUtil.toFixed(a2.fmtAgl, 3)} = ${NumUtil.toFixed(a2.oriDgr, 2)}° = ${NumUtil.toFixed(a2.fmtDgr, 2)}°
		//		 diff: ${NumUtil.toFixed(a3.oriAgl, 3)} = ${NumUtil.toFixed(a3.fmtAgl, 3)} = ${NumUtil.toFixed(a3.oriDgr, 2)}° = ${NumUtil.toFixed(a3.fmtDgr, 2)}°
		//=================================================================================	
		//`);

		drawWithCanvas(cvsCtx, (cvsCtx) => {
			// 因为Canvas的原点坐标是在左上角，所以顺时钟和逆时钟的方向和笛卡尔坐标系是反的
			cvsCtx.arc(start.ray.start.x, start.ray.start.y, start.ray.length, revole.start, revole.end, revole.diff < 0);
			cvsCtx.lineTo(end.vertex.x, end.vertex.y);
			cvsCtx.lineTo(start.vertex.x, start.vertex.y);
		}, style);
	}

	export function genShapeTengentLine(x: number, y: number, shape: CanvasShape2D, // 
		length: number, lineWidth: number, strokeStyle: string): Array<CanvasRay2D> //
	{
		let result: Array<CanvasRay2D> = [];
		// TODO: 
		//let rays: Array<Ray2D> = Geo2DUtils.genTengentRays(x, y, shape, length);
		//if (rays && rays.length > 0) {
		//	for (let i = 0; i < rays.length; i++) {
		//		let ray = rays[i];
		//		result.push(new CanvasRay2D(ray.start, ray.mid, lineWidth, strokeStyle));
		//	}
		//}
		return result;
	}

	export function drawShapeTengentRays(cvsCtx: CanvasRenderingContext2D, x: number, y: number, // 
		shape: CanvasShape2D, length: number, lineWidth: number, strokeStyle: string) // 
	{
		let rays: Array<CanvasRay2D> = genShapeTengentLine(x, y, shape, length, lineWidth, strokeStyle);
		drawRays(cvsCtx, rays);
	}
}


export interface ICanvas2D extends IGeo2D { }

export interface CanvasShape2D extends GeoShape2D { }

export interface CanvasCurve2D extends CanvasShape2D, GeoCurve2D { }

export interface CanvasPolygon2D extends CanvasShape2D, GeoPolygon2D { }

export interface ICanvasPoint2D extends ICanvas2D, IPoint2D {
	readonly radius   : number;
	readonly fillStyle: string;
}
export class CanvasPoint2D extends Point2D //
	implements CanvasCurve2D, ICanvasPoint2D // 
{
	readonly radius   : number;
	readonly fillStyle: string;

	constructor(x: number, y: number, radius: number, fillStyle: string) {
		super(x, y);
		this.radius    = radius;
		this.fillStyle = fillStyle;
	}

	static from(point: ICanvasPoint2D): CanvasPoint2D {
		return new CanvasPoint2D(point.x, point.y, point.radius, point.fillStyle);
	}
}

export interface ICanvasLine2D extends ICanvas2D, ILine2D {
	readonly lineWidth : number;
	readonly lineCap   ?: "butt"  | "round" | "square";
	readonly lineJoin  ?: "miter" | "round" | "bevel" ;
	readonly strokeStyle: string;
}
export class CanvasLine2D extends Line2D implements CanvasPolygon2D, ICanvasLine2D {
	readonly lineWidth: number;
	readonly strokeStyle: string;

	constructor(a: IPoint2D, b: IPoint2D, lineWidth: number, strokeStyle: string) //
	{
		super(a, b);
		this.strokeStyle = strokeStyle;
		this.lineWidth = lineWidth;
	}

	static from(line: ICanvasLine2D): CanvasLine2D {
		return new CanvasLine2D(line.a, line.b, line.lineWidth, line.strokeStyle);
	}

}

export interface ICanvasRay2D extends IRay2D {
	readonly lineWidth  : number;
	readonly lineCap   ?: "butt"  | "round" | "square";
	readonly lineJoin  ?: "miter" | "round" | "bevel" ;
	readonly strokeStyle: string;
}
export class CanvasRay2D extends Ray2D implements CanvasPolygon2D, ICanvasRay2D {
	readonly lineWidth  : number;
	readonly strokeStyle: string;

	constructor(start: IPoint2D, mid: IPoint2D, lineWidth: number, strokeStyle: string) {
		super(start, mid);
		this.strokeStyle = strokeStyle;
		this.lineWidth   = lineWidth  ;
	}

}

export interface ICanvasRectangle2D extends IRectangle2D {
	readonly lineWidth  : number;
	readonly strokeStyle: string;
	readonly fillStyle  : string;
}
export class CanvasRectangle2D extends Rectangle2D //
	implements CanvasPolygon2D, ICanvasRectangle2D //
{
	readonly lineWidth  : number;
	readonly strokeStyle: string;
	readonly fillStyle  : string;

	constructor(x: number, y: number, width: number, height: number, //
		lineWidth: number, strokeStyle: string, fillStyle: string) {
		super(x, y, width, height);
		this.lineWidth = lineWidth;
		this.strokeStyle = strokeStyle;
		this.fillStyle = fillStyle;
	}

	static from(rect: ICanvasRectangle2D): CanvasRectangle2D {
		return new CanvasRectangle2D(rect.x, rect.y, rect.width, rect.height, //
			rect.lineWidth, rect.strokeStyle, rect.fillStyle);
	}

}


export interface ICanvasCircle2D extends ICanvas2D, ICircle2D {
	readonly lineWidth  : number;
	readonly strokeStyle: string;
	readonly fillStyle  : string;

}
export class CanvasCircle2D extends Circle2D // 
	implements CanvasCurve2D, ICanvasCircle2D // 
{
	readonly lineWidth  : number;
	readonly strokeStyle: string;
	readonly fillStyle  : string;

	constructor(x: number, y: number, radius: number, lineWidth: number, strokeStyle: string, fillStyle: string) {
		super(x, y, radius);
		this.lineWidth = lineWidth;
		this.strokeStyle = strokeStyle;
		this.fillStyle = fillStyle;
	}

}
