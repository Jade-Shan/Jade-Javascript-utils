import { Geo2DUtils, Point2D, Line2D, Rectangle2D, Ray2D, Circle2D } from './geo2d.js';
import { WebUtil } from '../web.js';
/**
 * Canvas 2D 绘图工具集
 *
 * 提供线段、射线、点、矩形、圆、扇形等常用图形的绘制封装。
 */
export var CanvasUtils;
(function (CanvasUtils) {
    /**
     * 下载canvas所转的图片
     * @param cvsElem canvas element
     * @param type image type
     * @param filename file name
     */
    CanvasUtils.downloadCanvasImage = (cvsElem, type, filename) => {
        const fileType = type && type.length > 2 ? type.toLowerCase() : 'png';
        const mimeType = `image/${fileType}`;
        const fileName = filename ? filename : `download-${(new Date()).getTime()}.${fileType}`;
        cvsElem.toBlob((blob) => {
            if (blob) {
                WebUtil.downloadBlob(blob, fileName);
            }
        }, mimeType);
    };
    /**
     * 内部通用绘制函数：应用样式、执行绘制、处理裁剪/填充
     */
    let drawWithCanvas = (cvsCtx, // 
    func, style //
    ) => {
        var _a;
        cvsCtx.save();
        if (style === null || style === void 0 ? void 0 : style.lineWidth) {
            cvsCtx.lineWidth = style.lineWidth;
        }
        if (style === null || style === void 0 ? void 0 : style.strokeStyle) {
            cvsCtx.strokeStyle = style.strokeStyle;
        }
        if (style === null || style === void 0 ? void 0 : style.fillStyle) {
            cvsCtx.fillStyle = style.fillStyle;
        }
        cvsCtx.beginPath();
        func(cvsCtx);
        if ((_a = style === null || style === void 0 ? void 0 : style.imgClip) === null || _a === void 0 ? void 0 : _a.imageElem) {
            if ((style === null || style === void 0 ? void 0 : style.lineWidth) && style.lineWidth > 0) {
                cvsCtx.stroke();
            }
            cvsCtx.clip();
            cvsCtx.drawImage(style.imgClip.imageElem, style.imgClip.sx, style.imgClip.sy, //
            style.imgClip.width, style.imgClip.height, //
            style.imgClip.sx, style.imgClip.sy, //
            style.imgClip.width, style.imgClip.height);
        }
        else {
            if ((style === null || style === void 0 ? void 0 : style.lineWidth) && style.lineWidth > 0) {
                cvsCtx.stroke();
            }
            if (style === null || style === void 0 ? void 0 : style.fillStyle) {
                cvsCtx.fill();
            }
        }
        cvsCtx.restore();
    };
    /**
     * 绘制弧线
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param center - 圆心
     * @param radius - 半径
     * @param revole - 旋转参数（起始角、结束角、角度差）
     * @param style - 绘制样式
     * @returns {void}
     */
    CanvasUtils.drawArc = (cvsCtx, //
    center, radius, revole, style //
    ) => {
        drawWithCanvas(cvsCtx, (cvsCtx) => {
            cvsCtx.arc(center.x, center.y, radius, revole.start, revole.end, revole.diff < 0);
        }, style);
    };
    /**
     * 画一条线段
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param line - Canvas 线段对象
     * @returns {void}
     */
    CanvasUtils.drawLine = (cvsCtx, line) => {
        cvsCtx.save();
        cvsCtx.strokeStyle = line.strokeStyle;
        cvsCtx.lineWidth = line.lineWidth;
        if (line.lineCap) {
            cvsCtx.lineCap = line.lineCap;
        }
        if (line.lineJoin) {
            cvsCtx.lineJoin = line.lineJoin;
        }
        cvsCtx.beginPath();
        cvsCtx.moveTo(line.a.x, line.a.y);
        cvsCtx.lineTo(line.b.x, line.b.y);
        cvsCtx.stroke();
        cvsCtx.restore();
    };
    /**
     * 绘制多条线段
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param lines - Canvas 线段数组
     * @returns {void}
     */
    CanvasUtils.drawLines = (cvsCtx, lines) => {
        if (lines && lines.length > 0) {
            for (let i = 0; i < lines.length; i++) {
                CanvasUtils.drawLine(cvsCtx, lines[i]);
            }
        }
    };
    /**
     * 绘制一条射线
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param ray - Canvas 射线对象
     * @returns {void}
     */
    CanvasUtils.drawRay = (cvsCtx, ray) => {
        CanvasUtils.drawLine(cvsCtx, {
            a: ray.start, b: ray.mid, //
            lineWidth: ray.lineWidth, strokeStyle: ray.strokeStyle, //
            lineCap: ray.lineCap, lineJoin: ray.lineJoin
        });
    };
    /**
     * 绘制多条射线
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param rays - Canvas 射线数组
     * @returns {void}
     */
    CanvasUtils.drawRays = (cvsCtx, rays) => {
        if (rays && rays.length > 0) {
            for (let i = 0; i < rays.length; i++) {
                CanvasUtils.drawRay(cvsCtx, rays[i]);
            }
        }
    };
    /**
     * 绘制一个点（实心圆）
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param point - Canvas 点对象
     * @returns {void}
     */
    CanvasUtils.drawPoint = (cvsCtx, point) => {
        cvsCtx.save();
        cvsCtx.fillStyle = point.fillStyle;
        cvsCtx.beginPath();
        cvsCtx.arc(point.x, point.y, point.radius, 0, Geo2DUtils.PI_DOUBLE, true);
        cvsCtx.fill();
        cvsCtx.restore();
    };
    /**
     * 绘制多个点
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param points - Canvas 点数组
     * @returns {void}
     */
    CanvasUtils.drawPoints = (cvsCtx, points) => {
        if (points && points.length > 0) {
            for (let i = 0; i < points.length; i++) {
                CanvasUtils.drawPoint(cvsCtx, points[i]);
            }
        }
    };
    /**
     * 绘制矩形
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param rect - Canvas 矩形对象
     * @returns {void}
     */
    CanvasUtils.drawRectangle = (cvsCtx, rect) => {
        cvsCtx.save();
        if (rect.fillStyle && rect.fillStyle.length > 0) {
            cvsCtx.fillStyle = rect.fillStyle;
            cvsCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
        if (rect.lineWidth > 0) {
            cvsCtx.strokeStyle = rect.strokeStyle;
            cvsCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
        cvsCtx.restore();
    };
    /**
     * 绘制圆形
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param circle - Canvas 圆形对象
     * @returns {void}
     */
    CanvasUtils.drawCircle = (cvsCtx, circle) => {
        cvsCtx.save();
        cvsCtx.beginPath();
        cvsCtx.arc(circle.c.x, circle.c.y, circle.radius, 0, Geo2DUtils.PI_DOUBLE, false);
        if (circle.fillStyle && circle.fillStyle.length > 0) {
            cvsCtx.fillStyle = circle.fillStyle;
            cvsCtx.fill();
        }
        if (circle.lineWidth > 0) {
            cvsCtx.strokeStyle = circle.strokeStyle;
            cvsCtx.stroke();
        }
        cvsCtx.restore();
    };
    /**
     * 从多边形生成 Canvas 点数组（用于绘制顶点）
     *
     * @param shape - 多边形对象
     * @param radius - 点的半径
     * @param fillStyle - 点的填充颜色
     * @returns {Array<CanvasPoint2D>} 顶点对应的 Canvas 点数组
     */
    CanvasUtils.genVertexes = (shape, radius, fillStyle) => //
     {
        let result = [];
        let vtxs = shape.getVertex();
        if (vtxs && vtxs.length > 0) {
            for (let i = 0; i < vtxs.length; i++) {
                let vtx = vtxs[i];
                result.push(new CanvasPoint2D(vtx.x, vtx.y, radius, fillStyle));
            }
        }
        return result;
    };
    /**
     * 绘制几何图形的所有顶点
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param shape - 多边形对象
     * @param radius - 顶点半径
     * @param fillStyle - 填充颜色
     * @returns {void}
     */
    CanvasUtils.drawShapeVertexes = (cvsCtx, //
    shape, radius, fillStyle) => //
     {
        let vtxs = CanvasUtils.genVertexes(shape, radius, fillStyle);
        CanvasUtils.drawPoints(cvsCtx, vtxs);
    };
    /**
     * 绘制从外部点到图形各顶点的射线
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param x - 外部点的 X 坐标
     * @param y - 外部点的 Y 坐标
     * @param shape - 目标几何图形
     * @param length - 射线长度
     * @param lineWidth - 线宽
     * @param strokeStyle - 描边颜色
     * @returns {void}
     */
    CanvasUtils.drawVertexRaysFrom = (cvsCtx, x, y, shape, //
    length, lineWidth, strokeStyle) => //
     {
        let vtxRays = Geo2DUtils.genVertexRaysFrom(x, y, shape, length);
        if (vtxRays && vtxRays.length > 0) {
            for (let i = 0; i < vtxRays.length; i++) {
                let ray = vtxRays[i].ray;
                CanvasUtils.drawLine(cvsCtx, {
                    a: ray.start, b: ray.mid,
                    lineWidth, strokeStyle
                });
            }
        }
    };
    /**
     * 绘制从外部点到图形的阴影扇形区域
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param x - 外部点的 X 坐标
     * @param y - 外部点的 Y 坐标
     * @param shape - 目标几何图形
     * @param length - 射线长度
     * @param style - 绘制样式
     * @returns {void}
     */
    CanvasUtils.drawVertexShadowFrom = (cvsCtx, x, y, shape, //
    length, style) => //
     {
        let vtxRays = Geo2DUtils.genVertexRaysFrom(x, y, shape, length);
        if (vtxRays && vtxRays.length < 2) {
            return;
        }
        for (let i = 0; i < vtxRays.length - 1; i++) {
            CanvasUtils.drawFanByRays(cvsCtx, vtxRays[i], vtxRays[i + 1], style);
        }
        CanvasUtils.drawFanByRays(cvsCtx, vtxRays[vtxRays.length - 1], vtxRays[0], style);
    };
    /**
     * 以两条射线为边界绘制扇形
     *
     * @param cvsCtx - Canvas 2D 上下文
     * @param start - 起始射线
     * @param end - 结束射线
     * @param style - 绘制样式
     * @returns {void}
     */
    CanvasUtils.drawFanByRays = (cvsCtx, //
    start, end, style) => //
     {
        let revole = Geo2DUtils.revolveRay(start.ray.start, start.ray.mid, end.ray.mid);
        drawWithCanvas(cvsCtx, (cvsCtx) => {
            // 因为Canvas的原点坐标是在左上角，所以顺时钟和逆时钟的方向和笛卡尔坐标系是反的
            cvsCtx.arc(start.ray.start.x, start.ray.start.y, start.ray.length, revole.start, revole.end, revole.diff < 0);
            cvsCtx.lineTo(end.vertex.x, end.vertex.y);
            cvsCtx.lineTo(start.vertex.x, start.vertex.y);
        }, style);
    };
})(CanvasUtils || (CanvasUtils = {}));
/**
 * 2D Canvas 点
 *
 * 继承 Point2D，添加绘制时所需的半径和填充颜色。
 */
export class CanvasPoint2D extends Point2D //
 {
    /**
     * @param x - X 坐标
     * @param y - Y 坐标
     * @param radius - 绘制半径
     * @param fillStyle - 填充颜色
     */
    constructor(x, y, radius, fillStyle) {
        super(x, y);
        this.radius = radius;
        this.fillStyle = fillStyle;
    }
    /**
     * 从接口类型构造 CanvasPoint2D 实例
     * @param point - 点的只读接口
     * @returns {CanvasPoint2D}
     */
    static from(point) {
        return new CanvasPoint2D(point.x, point.y, point.radius, point.fillStyle);
    }
}
/**
 * 2D Canvas 线段
 *
 * 继承 Line2D，添加绘制时所需的线宽和描边颜色。
 */
export class CanvasLine2D extends Line2D {
    /**
     * @param a - 端点 A
     * @param b - 端点 B
     * @param lineWidth - 线宽
     * @param strokeStyle - 描边颜色
     */
    constructor(a, b, lineWidth, strokeStyle) {
        super(a, b);
        this.strokeStyle = strokeStyle;
        this.lineWidth = lineWidth;
    }
    /**
     * 从接口类型构造 CanvasLine2D 实例
     * @param line - 线段的只读接口
     * @returns {CanvasLine2D}
     */
    static from(line) {
        return new CanvasLine2D(line.a, line.b, line.lineWidth, line.strokeStyle);
    }
}
/**
 * 2D Canvas 射线
 *
 * 继承 Ray2D，添加绘制时所需的线宽和描边颜色。
 */
export class CanvasRay2D extends Ray2D {
    /**
     * @param start - 射线起点
     * @param mid - 射线经过的点
     * @param lineWidth - 线宽
     * @param strokeStyle - 描边颜色
     */
    constructor(start, mid, lineWidth, strokeStyle) {
        super(start, mid);
        this.strokeStyle = strokeStyle;
        this.lineWidth = lineWidth;
    }
}
/**
 * 2D Canvas 矩形
 *
 * 继承 Rectangle2D，添加绘制时所需的线宽、描边和填充颜色。
 */
export class CanvasRectangle2D extends Rectangle2D //
 {
    /**
     * @param x - 左上角 X 坐标
     * @param y - 左上角 Y 坐标
     * @param width - 宽度
     * @param height - 高度
     * @param lineWidth - 线宽
     * @param strokeStyle - 描边颜色
     * @param fillStyle - 填充颜色
     */
    constructor(x, y, width, height, //
    lineWidth, strokeStyle, fillStyle) {
        super(x, y, width, height);
        this.lineWidth = lineWidth;
        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;
    }
    /**
     * 从接口类型构造 CanvasRectangle2D 实例
     * @param rect - 矩形的只读接口
     * @returns {CanvasRectangle2D}
     */
    static from(rect) {
        return new CanvasRectangle2D(rect.x, rect.y, rect.width, rect.height, //
        rect.lineWidth, rect.strokeStyle, rect.fillStyle);
    }
}
/**
 * 2D Canvas 圆形
 *
 * 继承 Circle2D，添加绘制时所需的线宽、描边和填充颜色。
 */
export class CanvasCircle2D extends Circle2D // 
 {
    /**
     * @param x - 圆心 X 坐标
     * @param y - 圆心 Y 坐标
     * @param radius - 半径
     * @param lineWidth - 线宽
     * @param strokeStyle - 描边颜色
     * @param fillStyle - 填充颜色
     */
    constructor(x, y, radius, lineWidth, strokeStyle, fillStyle) {
        super(x, y, radius);
        this.lineWidth = lineWidth;
        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;
    }
}
//# sourceMappingURL=canvas.js.map