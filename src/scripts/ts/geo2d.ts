import { NumUtil } from "./basic.js";

export interface IGeo2D { }

export interface GeoShape2D extends IGeo2D {

	/**
	 * 图形的中心
	 */
	getCenter(): Point2D;

	/**
	 * 对于一个外部的点`(x,y)`，返回这个点到图形近的顶占和距离
	 * 
	 * @param x 外部点的坐标x
	 * @param y 外部点的坐标y
	 * @returns 最近的点`vertex`和距离`distancd`
	 */
	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number }


	/**
	 * 
	 * 对于一个外部的点`(x,y)`，返回这个点到图形的多个顶点
	 * 
	 * @param x 外部点的坐标x
	 * @param y 外部点的坐标y
	 * @returns 多个顶点
	 */
	getVertexesFrom(x: number, y: number): Array<Point2D>;

}

export interface GeoCurve2D extends GeoShape2D { }


export interface GeoPolygon2D extends GeoShape2D {

	getVertex(): Array<Point2D>;

}

export type ICircle2D = { readonly c: Point2D, readonly radius: number }
export class Circle2D implements GeoCurve2D, ICircle2D {
	readonly c     : Point2D;
	readonly radius: number;

	constructor(x: number, y: number, radius: number) {
		this.c      = new Point2D(x, y);
		this.radius = radius;
	}

	getCenter(): Point2D { return this.c; }

	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number } {
		let dx      = this.c.x - x;
		let dy      = this.c.y - y;
		let cDist   = Math.round(Math.sqrt(dx * dx + dy * dy)); // 点到圆心的距离
		let minDist = cDist - this.radius // 点到圆的距离

		if (cDist == 0) {
			// 点和圆心重合
			return { vertex: this.c, distance: minDist };
		} else if (dx == 0) {
			// 点和圆心水平对齐,cos不存在
			return { vertex: new Point2D(this.c.x, this.c.y - minDist), distance: minDist };
		} else if (dy ==0 ) {
			// 点和圆心垂直对齐,cos不存在
			return { vertex: new Point2D(this.c.x - minDist, this.c.y), distance: minDist };
		} else {
			let angle = Math.atan2(dy, dx);
			let ca = Geo2DUtils.formatAngle(angle);
			console.log(`${(new Date()).getUTCMilliseconds()}: ` +
				`angle: ${NumUtil.toFixed(ca.oriAgl, 3)} = ${NumUtil.toFixed(ca.fmtAgl, 3)} = ` +
				`${NumUtil.toFixed(ca.oriDgr, 2)}° = ${NumUtil.toFixed(ca.fmtDgr, 2)}°`);
			let tx = Math.sin(angle) * minDist;
			let ty = Math.cos(angle) * minDist;
			return { vertex: new Point2D(tx, ty), distance: minDist };
		}
	}

	// 圆外一点`P(x,y)`到圆的切线`PQ1`与`PQ2`
	// 注意：
	// 计算过程中都在用以圆心作为新坐标系的原点，
	// 计算以圆心为顶点的角的角度；
	// 如果用以点P作为新坐标系的原点，计算以P为顶点的角的角度来计算，
	// 就要考虑到可考虑到圆在新的坐标系中不同象限时，
	// 三角函数诱导公式的变化与符号的变化。会更加复杂
	getVertexesFrom(x: number, y: number): Array<Point2D> {
		// 圆心`C`为新的坐标系的原点，计算射线`C->P`的长度
		let dx     = x - this.c.x;
		let dy     = y - this.c.y;
		let lenghCP = Math.sqrt(dx * dx + dy * dy);
		if (lenghCP < this.radius) { // 点在圆内，不存在切线
			return [];
		}
		// 圆心`C`为新的坐标系的原点，计算射线`C->P`的角度
		let angleCP  = Math.atan2(dy, dx);
		// let ca1 = Geo2DUtils.formatAngle(angleCP);
		// console.log(`${(new Date()).getUTCMilliseconds()}:
		// 	angleCP: ${NumUtil.toFixed(ca1.oriAgl, 3)} = ${NumUtil.toFixed(ca1.fmtAgl, 3)} = ` +
		// 	`${NumUtil.toFixed(ca1.oriDgr, 2)}° = ${NumUtil.toFixed(ca1.fmtDgr, 2)}°
		// 	`);
		//
		// 计算`C->Q1`和`C->Q2`这两个射线相对于与`C->P`的夹角后，
		let anglePCQ = Math.acos(this.radius / lenghCP);
		// let ca2 = Geo2DUtils.formatAngle(anglePCQ);
		// console.log(`${(new Date()).getUTCMilliseconds()}:
		// 	angle: ${NumUtil.toFixed(ca2.oriAgl, 3)} = ${NumUtil.toFixed(ca2.fmtAgl, 3)} = ` +
		// 	`${NumUtil.toFixed(ca2.oriDgr, 2)}° = ${NumUtil.toFixed(ca2.fmtDgr, 2)}°
		// 	`);
		//
		// 得到了`C->Q1`和`C->Q2`这两个射线相对于与`C->P`的夹角后，
		// 再加上`C->P`在坐标系中的角度`aCP`，
		// 就是`C->Q1`和`C->Q2`在整个坐标系中的角度：
		let anglePQ1 = angleCP - anglePCQ;
		let anglePQ2 = angleCP + anglePCQ;
		// 两个节点的坐标
		// 通过`aCQ1`和`aCQ2`的角度与圆的半径，
		// 可以得到`Q1`和`Q2`相对于圆心的坐标。
		// 然后再加上圆心在坐标系中的坐标就可以到`Q1`和`Q2`在坐标系中的坐标:
		let pos1   = new Point2D(this.c.x + this.radius * Math.cos(anglePQ1), this.c.y + this.radius * Math.sin(anglePQ1));
		let pos2   = new Point2D(this.c.x + this.radius * Math.cos(anglePQ2), this.c.y + this.radius * Math.sin(anglePQ2));
		return [pos1, pos2];
	}

}

export type IPoint2D = { readonly x: number, readonly y: number };
export class Point2D implements GeoCurve2D, IPoint2D {
	readonly x    : number;
	readonly y    : number;
	private center: Point2D | null;

	constructor(x: number, y: number) {
		this.x      = x;
		this.y      = y;
		this.center = null;
	}

	getCenter() {
		let center: Point2D = this.center == null ? new Point2D(this.x, this.y) : this.center;
		if (null == this.center) { this.center = center; }
		return center;
	}

	/**
	 * 返回图形的所有顶点
	 * 
	 * @returns 所有的顶点
	 */
	getVertex(): Array<Point2D> { return [this]; }

	getVertexesFrom(x: number, y: number): Array<Point2D> { return [this]; }

	/**
	 * 对于一个外部的点`(x,y)`，返回这个点到图形近的顶占和距离
	 * 
	 * @param x 外部点的坐标x
	 * @param y 外部点的坐标y
	 * @returns 最近的点`vertex`和距离`distancd`
	 */
	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number } {
		let n = Geo2DUtils.distanceP2P({ x: this.x, y: this.y }, { x: x, y: y });
		return { vertex: this.getCenter(), distance: n };
	}

	///**
	// * 对于一个外部的点`(x,y)`，返回这个点到图形近的顶占的射线
	// * 
	// * @param x 外部点的坐标x
	// * @param y 外部点的坐标y
	// * @param length 射线最大的长度
	// * 
	// * @returns 点到所有顶点的射线
	// */
	//getVertexRaysFrom(x: number, y: number): Array<{vertex:IPoint2D, ray: Ray2D}> {
	//	let point = { x: x, y: y };
	//	let quad = Geo2DUtils.quadOfPoint({ x: this.x - x, y: this.y - y });
	//	return [Geo2DUtils.calVtxDstAngle(point, this, quad)];
	//}

}

export type ILine2D = { readonly a: IPoint2D, readonly b: IPoint2D }
export class Line2D implements GeoPolygon2D, ILine2D {
	readonly a: Point2D;
	readonly b: Point2D;
	private readonly center: Point2D;

	constructor(a: IPoint2D, b: IPoint2D) {
		this.a = new Point2D(a.x, a.y);
		this.b = new Point2D(b.x, b.y);
		this.center = new Point2D( //
			Math.abs(this.a.x - this.b.x) / 2 + (this.a.x > this.b.x ? this.b.x : this.a.x), //
			Math.abs(this.a.y - this.b.y) / 2 + (this.a.y > this.b.y ? this.b.y : this.a.y));
	}

	getCenter() { return this.center; }

	getVertex(): Array<Point2D> { return [this.a, this.b]; }

	getVertexesFrom(x: number, y: number): Array<Point2D> { return [this.a, this.b]; }

	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number } {
		let l1 = Geo2DUtils.distanceP2P({ x: this.a.x, y: this.a.y }, { x: x, y: y });
		let l2 = Geo2DUtils.distanceP2P({ x: this.b.x, y: this.b.y }, { x: x, y: y });
		return l1 < l2 ? { vertex: this.a, distance: l1 } : { vertex: this.b, distance: l2 };
	}

	//getVertexRaysFrom(x: number, y: number): Array<Ray2D> {
	//	let point = { x: x, y: y };
	//	let quad = Geo2DUtils.quadOfLine({ a: { x: this.a.x - x, y: this.a.y - y }, b: { x: this.b.x - x, y: this.b.y - y } });
	//	return [Geo2DUtils.calVtxDstAngle(point, this.a, quad), Geo2DUtils.calVtxDstAngle(point, this.b, quad)];
	//}

}

export type IRay2D = {
	readonly start   : IPoint2D, // 起点
	readonly mid     : IPoint2D, // 经过的点
	readonly angle   : number,  // 角度
	readonly cAngle  : number, // 规范后的角度
	readonly angleStr: string, //
	readonly length  : number, // start 到 end 的距离
}
export class Ray2D implements GeoPolygon2D, IRay2D {
	readonly start   : IPoint2D; // 起点
	readonly mid     : IPoint2D; // 经过的点
	readonly angle   : number;  // 角度
	readonly cAngle  : number; // 规范后的角度
	readonly angleStr: string; //
	readonly length  : number; // start 到 mid 的距离
	private  center  : Point2D;

	constructor(start: IPoint2D, mid: IPoint2D) {
		this.start  = start;
		this.mid    = mid;
		this.center = new Point2D(start.x, start.y);
		let dx = start.x - mid.x;
		let dy = start.y - mid.y;
		this.angle  = Math.atan2(dy, dx);
		this.cAngle = this.angle < 0 ? Geo2DUtils.PI_DOUBLE + this.angle : this.angle;
		let ccg     = this.cAngle * 180 / Math.PI;
		this.angleStr = ``;
		// `(${NumUtil.toFixed(dx, 2)}, ${NumUtil.toFixed(dy, 2)})` +
		// 	` = ${NumUtil.toFixed(this.angle, 2)} = ${NumUtil.toFixed(this.cAngle, 2)}` +
		// 	` = ${NumUtil.toFixed(ccg, 2)}°`;
		this.length = Geo2DUtils.distanceP2P(start, mid);
	}

	getCenter(): Point2D { return this.center; }

	getVertex(): Array<Point2D> { return [this.center]; }

	getVertexesFrom(x: number, y: number): Array<Point2D> { return [this.center]; }

	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number, } {
		let n = Geo2DUtils.distanceP2P(this.center, { x: x, y: y });
		return { vertex: this.center, distance: n };
	}

	//getVertexRaysFrom(x: number, y: number): Array<Ray2D> {
	//	return [new Ray2D({ x: x, y: y }, this.center)];
	//}

}

export type IRectangle2D = { readonly x: number, readonly y: number, readonly width: number, readonly height: number }
export class Rectangle2D implements GeoPolygon2D, IRectangle2D {
	readonly x      : number;
	readonly y      : number;
	readonly width  : number;
	readonly height : number;

	private readonly center : Point2D;
	private readonly vertexs: Array<Point2D>;
	private readonly sides  : Array<Line2D>;

	constructor(x: number, y: number, width: number, height: number) {
		this.x      = x;
		this.y      = y;
		this.width  = width;
		this.height = height;
		this.center = new Point2D((this.x + this.width) / 2, (this.y + this.height) / 2);
		this.vertexs = [ //
			new Point2D(this.x             , this.y), //
			new Point2D(this.x + this.width, this.y), //
			new Point2D(this.x + this.width, this.y + this.height), //
			new Point2D(this.x             , this.y + this.height)  //
		];
		this.sides = [ //
			new Line2D(this.vertexs[0], this.vertexs[1]), //
			new Line2D(this.vertexs[1], this.vertexs[2]), //
			new Line2D(this.vertexs[2], this.vertexs[3]), //
			new Line2D(this.vertexs[3], this.vertexs[0])  //
		];
	}

	getCenter() { return this.center; }

	getVertex(): Array<Point2D> { return this.vertexs; }

	getVertexesFrom(x: number, y: number): Array<Point2D> { return this.vertexs; }

	getMostCloseVertex(x: number, y: number): { vertex: Point2D, distance: number } {
		let pt = this.vertexs[0];
		let md = Geo2DUtils.distanceP2P({ x: x, y: y }, pt);
		for (let i = 1; i < this.vertexs.length; i++) {
			let nd = Geo2DUtils.distanceP2P({ x: x, y: y }, this.vertexs[i]);
			if (md > nd) {
				pt = this.vertexs[i];
				md = nd;
			}
		}
		return { vertex: pt, distance: md };
	}

	//getVertexRaysFrom(x: number, y: number): Array<Ray2D> {
	//	let point = { x: x, y: y };
	//	let quad = 0b0000;
	//	quad = quad | Geo2DUtils.quadOfLine({ a: { x: this.vertexs[0].x - x, y: this.vertexs[0].y - y }, b: { x: this.vertexs[1].x - x, y: this.vertexs[1].y - y } });
	//	quad = quad | Geo2DUtils.quadOfLine({ a: { x: this.vertexs[1].x - x, y: this.vertexs[1].y - y }, b: { x: this.vertexs[2].x - x, y: this.vertexs[2].y - y } });
	//	quad = quad | Geo2DUtils.quadOfLine({ a: { x: this.vertexs[2].x - x, y: this.vertexs[2].y - y }, b: { x: this.vertexs[3].x - x, y: this.vertexs[3].y - y } });
	//	return [ //
	//		Geo2DUtils.calVtxDstAngle(point, this.vertexs[0], quad),
	//		Geo2DUtils.calVtxDstAngle(point, this.vertexs[1], quad),
	//		Geo2DUtils.calVtxDstAngle(point, this.vertexs[2], quad),
	//		Geo2DUtils.calVtxDstAngle(point, this.vertexs[3], quad)];
	//}

}

/**
 * Quadrant position
 * 代表点在直角坐标系中的位置，四个bit代表四个象限。
 * 因为绘图默认顺时针方向画，
 * 所以为了计算方便坐标轴上的点并入顺时钟方向的象限中。
 * 比如X轴正方向上的点，都同时属于第一与第四象限。
 */
export enum QuadPos {
	/** 第一象限 */ QUAD_1ST   = 0b0001,
	/** 第二象限 */ QUAD_2ND   = 0b0010,
	/** 第三象限 */ QUAD_3RD   = 0b0100,
	/** 第四象限 */ QUAD_4TH   = 0b1000,
	/** 原点    */ ORIG_PNT   = 0b1111,
	/** X轴正   */ AXIS_X_POS = 0b1001,
	/** X轴负   */ AXIS_X_NAG = 0b0110,
	/** Y轴正   */ AXIS_Y_POS = 0b0011,
	/** Y轴负   */ AXIS_Y_NAG = 0b1100,
}

export interface IAngle {
	oriAgl: number;
	fmtAgl: number;
	oriDgr: number;
	fmtDgr: number;

	// this.cAngle = this.angle < 0 ? Geo2DUtils.PI_DOUBLE + this.angle : this.angle;
	// let ccg = this.cAngle * 180 / Math.PI;
	// this.angleStr = ``;
}

export interface IRevolveOption {
	start: number;
	end  : number;
	diff : number;
}

export namespace Geo2DUtils {
	export const PI_HALF     = Math.PI / 2;
	export const PI_ONE_HALF = Math.PI + PI_HALF;
	export const PI_DOUBLE   = Math.PI * 2;

	export function formatAngle(angle: number): IAngle {
		let fmtAgl = angle < 0 ? Geo2DUtils.PI_DOUBLE + angle : angle;
		let oriDgr = angle * 180 / Math.PI;
		let fmtDgr = fmtAgl * 180 / Math.PI;
		return { oriAgl: angle, fmtAgl: fmtAgl, oriDgr: oriDgr, fmtDgr: fmtDgr };
	}

	export function formatAngleStr(angle: number): string {
		let agl = formatAngle(angle);
		return `angle: ${NumUtil.toFixed(agl.oriAgl, 3)} = ${NumUtil.toFixed(agl.fmtAgl, 3)} = ` +
			`${NumUtil.toFixed(agl.oriDgr, 2)}° = ${NumUtil.toFixed(agl.fmtDgr, 2)}°`;
	}

	/**
	 * 计算两点的距离
	 * @param a point 
	 * @param b point
	 * @returns size
	 */
	export function distanceP2P(a: IPoint2D, b: IPoint2D): number {
		let g = a.x - b.x;
		let j = a.y - b.y;
		return Math.sqrt(g * g + j * j);
	}

	/**
	 * 判断点p是在线段line左边还是右边的
	 * @param line line
	 * @param p point
	 * @returns  result > 0为左， < 0为右， =0为线上
	 */
	export function pointOfLineSide(line: ILine2D, p: IPoint2D): number {
		return (line.a.y - line.b.y) * p.x + // 
			(line.b.x - line.a.x) * p.y + line.a.x * line.a.y - //
			line.b.x * line.a.y;
	}

	/*  */
	/**
	 * 判断点p在线段line 的垂直交点
	 * @param line line
	 * @param p point
	 * @returns point
	 */
	export function pointToLine(line: ILine2D, p: IPoint2D): Point2D {
		if (line.a.x == line.b.x && line.a.y == line.b.y) {
			return new Point2D(line.a.x, line.b.y);
		} else if (line.a.x == line.b.x) {
			return new Point2D(line.a.x, p.y);
		} else if (line.a.y == line.b.y) {
			return new Point2D(p.x, line.a.y);
		} else {
			let a = p.x - line.a.x;
			let b = p.y - line.a.y;
			let c = line.b.x - line.a.x;
			let d = line.b.y - line.a.y;

			let dot = a * c + b * d;
			let lenSq = c * c + d * d;
			let param = dot / lenSq;

			if (param < 0) {
				return new Point2D(line.a.x, line.a.y);
			} else if (param > 1) {
				return new Point2D(line.b.x, line.b.y);
			} else {
				return new Point2D(line.a.x + param * c, line.a.y + param * d);
			}
		}
	}

	/**
	 * 计算点到线段的距离
	 * @param line line
	 * @param p point
	 * @returns distance
	 */
	export function pointToLineDistence(line: ILine2D, p: IPoint2D): number {
		let q = pointToLine(line, p);
		return distanceP2P(p, q);
	}

	/**
	 * 检查两条线段a-b与c-d是否相交，交点的坐标
	 * @param line1 line1
	 * @param line2 line2
	 * @returns 是否相交，如果相交就返回交点的坐标
	 */
	export function segmentsIntr(line1: ILine2D, line2: ILine2D): boolean | Point2D {
		let isCross: boolean = false;
		let x = 0;
		let y = 0;

		// 三角形abc 面积的2倍 
		let area_abc = (line1.a.x - line2.a.x) * (line1.b.y - line2.a.y) - (line1.a.y - line2.a.y) * (line1.b.x - line2.a.x);
		// 三角形abd 面积的2倍 
		let area_abd = (line1.a.x - line2.b.x) * (line1.b.y - line2.b.y) - (line1.a.y - line2.b.y) * (line1.b.x - line2.b.x);
		// 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理); 
		if (area_abc * area_abd > -1) {
			return false;
		}

		// 三角形cda 面积的2倍 
		let area_cda = (line2.a.x - line1.a.x) * (line2.b.y - line1.a.y) - (line2.a.y - line1.a.y) * (line2.b.x - line1.a.x);
		// 三角形cdb 面积的2倍 
		// 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出. 
		let area_cdb = area_cda + area_abc - area_abd;
		if (area_cda * area_cdb > -1) {
			return false;
		}

		//计算交点坐标 
		let t = area_cda / (area_abd - area_abc);
		let dx = Math.round(t * (line1.b.x - line1.a.x));
		let dy = Math.round(t * (line1.b.y - line1.a.y));
		return new Point2D(line1.a.x + dx, line1.a.y + dy);
	}

	/**
	 * 判断一点在第几象限。
	 * 因为绘图默认顺时针方向画，
	 * 所以为了计算方便坐标轴上的点并入顺时钟方向的象限中
	 * @param p point
	 * @returns location
	 */
	export function quadOfPoint(p: IPoint2D): QuadPos {
		if      (p.x >  0 && p.y >  0) { return QuadPos.QUAD_1ST  ; }
		else if (p.x <  0 && p.y >  0) { return QuadPos.QUAD_2ND  ; }
		else if (p.x <  0 && p.y <  0) { return QuadPos.QUAD_3RD  ; }
		else if (p.x >  0 && p.y <  0) { return QuadPos.QUAD_4TH  ; }
		else if (p.x == 0 && p.y == 0) { return QuadPos.ORIG_PNT  ; }
		else if (p.x >  0 && p.y == 0) { return QuadPos.AXIS_X_POS; }
		else if (p.x <  0 && p.y == 0) { return QuadPos.AXIS_X_NAG; }
		else if (p.x == 0 && p.y >  0) { return QuadPos.AXIS_Y_POS; }
		else /*if (x == 0 && y < 0) */ { return QuadPos.AXIS_Y_NAG; }
	}

	/**
	 * 判断线段经过哪几个象限
	 * 
	 * 方程组：
	 * 
	 * ``` 
	 * l.a.y = k * l.a.x + b
	 * l.b.y = k * l.b.x + b
	 * ``` 
	 * 
	 * 推得：
	 * 
	 * ``` 
	 * let k = (l.a.y - l.b.y) / (l.a.x - l.b.x);
	 * let b = (l.a.x * l.b.y - l.b.x * l.a.y) / (l.a.x - l.b.x);
	 * ```
	 * 
	 * @param l line
	 * 
	 * @returns location
	 * 
	 */
	export function quadOfLine(line: ILine2D): QuadPos {
		// x1 = l.a.x
		// y1 = l.a.y
		// x2 = l.b.x
		// y2 = l.b.y
		let quadP1 = quadOfPoint(line.a) as number;
		let quadP2 = quadOfPoint(line.b) as number;

		let quad: number = quadP1 | quadP2;

		if (quadP1 == quadP2) { // 线段两端点在同一象限
			// do nothing
		} else {
			let diffX = line.a.x == line.b.x ? 1 : line.a.x - line.b.x;
			let k = (line.a.y - line.b.y) / diffX;
			let b = (line.a.x * line.b.y - line.b.x * line.a.y) / diffX;

			if      (k > 0 && b > 0) { quad = 0b0010 | quad; } // 函数过 1, 2, 3 象限
			else if (k > 0 && b < 0) { quad = 0b1000 | quad; } // 函数过 1, 3, 4 象限
			else if (k < 0 && b > 0) { quad = 0b0001 | quad; } // 函数过 1, 2, 4 象限
			else if (k < 0 && b < 0) { quad = 0b0100 | quad; } // 函数过 2, 3, 4 象限
		}
		// console.log(`line: (${x1},${y1})->${x2},${y2}) : 0b${quad.toString(2)}`);
		return quad as QuadPos;
	}

	export function setRayLength(ray: IRay2D, length: number): Ray2D {
		let x = Math.cos(ray.angle + Math.PI) * length + ray.start.x;
		let y = Math.sin(ray.angle + Math.PI) * length + ray.start.y;
		// { start: ray.start, mid: {x:x,y:y}, // 
		// 	angle: ray.angle, cAngle: ray.cAngle, length: length };
		return new Ray2D(ray.start, { x: x, y: y });
	}

	export function calRayByPoints(start: IPoint2D, mid: IPoint2D, quad: number): Ray2D {
		return new Ray2D(start, mid);
	}

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param shape 
	 * @param length 
	 * @returns 
	 */
	export function genVertexRaysFrom(x: number, y: number, shape: GeoShape2D, length?: number): 
		Array<{ vertex: Point2D, ray: Ray2D }> //
	{
		let results: Array<{ vertex: Point2D, ray: Ray2D }> = [];
		let vertexes = shape.getVertexesFrom(x, y);
		for (let i = 0; i < vertexes.length; i++) {
			let ray = new Ray2D({ x: x, y: y }, vertexes[i]);
			ray = length ? setRayLength(ray, length) : ray;
			results.push({ vertex: vertexes[i], ray: ray });
		}
		return results;
	}

	//export function calVtxDstAngle(start: IPoint2D, mid: IPoint2D, quad: number): Ray2D {
	//	return new Ray2D(start, mid);
	//}

	//export function filterObstacleRaysNew(rays: Array<IRay2D>): Array<Ray2D> {
	//	let results: Array<Ray2D> = [];
	//	// 找到角度最大的点与最小的点
	//	let min = rays[0];
	//	let max = rays[0];
	//	for (let i = 1; i < rays.length; i++) {
	//		let curr = rays[i];
	//		if (curr.cAngle < min.cAngle) { min = curr; }
	//		if (curr.cAngle > max.cAngle) { max = curr }
	//	}
	//	return results;
	//}

	/**
	 * 对于一个外部的点，它到指定的图形每个顶点会有对应的多条射线`rays`。
	 * 在所有的`rays`中找到两条切线。
	 * 
	 * @param rays 所有的射线
	 * @returns 返回切线
	 */
	export function filterObstacleRays(rays: Array<IRay2D>): Array<Ray2D> {
		let results: Array<Ray2D> = [];
		// 找到角度最大的点与最小的点
		let minIdx = 0;
		let maxIdx = 0;
		for (let i = 1; i < rays.length; i++) {
			if (rays[i].cAngle < rays[minIdx].cAngle) { minIdx = i; }
			if (rays[i].cAngle > rays[maxIdx].cAngle) { maxIdx = i; }
		}

		// 从角度最小的顶点顺时针遍历到角度最大的顶点
		// 就是所有面向外部点的顶点
		let loopStart = minIdx > maxIdx ? minIdx     : rays.length + minIdx;
		let loopEnd   = maxIdx > -1     ? maxIdx - 1 : rays.length - 1     ;
		for (let i = loopStart; i > loopEnd; i--) {
			let idx = i < rays.length ? i : i - rays.length;
			let rr = rays[idx];
			results.push(new Ray2D(rr.start, rr.mid));
		}
		return results;
	}

	///**
	// * 两条点到图形的切线，用线段表示
	// * 
	// * @param x 点的坐标x
	// * @param y 点的坐标y
	// * @param length 线段的长度
	// * @param rays 多条射线
	// * @returns 返回两条切线的线段
	// */
	//export function genTengentRays(x: number, y: number, geo2D: GeoShape2D, length: number): Array<Ray2D> {
	//	// 注意三角函数使用时的坐标
	//	// 数学上的坐标轴第一象限的原点在左下角
	//	// 在Canvas画布上，原点在左上角
	//	let rayArr: Array<Ray2D> = geo2D.getVertexRaysFrom(x, y);
	//	let rays = filterObstacleRays(rayArr);
	//	let result: Array<Ray2D> = [];

	//	if (rays && rays.length > 0) {
	//		for (let i = 0; i < rays.length; i++) {
	//			result.push(Geo2DUtils.setRayLength(rays[i], length));
	//		}
	//	}
	//	// for (let i = 0; i < rays.length; i++) {
	//	// 	let endX = x + Math.round(length * Math.cos(rays[i].angle));
	//	// 	let endY = y + Math.round(length * Math.sin(rays[i].angle));
	//	// 	result.push(new Line2D({ x: x, y: y }, { x: endX, y: endY }));
	//	// }
	//	return result;
	//}

	/**
	 * 以`c`为圆心，计算以`c`为端点并且经过`start`点的射线旋转到
	 * `end`这一点的位置后，开始的角度与结束的角度。
	 * 
	 * @param c 圆心
	 * @param start 开始
	 * @param end 结束
	 */
	export function revolveRay(c: IPoint2D, startPoint: IPoint2D, endPoint: IPoint2D): IRevolveOption {
		let d1 = { x: startPoint.x - c.x, y: startPoint.y - c.y };
		let d2 = { x: endPoint.x   - c.x, y: endPoint.y   - c.y };
		let startAngle = Math.atan2(d1.y, d1.x);
		let endAngle   = Math.atan2(d2.y, d2.x);
		let diffAngle  = endAngle - startAngle;

		if (d1.x * d2.x < 0 && d1.y * d2.y < 0) {
			// 跨三个象限
			if (checkPointLineSide({ a: startPoint, b: endPoint }, c) > 0) {
				if (d1.y < 0 && d2.y > 0) {
					// 从三四象限到一二象限
					diffAngle = diffAngle - PI_DOUBLE;
				} else if (d1.y > 0 && d2.y < 0) {
					// 从一二象限三四象限
					diffAngle = diffAngle + PI_DOUBLE;
				}
			}
		} else if (d1.x < 0 && d2.x < 0) {
			// 跨第一第四象限
			if (d1.y < 0 && d2.y > 0) {
				// 从第四象限到第一象限
				diffAngle = diffAngle - PI_DOUBLE;
			} else if (d1.y > 0 && d2.y < 0) {
				// 从第一象限第四象限
				diffAngle = diffAngle + PI_DOUBLE;
			}
		}
// 		let ca = formatAngle(diffAngle);
// 		let side = checkPointLineSide({ a: startPoint, b: endPoint }, c);
//		console.log(`${(new Date()).getUTCMilliseconds()} 
//=================================================================================	
//		 side ${NumUtil.toFixed(side, 2)} ` +
//			`revolv ${NumUtil.toFixed(d1.x, 3)}, ${NumUtil.toFixed(d1.y, 3)} ` +
//			`to ${NumUtil.toFixed(d2.x, 3)},${NumUtil.toFixed(d2.y, 3)} ` +
//			`angle: ${NumUtil.toFixed(diffAngle, 3)} = ${NumUtil.toFixed(ca.fmtAgl, 2)} = ` +
//			`${NumUtil.toFixed(ca.oriDgr, 2)}° = ${NumUtil.toFixed(ca.fmtDgr, 2)}° 
//=================================================================================	
//			`);

		return { start: startAngle, end: endAngle, diff: diffAngle };
	}

	export function checkPointLineSide(line: ILine2D, p: IPoint2D): number {
		//console.log(`--------------------------------${(new Date()).getMilliseconds()}`)
		let side = 0;
		let ll = line.b.y < line.a.y ? { a: line.b, b: line.a } : line;
		let angleAB = Math.atan2(ll.b.y - ll.a.y, ll.b.x - ll.a.x);
		//console.log(`line angle: ${formatAngleStr(angle)}`);
		if (ll.a.y < p.y && p.y < ll.b.y) {
			let angleAP = Math.atan2(p.y - ll.a.y, p.x - ll.a.x);
			//console.log(`point angle: ${formatAngleStr(ac)}`);
			//console.log(`diff angle: ${formatAngleStr(diffAngle)}`);
			side = angleAB - angleAP;
		} else if (p.y < ll.a.y) {
			let cx = ll.a.x - ((ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (ll.a.y - p.y))
			side = p.x - cx; 
		} else if (ll.b.y < p.y) {
			let cx = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (p.y - ll.a.y) - ll.a.x;
			side = p.x - cx;
		}
		//console.log(`--------------------------------${(new Date()).getMilliseconds()}`)
		return side;
	}

}
