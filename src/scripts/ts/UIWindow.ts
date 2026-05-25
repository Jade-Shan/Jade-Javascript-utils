import { SimpleMap } from "./dataStructure.js";
import { IPoint2D } from "./geo2d.js";
import { JadeUIResource, IconGroup, DefaultIconGroup } from "./resource.js";
import { WebUtil } from "./web.js";

const WIN_Z_IDX_MIN = 2000;

/**
 * 桌面环境的参数配置
 */
type IDesktopConfig = {
	desktop?: { backgroundImage?: string, width: string, height: string },
	dockBar?: DockBarParam
}

type DraggingWindow = {
	win?: UIObj,
	moveStart?: { x: number, y: number },
	winStart?: { left: number, top: number }
};

type ScalingWindow = {
	win?: UIObj,
	direction?: number,
	moveStart?: { x: number, y: number },
	winStart?: { left: number, top: number, width: number, height: number }
};

type CurrentWindow = {
	top?: UIObj,
	dragging: DraggingWindow,
	scaling: ScalingWindow,
}

/**
 * 桌面环境
 */
export class UIDesktop {
	readonly desktopDiv: HTMLElement; // 窗口在上一级HTML元素
	private allWindows: SimpleMap<string, UIObj> = new SimpleMap(); // 全部窗口的索引
	private windowZIndex: Array<UIObj> = []; // 窗口的z-index序列
	private dockBar?: DockBar; // 程序栏
	private readonly currWin: CurrentWindow = {dragging:{}, scaling:{}};

	getCurrTopWin(): UIObj | undefined { return this.currWin.top; }
	setCurrTopWin(win: UIObj): void { this.currWin.top = win; }

	getCurrDragging() { return this.currWin.dragging;};
	setCurrDragging(dragging: DraggingWindow) {
		this.currWin.dragging = dragging;
	}

	getCurrScaling() { return this.currWin.scaling;};
	setCurrScaling(scaling: ScalingWindow) {
		this.currWin.scaling= scaling;
	}

	private newWindowPosition = { // 管理新窗口弹出位置
		lastPos: { x: 0, y: 0 }, // 上一次窗口弹出的坐标
		lastTopStart: { x: 0, y: 0 } // 叠完一行以后，下移一行开始重新叠
	};

	// 记录鼠标状态	
	readonly mouseEvtStatus = {
		currPos: {x: 0, y: 0}, 
		btnPress: {left: false, right: false}
	}

	/**
	 * 创建一个桌面环境
	 * 
	 * @param parentElement 上一级元素
	 * @param cfg 配置参数
	 */
	constructor(desktopDiv: HTMLElement, cfg?: IDesktopConfig) {
		this.desktopDiv = desktopDiv;
		desktopDiv.style.height = cfg?.desktop?.height ? cfg.desktop.height : "100%";
		desktopDiv.style.width  = cfg?.desktop?.width  ? cfg.desktop.width  : "100%";
		desktopDiv.style.backgroundImage = cfg?.desktop?.backgroundImage ? //
			cfg?.desktop?.backgroundImage :  //
			WebUtil.transBase64ImgURL(JadeUIResource.defaultDesktopBackground);
		this.dockBar = cfg?.dockBar ? new DockBar(this, cfg.dockBar) : undefined;

		defaultWinOption.bindWindowDragMoving(this); // 绑定拖动窗口的事件
		defaultWinOption.bindWindowScaleMoving(this); // 绑定缩放窗口的事件
	}

	/**
	 * 桌面上有没有docker
	 * @returns 是否有
	 */
	hasDockBar(): boolean { return this.dockBar ? true : false; }

	/**
	 * 取得桌面上窗口的最大层数
	 * @returns 窗口的最大层数
	 */
	getMaxWindowIndex(): number { return this.windowZIndex.length + WIN_Z_IDX_MIN; }

	/**
	 * 通过新窗口的大小计算新窗口弹出的坐标
	 * 
	 * @param width 新窗口的宽度
	 * @param height 新窗口的高度
	 * @returns 新窗口弹出的坐标
	 */
	getNewWindowPosition(width: number, height: number): IPoint2D {
		let margin = 90; // 新弹出的位置的间隔
		let maxLevel = 8; // 同一次弹出时叠加几次
		let maxWidth = this.desktopDiv.clientWidth - margin;
		let maxHeigh = this.desktopDiv.clientHeight - margin;

		let newX = this.newWindowPosition.lastPos.x + margin;
		let newY = this.newWindowPosition.lastPos.y + margin;

		let coverlevel = (this.newWindowPosition.lastPos.y -
			this.newWindowPosition.lastTopStart.y) / margin;
		if (coverlevel > maxLevel) { // 叠了几层，换一个位置重新叠
			newX = this.newWindowPosition.lastTopStart.x + margin + margin;
			newY = this.newWindowPosition.lastTopStart.y + margin;
			this.newWindowPosition.lastTopStart.x = newX;
			this.newWindowPosition.lastTopStart.y = newY;
		}

		if (((newX + width) > maxWidth)) {// 一行满了，换一行 
			newX = margin;
			newY = this.newWindowPosition.lastTopStart.y + margin;
			this.newWindowPosition.lastTopStart.x = newX;
			this.newWindowPosition.lastTopStart.y = newY;
		}
		if ((newY + height) > maxHeigh) { // 纵向满了，回头
			newX = margin;
			newY = margin;
			this.newWindowPosition.lastTopStart.x = newX;
			this.newWindowPosition.lastTopStart.y = newY;
		}

		let lastPos = { x: newX, y: newY };
		this.newWindowPosition.lastPos = lastPos;
		return lastPos;
	}

	/**
	 * 在桌面上添加一个新窗口
	 * 
	 * @param window 新的窗口
	 */
	addWindow(window: UIObj) {
		if (this.windowZIndex.length > 0) {
			let last = this.windowZIndex[this.windowZIndex.length - 1];
			last.activeWindow(false);
		}
		this.allWindows.put(window.id, window);
		this.windowZIndex.push(window);
		if (this.dockBar) {
			this.dockBar.addIcon(window);
		}
	}

	/**
	 * 关闭一个窗口
	 * 
	 * @param win 要关闭的窗口
	 */
	optWinClose(win: UIObj) {
		this.allWindows.remove(win.id);
		let newIndex: Array<UIObj> = [];
		for (let i = 0; i < this.windowZIndex.length; i++) {
			let w = this.windowZIndex[i];
			if (win.id === w.id) {
				// do nothing
			} else {
				w.activeWindow(false);
				w.setZIndex(WIN_Z_IDX_MIN + newIndex.length);
				newIndex.push(w);
			}
		}
		this.windowZIndex = newIndex;
		this.desktopDiv.removeChild(win.ui.win);
		if (newIndex.length > 0) {
			let currWin = newIndex[newIndex.length - 1];
			currWin.activeWindow(true);
			currWin.setZIndex(WIN_Z_IDX_MIN + newIndex.length);
		}
		if (this.dockBar) {
			this.dockBar.removeIcon(win);
		}
	}

	/**
	 * 指定一个窗口为当前活动窗口
	 * 
	 * @param win 指定的窗口
	 */
	optWinActive(win: UIObj) {
		let newIndex: Array<UIObj> = [];
		for (let i = 0; i < this.windowZIndex.length; i++) {
			let w = this.windowZIndex[i];
			if (w.id === win.id) {
				// do nothing
			} else {
				w.activeWindow(false);
				w.setZIndex(WIN_Z_IDX_MIN + newIndex.length);
				newIndex.push(w);
			}
		}
		newIndex.push(win);
		this.windowZIndex = newIndex;
		//
		win.activeWindow(true);
		win.setZIndex(WIN_Z_IDX_MIN + newIndex.length);
	}

}

/**
 * 绑定窗口操作
 */
export type IBindWinOpt = {

	/**
	 * 绑定窗口的关闭操作
	 * @param win 窗口
	 */
	bindWinOptActive: (win: UIObj) => any;

	/**
	 * 绑定窗口的关闭操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptClose: (win: UIObj, btn: HTMLElement) => any;

	/**
	 * 绑定窗口的最大化操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptMax: (win: UIObj, btn: HTMLElement) => any;

	/**
	 * 绑定窗口的最小化操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptMin: (win: UIObj, btn: HTMLElement) => any;


	/* 选中要拖动窗口 */
	bindWindowDragSelect: (win: UIObj, titleBar: HTMLElement, titleBarControl: HTMLElement) => any,

	/* 拖动窗口 */
	bindWindowDragMoving: (desktop: UIDesktop) => any,

	/* 选中要缩放窗口 */
	bindWindowScaleSelect: (win: UIObj) => any,
	/* 缩放窗口 */
	bindWindowScaleMoving: (desktop: UIDesktop) => any,

}
let cleanScaling = (desktop: UIDesktop) => {
	desktop.desktopDiv.style.cursor = "default";
	desktop.setCurrScaling({});
};

/**
 * 默认的窗口操作绑定
 */
export let defaultWinOption = {

	/**
	 * 绑定窗口的关闭操作
	 * @param win 窗口
	 */
	bindWinOptActive: (win: UIObj): any => {
		win.ui.win.addEventListener("mousedown", e => {
			// console.log(`click win ${win.id}`);
			win.desktop.optWinActive(win);
		});
	},

	/**
	 * 绑定窗口的关闭操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptClose: (win: UIObj, btn: HTMLElement): any => {
		btn.addEventListener("mouseup", e => {
			win.desktop.optWinClose(win);
		});
	},

	/**
	 * 绑定窗口的最大化操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptMax: (win: UIObj, btn: HTMLElement): any => {
		if (!win.cfg.scalable) {
			return false; // 忽略不可调整大小的窗口
		}
		btn.addEventListener("mousedown", e => {
			let winDiv = win.ui.win;
			let pElem = win.desktop.desktopDiv;
			let start = {
				left: winDiv.offsetLeft, top: winDiv.offsetTop,
				width: winDiv.offsetWidth, height: winDiv.offsetHeight,
			};
			let end = {
				left: winDiv.offsetLeft, top: winDiv.offsetTop,
				width: winDiv.offsetWidth, height: winDiv.offsetHeight,
			};
			if (win.status.isMax) {
				win.status.isMax = false;
				btn.setAttribute("aria-label", "Maximize"),
				end.left   = win.status.lastPos.x;
				end.top    = win.status.lastPos.y;
				end.width  = win.status.lastSize.width;
				end.height = win.status.lastSize.height;
			} else { // 最大化
				win.status.isMax = true;
				btn.setAttribute("aria-label", "Restore"),
				// 保存之前的位置与大小
				win.status.lastPos.x       = start.left  ;
				win.status.lastPos.y       = start.top   ;
				win.status.lastSize.width  = start.width ;
				win.status.lastSize.height = start.height;
				//
				end.left   = 0;
				end.top    = 0;
				end.width  = pElem.clientWidth - 6;
				// 如果桌面上有dock，留几个像素让dock可以响应鼠标
				end.height = win.desktop.hasDockBar() ?
						pElem.clientHeight - 10 : pElem.clientHeight - 6;
			}
			JadeWindowUI.showWinMaxMinAnima(win, 300, 50, start, end);
			setTimeout(() => {
				winDiv.style.left   = `${end.left  }px`;
				winDiv.style.top    = `${end.top   }px`;
				winDiv.style.width  = `${end.width }px`;
				winDiv.style.height = `${end.height}px`;
				let bodyHeight = win.ui.win.offsetHeight - win.ui.titleBar.clientHeight;
				if (win.ui.statusBar) {
					bodyHeight = bodyHeight - win.ui.statusBar.clientHeight;
				}
				win.ui.windowBody.style.height = `${bodyHeight - 25}px`;
				win.ui.windowBody.style.width  = `${end.width  - 25}px`;
			}, 350);
		});
	},

	/**
	 * 绑定窗口的最小化操作
	 * 
	 * @param win 窗口
	 * @param btn 绑定的按键 
	 */
	bindWinOptMin: (win: UIObj, btn: HTMLElement): any => {
		btn.addEventListener("mousedown", e => {
			let winDiv = win.ui.win;
			let min = {
				left: win.desktop.desktopDiv.offsetWidth / 2,
				top: win.desktop.desktopDiv.offsetHeight - 10,
				width: 10, height: 1
			}
			let ori = {
				left: winDiv.offsetLeft, top: winDiv.offsetTop,
				width: winDiv.offsetWidth, height: winDiv.offsetHeight
			}
			if (win.status.isMin) { // 当前是最小化的，恢复到正常
				JadeWindowUI.showWinMaxMinAnima(win, 300, 50, min, ori);
				setTimeout(() => {
					win.status.isMin = false;
					win.ui.win.style.visibility = "visible";
					win.desktop.optWinActive(win); // 恢复的窗口为顶层
				}, 350);
			} else if (win.status.isTop) {
				// 当前活动窗口，最小化
				win.status.isMin = true;
				win.ui.win.style.visibility = "hidden";
				JadeWindowUI.showWinMaxMinAnima(win, 300, 50, ori, min);
			} else if (!win.status.isTop) {
				win.desktop.optWinActive(win);
			}
		})
	},

	bindWindowScaleSelect: (win: UIObj): any=> {
		let desktop = win.desktop;
		let winDiv = win.ui.win;
		let checkScaleStart = (winDiv: HTMLElement, e: MouseEvent): number => {
			let effSize = 7; // 会触发的范围是5个像素
			let width  = winDiv.offsetWidth ;
			let height = winDiv.offsetHeight;
			let rect = winDiv.getBoundingClientRect();
			let cPoint = { // 点击的位置
				x: parseInt(`${e.clientX - rect.left}`), 
				y: parseInt(`${e.clientY - rect.top }`)
			};
			// 
			let distance = { x: width - cPoint.x, y: height - cPoint.y };
			let direction = 5;
			if (distance.x < 0) {
				return 5;
			} else if (distance.y < 0) {
				return 5;
			} else {
				direction = ( //
					(cPoint.y < effSize) ? //
						((cPoint.x < effSize) ? 7 : (distance.x < effSize) ? 9 : 8) : //
						((distance.y < effSize) ? //
							((cPoint.x < effSize) ? 1 : (distance.x < effSize) ? 3 : 2) : //
							((cPoint.x < effSize) ? 4 : (distance.x < effSize) ? 6 : 5)));
			}
			return direction;
		};
		winDiv.addEventListener("mousedown", (e) => {
			if (win.cfg.scalable && !win.status.isMax && !win.status.isMin) {
				let desktop = win.desktop;
				let desktopDiv = desktop.desktopDiv;
				let direction = checkScaleStart(winDiv, e);
				if (5 != direction) {
					desktop.setCurrScaling({ win: win, direction: direction });
					if (2 === direction || 8 === direction) {
						desktopDiv.style.cursor = "ns-resize";
					} else if (4 === direction || 6 === direction) {
						desktopDiv.style.cursor = "ew-resize";
					} else if (7 === direction || 3 === direction) {
						desktopDiv.style.cursor = "nwse-resize";
					} else if (1 === direction || 9 === direction) {
						desktopDiv.style.cursor = "nesw-resize";
					}
				}
			}
		});
	},


	bindWindowScaleMoving: (desktop: UIDesktop): any => {
		let desktopDiv = desktop.desktopDiv;
		//
		desktopDiv.addEventListener("mouseup"   , (e) => { cleanScaling(desktop); })
		desktopDiv.addEventListener("mouseleave", (e) => { cleanScaling(desktop); })
		desktopDiv.addEventListener("mousedown" , (e) => {
			setTimeout(() => {
				if (desktop.getCurrScaling().win && desktop.getCurrScaling().direction) {
					let direction = desktop.getCurrScaling().direction;
					let currDiv = desktop.getCurrScaling().win!.ui.win;
					let moveStart = { x: e.clientX, y: e.clientY };
					let winStart  = {
						left  : currDiv.offsetLeft,
						top   : currDiv.offsetTop,
						width : currDiv.offsetWidth,
						height: currDiv.offsetHeight
					};
					desktop.getCurrScaling().direction = direction;
					desktop.getCurrScaling().moveStart = moveStart;
					desktop.getCurrScaling().winStart  = winStart;
				}
			}, 10);
		});
		desktopDiv.addEventListener("mousemove", (e) => {
			if (desktop.getCurrScaling().win && desktop.getCurrScaling().moveStart && desktop.getCurrScaling().winStart) {
				let currWin = desktop.getCurrScaling().win!;
				let winDiv = currWin.ui.win;
				let winStart = desktop.getCurrScaling().winStart!;
				let direction = desktop.getCurrScaling().direction!;
				let dx = e.clientX - desktop.getCurrScaling().moveStart!.x;
				let dy = e.clientY - desktop.getCurrScaling().moveStart!.y;
				//
				let end = {
					left: winStart.left, top: winStart.top,
					width: winStart.width, height: winStart.height,
				};
				if (1 === direction || 2 === direction || 3 === direction) {
					end.height = winStart.height + dy;
				} 
				if (3 === direction || 6 === direction || 9 === direction) {
					end.width = winStart.width + dx;
				} 
				if (7 === direction || 8 === direction || 9 === direction) {
					end.top = winStart.top + dy;
					end.height = winStart.height - dy;
				} 
				if (1 === direction || 4 === direction || 7 === direction) {
					end.left = winStart.left + dx;
					end.width = winStart.width - dx;
				}
				if (5 != direction) {
					end.height = end.height - 6;
				}

				let bodyHeight = winDiv.offsetHeight - currWin.ui.titleBar.clientHeight;
				if (currWin.ui.statusBar) {
					bodyHeight = bodyHeight - currWin.ui.statusBar.clientHeight;
				}
				//
				winDiv.style.left   = `${end.left  }px`;
				winDiv.style.top    = `${end.top   }px`;
				winDiv.style.width  = `${end.width }px`;
				winDiv.style.height = `${end.height}px`;
				currWin.ui.windowBody.style.height = `${bodyHeight - 25}px`;
				currWin.ui.windowBody.style.width  = `${end.width  - 25}px`;
			}
		});
	},

	bindWindowDragSelect: (win: UIObj, titleBar: HTMLElement, titleBarControl: HTMLElement): any => {
		let desktop = win.desktop;
		titleBar.addEventListener("mousedown" , (e) => {
			if (!win.status.isMax && !win.status.isMin) {
				titleBar.style.cursor = "move";
				desktop.setCurrDragging({win:win});
			}
		});
	},

	bindWindowDragMoving: (desktop: UIDesktop): any => { /* 拖动窗口 */
		let desktopDiv = desktop.desktopDiv;
		//
		let cleanDragging = () => {
			let currWin = desktop.getCurrDragging().win;
			if (currWin) { currWin.ui.titleBar.style.cursor = "default"; }
			currWin = desktop.getCurrTopWin();
			if (currWin) { currWin.ui.titleBar.style.cursor = "default"; }
			desktop.setCurrDragging({});
		};
		desktopDiv.addEventListener("mouseup"   , (e) => { cleanDragging() });
		desktopDiv.addEventListener("mouseleave", (e) => { cleanDragging() });
		// 窗口的拖动要监控整个桌面
		desktopDiv.addEventListener("mousedown", (e) => {
			setTimeout(() => {
				if (desktop.getCurrDragging().win) {
					let currDiv = desktop.getCurrDragging().win!.ui.win;
					let moveStart = { x: e.clientX, y: e.clientY };
					let winStart = {
						left: currDiv.offsetLeft,
						top: currDiv.offsetTop
					};
					desktop.getCurrDragging().moveStart = moveStart;
					desktop.getCurrDragging().winStart = winStart;
				}
			}, 10);
		});
		desktopDiv.addEventListener("mousemove", (e) => {
			let dRct = desktop.desktopDiv.getBoundingClientRect();
			if (e.clientX < dRct.left || e.clientX > dRct.right || e.clientY < dRct.top || e.clientY > dRct.bottom) {
				cleanDragging();
			} else if (desktop.getCurrDragging().win && desktop.getCurrDragging().moveStart && desktop.getCurrDragging().winStart) {
				let currDiv = desktop.getCurrDragging().win!.ui.win;
				let dx = e.clientX - desktop.getCurrDragging().moveStart!.x;
				let dy = e.clientY - desktop.getCurrDragging().moveStart!.y;
				currDiv.style.left = `${desktop.getCurrDragging().winStart!.left + dx}px`;
				currDiv.style.top  = `${desktop.getCurrDragging().winStart!.top  + dy}px`;
			}
		});
	},

};




/**
 * 窗口配置
 */
type WinCfg = {
	icons: IconGroup, // 窗口的图标
	bindWinOpt: IBindWinOpt, // 绑定窗口的操作
	scalable: Boolean, // 是否可以调整大小
	body: { 
		initSize: {width: number, height: number},
		overflow: string 
	},
};

export type WinParam = {
	icons?: IconGroup, // 窗口的图标
	bindWinOpt?: IBindWinOpt, // 绑定窗口的操作
	scalable?: Boolean, // 是否可以调整大小
	body?: { 
		initSize?: {width: number, height: number},
		overflow?: string 
	},
};
/**
 * 窗口状态
 */
type WinStatus = {
	isTop: boolean; // 是否是当前窗口
	isMax: boolean; // 是否最大化
	isMin: boolean; // 是否最小化
	isDragging: boolean; // 是否在拖动状态
	readonly lastPos : {x: number, y: number, zIdx: number}; // 正常状态时最后状态
	readonly lastSize: {width: number, height: number}; // 正常状态时最后的大小
};

/**
 * 窗口要用的HTML元素
 */
type WinUIElement = {
	readonly win: HTMLDivElement;        // 窗口
	readonly titleBar: HTMLDivElement;   // 标题栏
	readonly windowBody: HTMLDivElement; // 窗口主体
	statusBar?: HTMLDivElement;          // 窗口状态栏
}

/**
 * 窗口元素的接口
 */
export interface UIObj {
	readonly desktop: UIDesktop;      // 桌面实例
	readonly ui: WinUIElement;        // 窗口中用到的HTML元素
	readonly status: WinStatus;       // 窗口的状态
	readonly id: string;              // 窗口的ID
	title: string;                    // 窗口的标题
	cfg: WinCfg;

	/**
	 * 在桌面上渲染窗口
	 */
	renderIn(): void;

	/**
	 * 设置窗口为当前窗口
	 * @param isActive 是否是当前窗口
	 */
	activeWindow(isActive: boolean): void;

	/**
	 * 设置窗口的层级
	 * @param zIdx 设置层级
	 */
	setZIndex(zIdx: number): void;

	checkDragging(): boolean;

}

/**
 * 窗口的部分实现
 */
export abstract class UIWindowAdpt implements UIObj {
	readonly desktop: UIDesktop;
	readonly ui: WinUIElement;
	readonly status: WinStatus = { 
		isTop: false, isMin: false, isMax: false, isDragging: false,
		lastPos: { x: 10, y: 10, zIdx: 100 },
		lastSize: { width: 320, height: 250 }
	};
	readonly id: string;
	title: string;
	cfg: WinCfg = {
		icons: 	JadeUIResource.getDefaultIcon(DefaultIconGroup.ELEC_FACE),
		bindWinOpt: defaultWinOption,
		scalable: true,
		body: { overflow: "auto", initSize: {width: 800, height: 600} }
	};

	/**
	 * 创建窗口对象 
	 * @param desktop 所在的桌面
	 * @param id  窗口ID
	 * @param title 窗口标题
	 * @param bindWinOpt 绑定窗口的操作 
	 */
	constructor(desktop: UIDesktop, id: string, title: string, cfg?: WinParam) {
		this.title = title;
		this.desktop = desktop;
		this.id = JadeWindowUI.genWinId(id);
		let winDiv = document.createElement('div');
		winDiv.id = this.id;
		winDiv.classList.add("window");
		let titleBar = document.createElement('div');
		let windowBody = document.createElement('div');
		windowBody.classList.add("window-body");
		this.ui = { win: winDiv, titleBar: titleBar, windowBody: windowBody };
		if (cfg) {
			if (cfg.bindWinOpt) { this.cfg.bindWinOpt = cfg.bindWinOpt; }
			if (cfg.icons) { this.cfg.icons = cfg.icons; }
			if (cfg.scalable != undefined) { this.cfg.scalable = cfg.scalable; }
			if (cfg.body) { 
				if (cfg.body.overflow) { this.cfg.body.overflow = cfg.body.overflow; }
				if (cfg.body.initSize) { this.cfg.body.initSize = cfg.body.initSize; }
			 }
		}
	}

	/**
	 * 渲染窗口
	 */
	abstract renderIn(): void;

	/**
	 * 设置窗口为当前窗口
	 * @param isActive 是否是当前窗口
	 */
	activeWindow(isActive: boolean): void {
		let div = this.ui.titleBar;
		if (div != null) {
			if (isActive) {
				this.status.isTop = isActive;
				this.desktop.setCurrTopWin(this);
				if (div.classList.contains('inactive')) {
					div.classList.remove('inactive');
				}
			} else if (!isActive && !div.classList.contains('inactive')) {
				this.status.isTop = isActive;
				div.classList.add('inactive');
			} 
		}
	}

	/**
	 * 设置窗口的层级
	 * @param zIdx 设置层级
	 */
	setZIndex(zIndex: number): void {
		this.status.lastPos.zIdx = zIndex; 
		this.ui.win.style.zIndex = `${zIndex}`;
	}

	checkDragging(): boolean { return this.status.isDragging; }

} 

//export abstract class UIWindow extends UIWindowAdptt {

//	constructor(desktop: UIDesktop, id: string, title: string, cfg?: WinParam) {
//		super(desktop, id, title, cfg);
//	}

//	//renderIn(): void {
//	//	let div = JadeWindowUI.renderWindowTplt(this);
//	//}

//}


type DockBarCfg = {
	dockColor: string, 
	iconColor: string,
	opacity: {normal: number, hover: number},
	range: number, 
	maxScale: number,
};

type DockBarParam = {
	dockColor?: string, 
	iconColor?: string,
	opacity?: {normal: number, hover: number},
	range?: number, 
	maxScale?: number,
};

export class DockBar {

	private barDiv: HTMLDivElement;
	private parentElement: HTMLElement;
	cfg: DockBarCfg = {
		dockColor: "rgb(100, 100, 100)",
		iconColor: "rgb(34, 199, 158)",
		opacity: {normal: 55, hover: 75},
		range: 300,
		maxScale: 1.8
	};


	constructor(desktop: UIDesktop, cfg?: DockBarParam) {
		if (cfg) {
			if (cfg.dockColor  ) { this.cfg.dockColor = cfg.dockColor; }
			if (cfg.iconColor  ) { this.cfg.iconColor = cfg.iconColor; }
			if (cfg.range      ) { this.cfg.range     = cfg.range    ; }
			if (cfg.maxScale   ) { this.cfg.maxScale  = cfg.maxScale ; }
			if (cfg.opacity?.normal) { this.cfg.opacity.normal = cfg.opacity.normal; }
			if (cfg.opacity?.hover ) { this.cfg.opacity.hover  = cfg.opacity.hover ; }
		}
		//
		this.parentElement = desktop.desktopDiv;
		let barDiv = document.createElement('div');
		this.barDiv = barDiv;
		barDiv.classList.add('dock-bar');
		barDiv.style.backgroundColor = this.cfg.dockColor;
		barDiv.style.opacity = `${this.cfg.opacity.normal}%`;
		this.parentElement.appendChild(this.barDiv);
		barDiv.addEventListener("mousemove", e => {
			let sizeCurve    = this.createCurve(this.cfg.range, e.clientX, 1, this.cfg.maxScale);
			let opacityCurve = (x: number) => { return this.cfg.opacity.hover; };
			this.layout(sizeCurve, opacityCurve);
		});
		barDiv.addEventListener("mouseleave", e => {
			this.layout((x: number) => 1, (x: number) => this.cfg.opacity.normal);
			barDiv.style.opacity = `${this.cfg.opacity.normal}%`;
			barDiv.style.setProperty('width', 'fit-content');
			barDiv.style.zIndex = `${WIN_Z_IDX_MIN - 1}`; // 下到最低层
		});
		barDiv.addEventListener("mouseenter", e => {
			barDiv.style.opacity = `${this.cfg.opacity.hover}%`;
			barDiv.style.zIndex = `${desktop.getMaxWindowIndex() + 100}`;// 提到最上层
			let rect = barDiv.getBoundingClientRect();
			let width = rect.right - rect.left + 80;
			barDiv.style.setProperty('width', `${width}px`);
		});
	}

	// 生成一个曲线函数
	private createCurve(totalDis: number, topX: number,  //
		minY: number, maxY: number): (x: number) => number //
	{
		let baseCurve = (x: number): number => {
			return x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
		};
		let curve = (x: number): number => {
			let beginX = topX - totalDis / 2
			let endX = topX + totalDis / 2
			return x < beginX || x > endX ? minY : //
				baseCurve((x - beginX) / totalDis) * (maxY - minY) + minY;
		}
		return curve;
	}

	private layout(sizeCurve: (x: number) => number, opacityCurve: (x: number) => number) {
		let items = this.barDiv.children;
		for (let i = 0; i < items.length; i++) {
			let item: Element | null = items.item(i);
			if (item != null) {
				let elm: any = item;
				let rect = item.getBoundingClientRect();
				let x = rect.left + rect.width / 2;
				// 图标的大小
				let scale = sizeCurve(x);
				elm.style.setProperty('--i', scale);
				// 图标的透明度
				let opacity = opacityCurve(x)
				elm.style.opacity = `${opacity}%`;
			}
		}
	}

	genAppGrapId(winId: string): string { return `appGrp-${winId}`; };

	genAppIconId(winId: string): string { return `appIco-${winId}`; };

	addIcon(win: UIObj) {
		let items = this.barDiv.children;
		if (items.length > 0) {
			let gap = document.createElement('div');
			gap.id = this.genAppGrapId(win.id);
			gap.classList.add('gap');
			this.barDiv.appendChild(gap);
		}
		//
		let icon = document.createElement('div');
		icon.id = this.genAppIconId(win.id);
		icon.classList.add('menu-item');
		icon.style.backgroundImage = WebUtil.transBase64ImgURL(win.cfg.icons.x32);
		icon.style.backgroundSize = "100%";
		icon.style.opacity = `${this.cfg.opacity.normal}%`;
		this.barDiv.appendChild(icon);
		win.cfg.bindWinOpt.bindWinOptMin(win, icon);
	}

	removeIcon(win: UIObj) {
		let iconId = this.genAppIconId(win.id);
		let items = this.barDiv.children;
		if (items.length > 0) {
			for (let i = 0; i < items.length; i++) {
				if (iconId === items.item(i)?.id) {
					let gap : Element | null = null;
					let icon: Element | null = items.item(i);
					if (items.length == 0) {
						// 最后一个，没有间隔符
					} else if (i == 0 && items.item(i + 1)?.classList.contains("gap")) {
						// 如果是第一个元素，删除右边的间隔
						gap = items.item(i + 1);
					} else if (items.item(i - 1)?.classList.contains("gap")) {
						// 其他的元素默认删除左边的间隔
						gap = items.item(i - 1);
					}
					if (icon) { this.barDiv.removeChild(icon); }
					if (gap ) { this.barDiv.removeChild(gap ); }
				}
			}
		}
	}

}


export namespace JadeWindowUI {

	export function genWinId(id: string): string { return `${id}-${(new Date()).getTime()}`; }

	export function genWinTitleBarId(id: string): string { return `titBar-${id}`; }

	export function genWinTitleIconId(id: string): string { return `titIcon-${id}`; }

	export function genWinTitleTextId(id: string): string { return `titText-${id}`; }

	let renderTitleBarIcon = (win: UIObj): HTMLDivElement => {
		let titleBarIcon = document.createElement("div");
		titleBarIcon.id = genWinTitleIconId(win.id);
		titleBarIcon.classList.add("title-bar-icon", "cannot-select");
		titleBarIcon.style.width  = '12px';
		titleBarIcon.style.height = '12px';
		titleBarIcon.style.backgroundImage = //
			WebUtil.transBase64ImgURL(win.cfg.icons.x12);
		return titleBarIcon;
	}
	let renderTitleBarText = (win: UIObj): HTMLDivElement => {
		let titleBarText = document.createElement("div");
		titleBarText.id = genWinTitleTextId(win.id);
		titleBarText.classList.add("title-bar-text", "cannot-select");
		titleBarText.innerHTML = win.title;
		return titleBarText;
	}
	let renderTitleBarIconText = (win: UIObj): HTMLDivElement => {
		let titleBarIcon = renderTitleBarIcon(win);
		let titleBarText = renderTitleBarText(win);
		let titleBarIconText = document.createElement('div');
		titleBarIconText.classList.add("title-bar-icon-text");
		titleBarIconText.appendChild(titleBarIcon);
		titleBarIconText.appendChild(titleBarText);
		return titleBarIconText;
	}

	let renderTitleBarControls = (win: UIObj): HTMLDivElement => {
		//
		let btnMin = document.createElement("button");
		btnMin.setAttribute("aria-label", "Minimize");
		win.cfg.bindWinOpt.bindWinOptMin(win, btnMin);
		//
		let btnMax = document.createElement("button");
		btnMax.setAttribute("aria-label", "Maximize");
		if (win.cfg.scalable) {
			win.cfg.bindWinOpt.bindWinOptMax(win, btnMax);
		} else {
			btnMax.disabled = true;
		}
		//
		let btnClose = document.createElement("button");
		btnClose.setAttribute("aria-label", "Close");
		win.cfg.bindWinOpt.bindWinOptClose(win, btnClose);
		//
		let titleBarCtls = document.createElement("div");
		titleBarCtls.classList.add("title-bar-controls");
		titleBarCtls.appendChild(btnMin);
		titleBarCtls.appendChild(btnMax);
		titleBarCtls.appendChild(btnClose);
		return titleBarCtls;
	}

	let renderTitleBar = (win: UIObj): HTMLDivElement => {
		let titleBarIconText = renderTitleBarIconText(win);
		let titleBarControls = renderTitleBarControls(win);
		let titleBar = win.ui.titleBar;
		titleBar.id = genWinTitleBarId(win.id);
		titleBar.classList.add("title-bar");
		titleBar.appendChild(titleBarIconText);
		titleBar.appendChild(titleBarControls);
		win.cfg.bindWinOpt.bindWindowDragSelect (win, titleBar, titleBarControls);
		win.cfg.bindWinOpt.bindWindowScaleSelect(win);
		return titleBar;
	}



	export function countWindowHeight(divs: Array<HTMLDivElement>): number {
		let totalHeight = 0;
		for (let i = 0; i < divs.length; i++) {
			totalHeight += divs[i].offsetHeight;
		}
		return totalHeight;
	}

	export function countWindowWidth(divs: Array<HTMLDivElement>): number {
		let totalWidth = 0;
		for (let i = 0; i < divs.length; i++) {
			totalWidth += divs[i].offsetWidth;
		}
		return totalWidth;
	}

	export function renderWindowTplt(win: UIObj, renderWindowBody?: () => HTMLDivElement, renderStatusBar?: () => HTMLDivElement): HTMLDivElement {

		let parent = win.desktop.desktopDiv;
		let winDiv: HTMLDivElement = win.ui.win;
		//
		let titleBar = renderTitleBar(win);
		winDiv.appendChild(titleBar );
		//
		if (renderWindowBody) { renderWindowBody(); }
		let windowBody = win.ui.windowBody;
		winDiv.appendChild(windowBody);
		//
		if (renderStatusBar) {
			let statusBar = renderStatusBar();
			win.ui.statusBar = statusBar;
			winDiv.appendChild(statusBar);
		}
		// 
		let pos = win.desktop.getNewWindowPosition( //
			winDiv.getBoundingClientRect().width, //
			winDiv.getBoundingClientRect().height);
		win.status.lastPos.x = pos.x;
		win.status.lastPos.y = pos.y;
		winDiv.style.position = 'absolute';
		winDiv.style.left = `${pos.x}px`;
		winDiv.style.top  = `${pos.y}px`;
		parent.style.position = 'relative';
		//
		parent.appendChild(winDiv);
		//
		win.cfg.bindWinOpt.bindWinOptActive(win);
		//
		win.desktop.addWindow(win);
		//计算窗口大小
		let width = winDiv.offsetWidth;
		if (width > parent.offsetWidth) {
			win.status.lastSize.width = width;
			winDiv.style.left = `0px`;
			winDiv.style.width = `${width}px`;
		} else if ((width + win.status.lastPos.x) > parent.offsetWidth) {
			win.status.lastPos.x = parent.offsetHeight - width;
			winDiv.style.left = `${win.status.lastPos.x}px`;
		}
		let height = winDiv.offsetHeight;
		if (height > parent.offsetHeight) {
			win.status.lastSize.height = height;
			winDiv.style.top = `0px`;
			winDiv.style.height = `${height}px`;
		} else if ((height + win.status.lastPos.y) > parent.offsetHeight) {
			win.status.lastPos.y = parent.offsetHeight - height;
			winDiv.style.top = `${win.status.lastPos.y}px`;
		}

		return winDiv;
	};

	export function showWinMaxMinAnima(win: UIObj, zoomMilSec: number, deleMilSec: number,
		start: { left: number, top: number, width: number, height: number },
		end  : { left: number, top: number, width: number, height: number }) //
	{
		let transSec = (zoomMilSec / 1000);
		let pElem = win.desktop.desktopDiv;
		let newDiv = document.createElement('div');
		newDiv.style.zIndex = `${win.status.lastPos.zIdx + 10}`;
		newDiv.style.left = `${start.left}px`;
		newDiv.style.top = `${start.top}px`;
		newDiv.style.width = `${start.width}px`;
		newDiv.style.height = `${start.height}px`;
		newDiv.style.backgroundColor = 'white';
		newDiv.style.border = '3px solid black';
		newDiv.style.position = 'absolute';
		newDiv.style.opacity = '30%';
		pElem.appendChild(newDiv);
		newDiv.style.transition = `left ${transSec}s ease, top ${transSec}s ease, width ${transSec}s ease, height ${transSec}s ease`;
		setTimeout(() => {
			newDiv.style.left = `${end.left}px`;
			newDiv.style.top = `${end.top}px`;
			newDiv.style.width = `${end.width}px`;
			newDiv.style.height = `${end.height}px`;
			setTimeout(() => { pElem.removeChild(newDiv); }, zoomMilSec + deleMilSec);
		}, 10);
	};
}
