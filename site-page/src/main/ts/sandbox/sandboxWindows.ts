import {
	JadeWindowUI, UIDesktop, UIWindowAdapter, WinParam,
} from '@jade-dungeon/jade-utils/ui-window';

/**
 * 沙盘的窗口类
 *
 * 老应用把地图和各个面板堆在一个 Bootstrap 栅格里，靠 `resizeLayout()`
 * 手算 7 个 `clientHeight` 再减出地图高度。改成窗口之后那套全删了 ——
 * 窗口自己管大小，这是换 UI 最大的收益。
 *
 * 窗口划分见 `docs/sandbox-refactor.md` 第 5.2 节：
 * 玩家开 Map + Dice 两个，GM 另外开 Tokens / Properties / Scene。
 *
 * ## 为什么每个窗口自带一个 `renderBody()`
 *
 * `UIWindowAdapter.renderIn()` 是抽象方法，子类必须自己拼窗体。
 * 这里的模式是：`renderIn()` 只负责把 `renderBody()` 的结果交给
 * `JadeWindowUI.renderWindowTplt()`，具体内容由各窗口实现 ——
 * 和 `testJadeTRPG.ts` 的 `TestCanvasWindow` 同一套写法。
 */

/** 窗体默认尺寸，各窗口可以在 `cfg.body.initSize` 里覆盖 */
const DEFAULT_BODY = { width: 640, height: 480 };

/**
 * 带双层 Canvas 的地图窗口
 *
 * **两张 Canvas 是渲染管线要求的**，不是冗余：
 *
 * | Canvas | 作用 |
 * |--------|------|
 * | `bufferCanvas` | 离屏缓冲。画暗层/亮层、再 `toDataURL()` 取快照 |
 * | `finalCanvas` | 展示用。只贴合成好的结果，鼠标事件也绑在它上面 |
 *
 * `SandTable.drawSceneWithUserView()` 要的就是这一对（`IScene.frame`）。
 * 缓冲那张**不进 DOM** —— 它只是个像素暂存区，塞进文档会被用户看到中间态。
 */
export class SandboxMapWindow extends UIWindowAdapter {

	/** 离屏缓冲画布，不加进 DOM */
	readonly bufferCanvas: HTMLCanvasElement = document.createElement('canvas');
	/** 展示画布，鼠标事件绑在它上面 */
	readonly finalCanvas: HTMLCanvasElement = document.createElement('canvas');
	/** 窗口底部状态栏的文字元素，用来显示坐标与提示 */
	private statusText: HTMLParagraphElement | null = null;

	/**
	 * @param desktop - 所在桌面
	 * @param id - 窗口 ID
	 * @param title - 窗口标题，一般用场景名
	 * @param cfg - 窗口参数
	 */
	constructor(desktop: UIDesktop, id: string, title: string, cfg?: WinParam) {
		super(desktop, id, title, cfg);
		const size = this.cfg.body.initSize ?? DEFAULT_BODY;
		for (const cvs of [this.bufferCanvas, this.finalCanvas]) {
			cvs.width = size.width;
			cvs.height = size.height;
		}
		this.finalCanvas.id = `sandbox-canvas-${this.id}`;
		this.bufferCanvas.id = `sandbox-buffer-${this.id}`;
	}

	/**
	 * 把地图画布放进窗体，底部加状态栏
	 */
	renderIn(): void {
		const renderBody = (): HTMLDivElement => {
			const body = this.ui.windowBody;
			const size = this.cfg.body.initSize ?? DEFAULT_BODY;
			body.style.width = `${size.width}px`;
			body.style.height = `${size.height}px`;
			// 地图通常比窗口大，所以窗体自己滚动
			body.style.overflow = 'scroll';
			body.appendChild(this.finalCanvas);
			return body;
		};

		const renderStatusBar = (): HTMLDivElement => {
			const bar = document.createElement('div');
			bar.classList.add('status-bar');
			this.statusText = document.createElement('p');
			this.statusText.classList.add('status-bar-field');
			this.statusText.textContent = '就绪';
			bar.appendChild(this.statusText);
			return bar;
		};

		JadeWindowUI.renderWindowTplt(this, undefined, renderBody, renderStatusBar);
	}

	/**
	 * 改状态栏的文字
	 *
	 * 用来显示「按住 Ctrl 拖动棋子」这类操作提示，以及移动请求的结果。
	 * 老应用用 `alert()` 报这些，每次都打断操作。
	 *
	 * @param text - 要显示的文字
	 */
	setStatus(text: string): void {
		if (this.statusText) { this.statusText.textContent = text; }
	}

	/**
	 * 把画布尺寸调整成地图的实际大小
	 *
	 * 场景的尺寸要等地图图片加载完才知道（`SandTable` 从图片的
	 * `naturalWidth/Height` 取），所以这一步在 `drawSceneWithUserView()`
	 * 之后调。两张画布都要改 —— 缓冲那张尺寸不对，合成出来的快照会被裁掉。
	 *
	 * @param width - 地图宽
	 * @param height - 地图高
	 */
	resizeCanvas(width: number, height: number): void {
		for (const cvs of [this.bufferCanvas, this.finalCanvas]) {
			cvs.width = width;
			cvs.height = height;
		}
		this.finalCanvas.style.width = `${width}px`;
		this.finalCanvas.style.height = `${height}px`;
	}

	/**
	 * 把鼠标事件的页面坐标换算成画布坐标
	 *
	 * ⚠️ **不要用老代码的 `sumCanvasOffset()`** —— 那是递归累加
	 * `offsetLeft/offsetTop`，而且 view 与 editor 两份实现符号还相反
	 *（一个减一个加）。窗口可拖动、可滚动之后那套必然失效。
	 *
	 * `getBoundingClientRect()` 返回的是元素在视口里的真实位置，
	 * 已经把窗口位移、窗体滚动、页面滚动全算进去了。
	 *
	 * @param e - 鼠标事件
	 * @returns {{x: number, y: number}} 画布坐标
	 */
	toCanvasPoint(e: MouseEvent): { x: number, y: number } {
		const rect = this.finalCanvas.getBoundingClientRect();
		return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
	}

}

/**
 * 掷骰窗口
 *
 * 玩家侧：输入表达式（`2d6+1d4+3`）按回车掷骰，下方显示全场结果。
 * GM 侧多一行「给谁设阈值」，由 {@link SandboxDiceWindow.enableGmPanel} 打开。
 *
 * 结果文本由 `sandboxApi.ts` 的 `renderRollResults()` 生成 ——
 * 玩家看不到 GM 设的阈值，所以同一份数据两种渲染。
 */
export class SandboxDiceWindow extends UIWindowAdapter {

	/** 骰子表达式输入框 */
	readonly cmdInput: HTMLInputElement = document.createElement('input');
	/** 结果显示区（只读多行文本） */
	readonly logArea: HTMLTextAreaElement = document.createElement('textarea');
	/** GM 用：选被要求检定的玩家 */
	readonly targetSelect: HTMLSelectElement = document.createElement('select');
	/** GM 用：阈值输入框 */
	readonly thresholdInput: HTMLInputElement = document.createElement('input');
	/** GM 面板的容器，默认隐藏 */
	private gmPanel: HTMLDivElement = document.createElement('div');

	/**
	 * @param desktop - 所在桌面
	 * @param id - 窗口 ID
	 * @param title - 窗口标题
	 * @param cfg - 窗口参数
	 */
	constructor(desktop: UIDesktop, id: string, title: string, cfg?: WinParam) {
		super(desktop, id, title, cfg);
		this.cmdInput.type = 'text';
		this.cmdInput.placeholder = '例如 2d6+1d4+3，回车掷骰';
		this.cmdInput.style.width = '100%';
		this.logArea.readOnly = true;
		this.logArea.rows = 10;
		this.logArea.style.width = '100%';
		this.thresholdInput.type = 'number';
		this.thresholdInput.placeholder = '阈值';
	}

	/**
	 * 拼窗体：GM 面板（默认隐藏）+ 掷骰输入 + 结果区
	 *
	 * 用的全是 98.css 的原生标签样式与 `.field-row` —— 不自己写表单样式。
	 */
	renderIn(): void {
		const renderBody = (): HTMLDivElement => {
			const body = this.ui.windowBody;

			// GM 面板：给某个玩家设检定阈值
			this.gmPanel.style.display = 'none';
			const gmRow = document.createElement('div');
			gmRow.classList.add('field-row');
			const gmLabel = document.createElement('label');
			gmLabel.textContent = '要求检定：';
			gmRow.appendChild(gmLabel);
			gmRow.appendChild(this.targetSelect);
			gmRow.appendChild(this.thresholdInput);
			this.gmPanel.appendChild(gmRow);
			body.appendChild(this.gmPanel);

			// 玩家掷骰
			const rollRow = document.createElement('div');
			rollRow.classList.add('field-row-stacked');
			const rollLabel = document.createElement('label');
			rollLabel.textContent = '掷骰：';
			rollRow.appendChild(rollLabel);
			rollRow.appendChild(this.cmdInput);
			body.appendChild(rollRow);

			// 结果区。外面套 sunken-panel 是 98.css 给列表/文本区的内凹边框
			const panel = document.createElement('div');
			panel.classList.add('sunken-panel');
			panel.appendChild(this.logArea);
			body.appendChild(panel);
			return body;
		};

		JadeWindowUI.renderWindowTplt(this, undefined, renderBody, undefined);
	}

	/**
	 * 打开 GM 面板，并填入可选的玩家名单
	 *
	 * ⚠️ `set-roll-threshold` 的 `username` 是**被设定的对象**，不是调用者 ——
	 * 所以这里列的是场景里的玩家棋子 ID，GM 自己不在其中。
	 *
	 * @param usernames - 玩家名单（取自场景的 teams 分组）
	 */
	enableGmPanel(usernames: Array<string>): void {
		this.gmPanel.style.display = '';
		this.targetSelect.innerHTML = '';
		for (const name of usernames) {
			const opt = document.createElement('option');
			opt.value = name;
			opt.textContent = name;
			this.targetSelect.appendChild(opt);
		}
	}

	/**
	 * 显示检定结果
	 * @param text - `renderRollResults()` 生成的文本
	 */
	setLog(text: string): void {
		this.logArea.value = text;
	}

}
