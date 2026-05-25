2D几何工具
=================

三角函数备忘图
-----------------

![circ.angle](cric.tt01.png "sample image")

计算点到图形的切线
-----------------

### 点到圆的切线

圆外一点`P(x,y)`到圆的切线`PQ1`与`PQ2`

```javascript
Circle2D.getVertexesFrom(x: number, y: number): Array<Point2D>;
```
![sample-img](img-plt/geo/circ_cut_01.plt.png "sample image")

注意：

计算过程中都在用以圆心作为新坐标系的原点，
计算以圆心为顶点的角的角度；
如果用以点P作为新坐标系的原点，计算以P为顶点的角的角度来计算，
就要考虑到可考虑到圆在新的坐标系中不同象限时，
三角函数诱导公式的变化与符号的变化。会更加复杂。

步骤：

1. 计算线段 $dx$ 与 $dy$ 的长度分别为 $C.x - P.x$ 与 $C.y - P.y$ 。
	（注意：以圆心 $C$ 为起点）
2. 计算线段 $C \to P$ 的长度 $sqrt(dx^2 + dy^2)$ 。
3. 计算射线 $C \to P$ 的角度 $\alpha$ 等于 $arctan(dy, dx)$ 。
4. $C \to Q_1$ 和 $C \to Q_2$ 这两个射线与 $C \to P$ 的夹角 $\beta$
	分别为 $arcos(CQ / CP)$ ，等于 $arcos(r / CP)$ 。
5. 得到了 $\beta$ 这个 $C \to Q_1$ 和 $C \to Q_2$ 相对于 $C \to P$ 的夹角后，
	再加上 $C \to P$ 在坐标系中的角度 $\alpha$ ，
	就是 $C \to Q_1$ 和 $C \to Q_2$ 在整个坐标系中的角度：
	$\beta_1 = \alpha + \beta$ 和 $\beta_2 = \alpha - \beta$
6. 通过 $\beta_1$ 和 $\beta_2$ 的角度与圆的半径，
	可以得到 $Q_1$ 和 $Q_2$ 相对于圆心的坐标。
	然后再加上圆心在坐标系中的坐标就可以到`Q1`和`Q2`在坐标系中的坐标:
	* $Q_1:(c.x + r \cdot cos( \beta_1), c.y + r \cdot sin(\beta_1))$ ， 
	* $Q_2:(c.x + r \cdot cos( \beta_2), c.y + r \cdot sin(\beta_2))$

### 点到图形的切线

根据一个二维图形`shape`和外部的一点`P`，计算`P`与`shap`的两个切线的点`A`与`B`，再加上以`P`为起点的两条射线`P->A`与`P->B`：

```javascript
genVertexRaysFrom(
	x: number, y: number, shape: GeoShape2D, length?: number
): Array<{ vertex: Point2D, ray: Ray2D }>
```

### 计算点与线段的位置

```javascript
export function checkPointLineSide(
	line: ILine2D, p: IPoint2D
): number;
```

几种情况分别分析：

假设`A.y < B.y`的情况下，`(A.y < P.y) && (P.y < B.y)`：

![sample-img](img-plt/geo/point_side_line.01.plt.png "sample image")

* 如果`A->B`的角度大于`A->P`则说明点在线段的右方
* 如果`A->B`的角度小于`A->P`则说明点在线段的左方

假设`A.y < B.y`的情况下，`P.y < A.y`：

延长`B->A`到与`y=P.y`相交的点`C`

![sample-img](img-plt/geo/point_side_line.02.plt.png "sample image")


1. `(ll.a.x - c.x) / (ll.a.y - c.y) = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y)`
2. `(ll.a.x - c.x) = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (ll.a.y - c.y)`
3. `c.x = (ll.a.x - (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (ll.a.y - c.y))`
4. 因为`c.y = p.y`所以`c.x = ll.a.x - (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (ll.a.y - c.y)`

* 如果`c.x < a.x`则说明点在线段的右方
* 如果`c.x > a.x`则说明点在线段的左方

假设`A.y < B.y`的情况下，`P.y > B.y`：

延长`A->B`到与`y=P.y`相交的点`C`

![sample-img](img-plt/geo/point_side_line.03.plt.png "sample image")


1. `(c.x - ll.a.x) / (c.y - ll.a.y) = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y)`
2. `(c.x - ll.a.x) = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (c.y - ll.a.y)`
3. `c.x = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (c.y - ll.a.y) - ll.a.x`
4. 因为`c.y = p.y`所以`c.x = (ll.b.x - ll.a.x) / (ll.b.y - ll.a.y) * (p.y - ll.a.y) - ll.a.x`

* 如果`c.x < a.x`则说明点在线段的右方
* 如果`c.x > a.x`则说明点在线段的左方

还有另一种算法：

```javascript
// 在上下的情况也下直接算角度？没有看明白，
// 但跑出来的结果一样
if (p.y < ll.a.y || ll.b.y < p.y) {
	let n1 = (ll.b.x - ll.a.x) * (ll.b.y - ll.a.y);
	let n2 = ll.b.y - ll.a.y;
	let n3 = n1 / n2;
	let cx = ll.b.x - n3;
	let c = { x: cx, y: p.y };
	let c = { x: -ll.a.x, y: p.y };
	angleAP = Math.atan2(p.y - c.y, p.x - c.x);
}
```

### 计算旋转的角度

以点`C`为圆心，计算点`start`旋转到`end`的方向与角度：

* `c`：圆心，
* `start`：开始
* `end`：结束
* 返回：
	- `start`开始角度，
	- `end`结束角度，
	- `diff`旋转的角度

```javascript
export function revolveRay(
	c: IPoint2D, startPoint: IPoint2D, endPoint: IPoint2D
	): IRevolveOption;
```

![sample-img](img-plt/geo/rote_ray_01.plt.png "sample image")



常用类型
-----------------

[UML说明](https://plantuml.com/zh/class-diagram)

2D常用几何类型：

![sample-img](uml/out/geo2d/geo2d.svg "sample image")
