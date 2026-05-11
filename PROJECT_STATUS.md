# GameHub - Neon Protocol // 项目状态文档

> **最后更新**: 2026-05-11
> **项目路径**: `D:\AI\HermesAgent\Hermes_WorkSpace\GameHub`
> **技术栈**: 纯 HTML5 + CSS3 + Vanilla JS (ES6 Class)，PWA 支持
> **部署目标**: 移动端 PWA (可安装 Web App)，支持 `file://` 协议直接打开

---

## 📊 项目概览

一个赛博朋克霓虹风格的轻量级多游戏合集 Hub，面向移动设备优化。
所有游戏采用统一的视觉主题、音频引擎和触摸控制方案。

---

## ✅ 已完成内容

### 核心框架
- [x] `index.html` — 大厅 (Lobby) + 游戏视图切换 + 排行页 + 设置页
- [x] `manifest.json` — PWA 配置
- [x] `sw.js` — Service Worker (离线缓存), v3
- [x] `css/main.css` — 共享霓虹主题、响应式布局
- [x] `css/views.css` — 排行页和设置页样式
- [x] `js/utils.js` — GameCanvas, InputManager, GameLoop, Device, Storage
- [x] `js/audio-engine.js` — Web Audio API 共享音频引擎 (neonAudio)
- [x] `js/games-manifest.js` — 游戏注册表
- [x] `js/app.js` — Hub 控制器 (游戏加载、视图切换、分数持久化、排行、设置)

### 已完成游戏 (8/8)
| # | 游戏 | ID | 路径 | 难度 | 类别 | 状态 |
|---|------|-----|------|------|------|------|
| 1 | TETRIS | `tetris` | `games/tetris/tetris.js` | medium | arcade | ✅ 完成 |
| 2 | MINESWEEPER | `minesweeper` | `games/minesweeper/minesweeper.js` | hard | puzzle | ✅ 完成 |
| 3 | SNAKE | `snake` | `games/snake/snake.js` | easy | arcade | ✅ 完成 |
| 4 | 2048 | `2048` | `games/2048/2048.js` | medium | puzzle | ✅ 完成 |
| 5 | FLAPPY | `flappy` | `games/flappy/flappy.js` | hard | endless | ✅ 完成 |
| 6 | BREAKOUT | `breakout` | `games/breakout/breakout.js` | easy | arcade | ✅ 完成 |
| 7 | PONG | `pong` | `games/pong/pong.js` | easy | multiplayer | ✅ 完成 |
| 8 | SIMON | `simon` | `games/simon/simon.js` | medium | memory | ✅ 完成 |

### 已实现功能
- [x] 动态 script 标签加载游戏 (兼容 `file://`)
- [x] 本地最高分持久化 (localStorage)
- [x] 触摸控制 (方向键、滑动、拖拽)
- [x] 共享音频引擎
- [x] 返回按钮 / 退出游戏
- [x] 排行页 (Leaderboard)
- [x] 设置页 (Settings: 音效/震动/清除数据)

---

## 📁 文件结构

```
GameHub/
├── index.html              # 入口 + Lobby + 游戏容器 + 排行页 + 设置页
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker v3
├── PROJECT_STATUS.md       # ← 本文档
├── assets/
│   └── icons/
│       └── icon.svg        # PWA 图标 (SVG)
├── css/
│   ├── main.css            # 共享主题
│   └── views.css           # 排行页和设置页样式
├── js/
│   ├── utils.js            # 工具类
│   ├── audio-engine.js     # 音频引擎
│   ├── games-manifest.js   # 游戏注册表
│   └── app.js              # Hub 控制器
└── games/
    ├── tetris/tetris.js
    ├── minesweeper/minesweeper.js
    ├── snake/snake.js
    ├── 2048/2048.js
    ├── flappy/flappy.js
    ├── breakout/breakout.js
    ├── pong/pong.js
    └── simon/simon.js
```

---

## 🎨 技术约定

### 游戏类接口契约
所有游戏文件必须暴露一个全局 Class，并实现以下方法：

```javascript
class GameName {
    constructor() {
        this.id = 'gameId';  // 必须与 games-manifest.js 中的 id 一致
    }

    init(container) {
        // 在 container 中创建 Canvas/DOM，初始化游戏
    }

    destroy() {
        // 清理：cancelAnimationFrame, removeEventListener, remove canvas
    }

    handleInput(action) {
        // 处理来自 Hub 的触摸/键盘输入
        // action: 'up'|'down'|'left'|'right'|'rotate'|'drop'|'restart'|...
    }
}
```

### 分数上报
```javascript
if (window.hub) {
    window.hub.updateScore(this.id, this.score);
}
```

### 路径规范
- `games-manifest.js` 中的 `path` **不要** 以 `./` 开头
- 正确: `'games/breakout/breakout.js'`
- 错误: `'./games/breakout/breakout.js'`

---

## 📅 变更日志

### 2026-05-11
- 开发 Breakout 游戏 (`games/breakout/breakout.js`) - 霓虹砖块破坏者
- 开发 Pong 游戏 (`games/pong/pong.js`) - 单人 AI 对战模式
- 开发 Simon 游戏 (`games/simon/simon.js`) - 记忆序列挑战
- 添加排行页 (Leaderboard) 和设置页 (Settings)
- 创建 `css/views.css` 样式文件
- 更新 `sw.js` 缓存列表 (v3)，包含所有游戏和 views.css
- 更新 `js/app.js` 添加排行、设置、导航功能
- 新增触摸控制面板 (breakout, pong, simon)