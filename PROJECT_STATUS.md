# GameHub - Neon Protocol // 项目状态文档

> **最后更新**: 2026-05-09
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
- [x] `index.html` — 大厅 (Lobby) + 游戏视图切换
- [x] `manifest.json` — PWA 配置
- [x] `sw.js` — Service Worker (离线缓存)
- [x] `css/main.css` — 共享霓虹主题、响应式布局
- [x] `js/utils.js` — GameCanvas, InputManager, GameLoop, Device, Storage
- [x] `js/audio-engine.js` — Web Audio API 共享音频引擎 (neonAudio)
- [x] `js/games-manifest.js` — 游戏注册表
- [x] `js/app.js` — Hub 控制器 (游戏加载、视图切换、分数持久化)

### 已完成游戏 (4/8)
| # | 游戏 | ID | 路径 | 状态 | 备注 |
|---|------|-----|------|------|------|
| 1 | TETRIS | `tetris` | `games/tetris/tetris.js` | ✅ 完成 | 俄罗斯方块 |
| 2 | MINESWEEPER | `minesweeper` | `games/minesweeper/minesweeper.js` | ✅ 完成 | 扫雷 |
| 3 | SNAKE | `snake` | `games/snake/snake.js` | ✅ 完成 | 贪吃蛇 |
| 4 | 2048 | `2048` | `games/2048/2048.js` | ✅ 完成 | 数字合成 |

### 已实现功能
- [x] 动态 script 标签加载游戏 (兼容 `file://`)
- [x] 本地最高分持久化 (localStorage)
- [x] 触摸控制 (方向键、滑动)
- [x] 共享音频引擎
- [x] 返回按钮 / 退出游戏

---

## 🚧 待开发内容

### 待实现游戏 (3/8)
| # | 游戏 | ID | 路径 | 难度 | 类别 | 状态 |
|---|------|-----|------|------|------|------|
| 5 | FLAPPY | `flappy` | `games/flappy/flappy.js` | hard | endless | ✅ 已完成 |
| 6 | BREAKOUT | `breakout` | `games/breakout/breakout.js` | easy | arcade | 🚧 待开发 |
| 7 | PONG | `pong` | `games/pong/pong.js` | easy | multiplayer | 🚧 待开发 |
| 8 | SIMON | `simon` | `games/simon/simon.js` | medium | memory | 🚧 待开发 |

### 待实现系统页面
- [ ] **排行页** — 本地最高分总览
- [ ] **设置页** — 音效开关、震动、清除数据

### 已知问题与待修复
- [ ] `index.html` 引用了 `assets/icons/icon-192x192.png` (不存在)，实际只有 `icon.svg`
- [ ] `sw.js` 缓存列表缺少 `snake` 和 `2048`
- [ ] `games-manifest.js` 中 2048 路径带 `./` 前缀，与其他条目不一致
- [ ] `app.js` 的 `updateHighScoreUI` 需要 `this.currentGame?.id`，需验证所有游戏类是否挂载了 `id`

---

## 📁 文件结构

```
GameHub/
├── index.html              # 入口 + Lobby + 游戏容器
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker
├── PROJECT_STATUS.md       # ← 本文档
├── assets/
│   └── icons/
│       └── icon.svg        # PWA 图标 (SVG)
├── css/
│   └── main.css            # 共享主题
├── js/
│   ├── utils.js            # 工具类
│   ├── audio-engine.js     # 音频引擎
│   ├── games-manifest.js   # 游戏注册表
│   └── app.js              # Hub 控制器
└── games/
    ├── tetris/
    │   └── tetris.js
    ├── minesweeper/
    │   └── minesweeper.js
    ├── snake/
    │   └── snake.js
    ├── 2048/
    │   └── 2048.js
    ├── flappy/             # 🚧 待创建
    ├── breakout/           # 🚧 待创建
    ├── pong/               # 🚧 待创建
    └── simon/              # 🚧 待创建
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
- 正确: `'games/flappy/flappy.js'`
- 错误: `'./games/flappy/flappy.js'`

---

## 📅 变更日志

### 2026-05-09
- 创建 PROJECT_STATUS.md 项目状态文档
- 开发 Flappy Bird 游戏 (`games/flappy/flappy.js`)
- 修复 manifest 图标引用 (`index.html` 改用 `icon.svg`)
- 修复 SW 缓存列表 (增加 snake、2048、更新版本 v2)
- 统一 `games-manifest.js` 路径格式 (移除所有 `./` 前缀)
- 补齐游戏注册表中缺失的 `className` 字段 (flappy, breakout, pong, simon)
- 增强 `app.js` 健壮性：所有 `getElementById` 增加存在性检查
- 为 Flappy 添加触摸控制面板 (`setupTouchControls`)
