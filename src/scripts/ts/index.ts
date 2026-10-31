/**
 * 汇总入口
 *
 * 供 `import { ... } from '@jade-dungeon/jade-utils'` 这种不带子路径的写法使用。
 * 14 个模块的导出名无冲突，所以可以整体 `export *`。
 *
 * 注意：按子路径导入（如 `@jade-dungeon/jade-utils/geo2d`）只加载用到的模块，
 * 而从本入口导入会把所有模块一起加载。没有打包器做 tree-shaking 时，
 * 建议优先用子路径导入。
 *
 * 模块顺序 = 依赖顺序
 */

// 基础层（无内部依赖）
export * from './basic.js';
export * from './dataStructure.js';

// 资源与 Web 基础
export * from './web.js';
export * from './resource.js';

// 第三方库封装
export * from './3rdLibTool.js';

// 几何与图形层
export * from './ui/geo2d.js';
export * from './ui/canvas.js';

// Web 页面层
export * from './ui/webHtmlPage.js';

// 业务应用层
export * from './ui/UIWindow.js';
export * from './trpg/sandtable.js';
export * from './blog/blog.js';
export * from './blog/wiki.js';
export * from './workout/workout.js';
export * from './workout/workoutData.js';
