import { CanvasCircle2D, CanvasRectangle2D, CanvasUtils } from "./canvas.js";
import { JadeUIResource, DefaultIconGroup } from "./resource.js";
import { JadeWindowUI, UIDesktop, UIObj, UIWindowAdpt, WinParam } from "./UIWindow.js";

export namespace TestJadeUI {



	class TestWindow01 extends UIWindowAdpt {

		renderIn(): void {
			let renderWindowBody = (): HTMLDivElement => {
				let windowBody = this.ui.windowBody;
				windowBody.style.overflow = this.cfg.body.overflow;
				windowBody.innerHTML = `
			<p> There are just so many possibilities:</p>
			<ul>
				<li>A Task Manager</li>
				<li>A Notepad</li>
				<li>Or even a File Explorer!</li>
			</ul>

			<div class="sunken-panel" style="height: 120px; width: 240px;">
				<table class="interactive">
					<thead>
						<tr><th>Name</th><th>Version</th><th>Company</th></tr>
					</thead>
					<tbody>
						<tr><td>MySQL ODBC 3.51 Driver</td><td>3.51.11.00</td><td>MySQL AB</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
						<tr><td>SQL Server</td><td>3.70.06.23</td><td>Microsoft Corporation</td></tr>
					</tbody>
				</table>
			</div>
		`;
				return windowBody;
			}

			let renderStatusBar = (): HTMLDivElement => {
				let statusBar = document.createElement("div");
				statusBar.classList.add("status-bar");
				statusBar.innerHTML = `
			<p class="status-bar-field">Press F1 for help</p>
			<p class="status-bar-field">Slide 1</p>
			<p class="status-bar-field">CPU Usage: 14%</p>
		`;
				return statusBar;
			}
			JadeWindowUI.renderWindowTplt(this, renderWindowBody, renderStatusBar);
		}

	}




	export let testWindowUI = () => {
		//
		let desktop00 = document.getElementById(`test-desktop-00`);
		if (desktop00) {
			let desktop: UIDesktop = new UIDesktop(desktop00);
			for (let j = 0; j < 3; j++) {
				let win = new TestWindow01(desktop, `test-win-00-${j}`, `test win 00-${j}`);
				win.renderIn();
			}
		}
		//
		let icon01 = JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_FACE);
		console.log(icon01.x12);
		let icon02 = JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_BUG);
		console.log(icon02.x12);
		//
		let desktop01 = document.getElementById(`test-desktop-01`);
		if (desktop01) {
			let desktop: UIDesktop = new UIDesktop(desktop01, { dockBar: { range: 300, maxScale: 1.8 } });
			let win1 = new TestWindow01(desktop, `test-win-01-01`, `test win 01-01`, { icons: JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_FACE) });
			win1.renderIn();
			let win2 = new TestWindow01(desktop, `test-win-01-02`, `test win 01-02`, { icons: JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_BUG) });
			win2.renderIn();
			let win3 = new TestWindow01(desktop, `test-win-01-03`, `test win 01-03`, { icons: JadeUIResource.getDefaultIcon(DefaultIconGroup.CAMERA), scalable: false });
			win3.renderIn();
		}
		//
	}

	class TestCanvasWindow extends UIWindowAdpt {

		canvas: HTMLCanvasElement = document.createElement("canvas");

		constructor(desktop: UIDesktop, id: string, title: string, cfg?: WinParam) {
			super(desktop, id, title, cfg);
			this.canvas.id = `canvas-${id}`;
			this.canvas.width = 1600;
			this.canvas.height = 600;
			this.canvas.style.width  = `1600px`;
			this.canvas.style.height = `600px`;
		}

		renderIn(): void {
			let renderWindowBody = (): HTMLDivElement => {
				let windowBody = this.ui.windowBody;
				windowBody.style.overflow = this.cfg.body.overflow;
				windowBody.style.width  = `${this.cfg.body.initSize.width }px`;
				windowBody.style.height = `${this.cfg.body.initSize.height}px`;
				windowBody.style.overflowX = 'auto';
				windowBody.style.overflowY = 'auto';
				windowBody.appendChild(this.canvas);
				return windowBody;
			}

			let renderStatusBar = (): HTMLDivElement => {
				let statusBar = document.createElement("div");
				statusBar.classList.add("status-bar");
				statusBar.innerHTML = `
					<p class="status-bar-field">Press F1 for help</p>
					<p class="status-bar-field">Slide 1</p>
					<p class="status-bar-field">canvas for map</p>
				`;
				return statusBar;
			}
			JadeWindowUI.renderWindowTplt(this, renderWindowBody, renderStatusBar);
		}

	}



	export let testCanvasWindow = () => {
		//
		//
		let icon01 = JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_FACE);
		console.log(icon01.x12);
		let icon02 = JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_BUG);
		console.log(icon02.x12);
		//
		let desktop01 = document.getElementById(`test-desktop-02`);
		if (desktop01) {
			let desktop: UIDesktop = new UIDesktop(desktop01, { dockBar: { range: 300, maxScale: 1.8 } });
			let canvasWin = new TestCanvasWindow(desktop, "test-canvas-01", "Map-001", { 
				icons: JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_FACE),
				body: { initSize: {width: 640, height: 480}, overflow: "scroll" }
			});
			canvasWin.renderIn();
			//
			let cvsCtx = canvasWin.canvas.getContext("2d");
			if (cvsCtx) {
				let center  = {x:150, y:150, radius: 3, fillStyle: "fuchsia"};
				let rect01 = new CanvasRectangle2D( 50,  50,  60, 120, 3, "red" , "");
				let rect03 = new CanvasRectangle2D(190, 130,  60, 120, 3, "blue", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawRectangle(cvsCtx, rect01);
				CanvasUtils.drawRectangle(cvsCtx, rect03);
				CanvasUtils.drawVertexRaysFrom(cvsCtx, center.x, center.y, rect01, 150, 1, "red");
				CanvasUtils.drawVertexRaysFrom(cvsCtx, center.x, center.y, rect03, 150, 1, "blue");
			}
			if (cvsCtx) {
				let center  = {x:450, y:150, radius: 3, fillStyle: "fuchsia"};
				let rect02 = new CanvasRectangle2D(430,  50, 120,  60, 3, "lime", "");
				let rect04 = new CanvasRectangle2D(350, 190, 120,  60, 3, "gray", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawRectangle(cvsCtx, rect02);
				CanvasUtils.drawRectangle(cvsCtx, rect04);
				CanvasUtils.drawVertexRaysFrom(cvsCtx, center.x, center.y, rect02, 150, 1, "lime");
				CanvasUtils.drawVertexRaysFrom(cvsCtx, center.x, center.y, rect04, 150, 1, "gray");
			}
			if (cvsCtx) {
				let center  = {x:750, y:150, radius: 3, fillStyle: "fuchsia"};
				let rect01 = new CanvasRectangle2D(650,  50,  60, 120, 3, "red" , "");
				let rect03 = new CanvasRectangle2D(790, 130,  60, 120, 3, "blue", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawRectangle(cvsCtx, rect01);
				CanvasUtils.drawRectangle(cvsCtx, rect03);
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, rect01, 150, { lineWidth: 1, strokeStyle: "red" , fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, rect03, 150, { lineWidth: 1, strokeStyle: "blue", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (cvsCtx) {
				let center  = {x:1050, y:150, radius: 3, fillStyle: "fuchsia"};
				let rect02 = new CanvasRectangle2D(1030,  50, 120,  60, 3, "lime", "");
				let rect04 = new CanvasRectangle2D(950, 190, 120,  60, 3, "gray", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawRectangle(cvsCtx, rect02);
				CanvasUtils.drawRectangle(cvsCtx, rect04);
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, rect02, 150, { lineWidth: 1, strokeStyle: "lime", fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, rect04, 150, { lineWidth: 1, strokeStyle: "gray", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (cvsCtx) {
				let center  = {x:1350, y:150, radius: 3, fillStyle: "fuchsia"};
				let cric01 = new CanvasCircle2D(1350,  80, 60, 3, "red", "");
				let cric03 = new CanvasCircle2D(1350, 220, 60, 3, "blue", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric01);
				CanvasUtils.drawCircle(cvsCtx, cric03);
				//
				let vtxPts1 = cric01.getVertexesFrom(center.x, center.y);
				let vtxPts3 = cric03.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[0].x, y: vtxPts1[0].y, radius: 3, fillStyle: "red" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[1].x, y: vtxPts1[1].y, radius: 3, fillStyle: "red" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[0].x, y: vtxPts3[0].y, radius: 3, fillStyle: "blue" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[1].x, y: vtxPts3[1].y, radius: 3, fillStyle: "blue" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric01, 145, { lineWidth: 1, strokeStyle: "red" , fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric03, 145, { lineWidth: 1, strokeStyle: "blue", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (null != cvsCtx) {
				let center  = {x:1350, y:450, radius: 3, fillStyle: "fuchsia"};
				let cric02 = new CanvasCircle2D(1420, 450, 60, 3, "lime", "");
				let cric04 = new CanvasCircle2D(1280, 450, 60, 3, "gray", "");
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric02);
				CanvasUtils.drawCircle(cvsCtx, cric04);
				//
				let vtxPts2 = cric02.getVertexesFrom(center.x, center.y);
				let vtxPts4 = cric04.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[0].x, y: vtxPts2[0].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[1].x, y: vtxPts2[1].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[0].x, y: vtxPts4[0].y, radius: 3, fillStyle: "gray" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[1].x, y: vtxPts4[1].y, radius: 3, fillStyle: "gray" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric02, 145, { lineWidth: 1, strokeStyle: "lime", fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric04, 145, { lineWidth: 1, strokeStyle: "gray", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (null != cvsCtx) {
				let center  = {x:150, y:450, radius: 3, fillStyle: "fuchsia"};
				let cric01 = new CanvasCircle2D(100, 400, 60, 3, "red", "");
				let cric03 = new CanvasCircle2D(200, 500, 60, 3, "blue", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric01);
				CanvasUtils.drawCircle(cvsCtx, cric03);
				//
				let vtxPts1 = cric01.getVertexesFrom(center.x, center.y);
				let vtxPts3 = cric03.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[0].x, y: vtxPts1[0].y, radius: 3, fillStyle: "red" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[1].x, y: vtxPts1[1].y, radius: 3, fillStyle: "red" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[0].x, y: vtxPts3[0].y, radius: 3, fillStyle: "blue" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[1].x, y: vtxPts3[1].y, radius: 3, fillStyle: "blue" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric01, 145, { lineWidth: 1, strokeStyle: "red" , fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric03, 145, { lineWidth: 1, strokeStyle: "blue", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (null != cvsCtx) {
				let center  = {x:450, y:450, radius: 3, fillStyle: "fuchsia"};
				let cric02 = new CanvasCircle2D(400, 500, 60, 3, "lime", "");
				let cric04 = new CanvasCircle2D(500, 400, 60, 3, "gray", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric02);
				CanvasUtils.drawCircle(cvsCtx, cric04);
				//
				let vtxPts2 = cric02.getVertexesFrom(center.x, center.y);
				let vtxPts4 = cric04.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[0].x, y: vtxPts2[0].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[1].x, y: vtxPts2[1].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[0].x, y: vtxPts4[0].y, radius: 3, fillStyle: "gray" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[1].x, y: vtxPts4[1].y, radius: 3, fillStyle: "gray" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric02, 145, { lineWidth: 1, strokeStyle: "lime", fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric04, 145, { lineWidth: 1, strokeStyle: "gray", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (null != cvsCtx) {
				let center = { x: 750, y: 450, radius: 3, fillStyle: "fuchsia" };
				let cric01 = new CanvasCircle2D(670, 370, 60, 3, "red", "");
				let cric03 = new CanvasCircle2D(830, 530, 60, 3, "blue", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric01);
				CanvasUtils.drawCircle(cvsCtx, cric03);
				//
				let vtxPts1 = cric01.getVertexesFrom(center.x, center.y);
				let vtxPts3 = cric03.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[0].x, y: vtxPts1[0].y, radius: 3, fillStyle: "red"  });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts1[1].x, y: vtxPts1[1].y, radius: 3, fillStyle: "red"  });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[0].x, y: vtxPts3[0].y, radius: 3, fillStyle: "blue" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts3[1].x, y: vtxPts3[1].y, radius: 3, fillStyle: "blue" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric01, 145, { lineWidth: 1, strokeStyle: "red" , fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric03, 145, { lineWidth: 1, strokeStyle: "blue", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (null != cvsCtx) {
				let center = { x: 1050, y: 450, radius: 3, fillStyle: "fuchsia" };
				let cric02 = new CanvasCircle2D( 970, 530, 60, 3, "lime", "");
				let cric04 = new CanvasCircle2D(1130, 370, 60, 3, "gray", "");
				//
				CanvasUtils.drawPoint(cvsCtx, center);
				CanvasUtils.drawCircle(cvsCtx, cric02);
				CanvasUtils.drawCircle(cvsCtx, cric04);
				//
				let vtxPts2 = cric02.getVertexesFrom(center.x, center.y);
				let vtxPts4 = cric04.getVertexesFrom(center.x, center.y);
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[0].x, y: vtxPts2[0].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts2[1].x, y: vtxPts2[1].y, radius: 3, fillStyle: "lime" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[0].x, y: vtxPts4[0].y, radius: 3, fillStyle: "gray" });
				CanvasUtils.drawPoint(cvsCtx, { x: vtxPts4[1].x, y: vtxPts4[1].y, radius: 3, fillStyle: "gray" });
				//
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric02, 145, { lineWidth: 1, strokeStyle: "lime", fillStyle: "rgba(100,100,100,0.5)" });
				CanvasUtils.drawVertexShadowFrom(cvsCtx, center.x, center.y, cric04, 145, { lineWidth: 1, strokeStyle: "gray", fillStyle: "rgba(100,100,100,0.5)" });
			}
			if (cvsCtx) {
				let canvas = canvasWin.canvas;
				canvas.addEventListener("mousedown", e => {
					let rect = canvas.getBoundingClientRect();
					// let cPoint = { // 点击的位置
					// 	x: parseInt(`${e.clientX - rect.left}`),
					// 	y: parseInt(`${e.clientY - rect.top}`)
					// };
					CanvasUtils.drawPoint(cvsCtx, { x: e.clientX - rect.left, y: e.clientY - rect.top, radius: 3, fillStyle: "lime" });
				})
			}
		}
		//
	}

}
