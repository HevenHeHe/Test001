/**
 * NEON PROTOCOL - Game Manifest
 * Registry of all available games
 */

const GAMES_MANIFEST = [
    {
        id: 'tetris',
        name: 'TETRIS',
        description: '经典方块堆叠',
        icon: '🟦',
        color: 'linear-gradient(135deg, #00f0ff, #0060ff)',
        path: 'games/tetris/tetris.js',
        className: 'TetrisGame',
        category: 'arcade',
        players: 1,
        difficulty: 'medium'
    },
    {
        id: 'minesweeper',
        name: 'MINESWEEPER',
        description: '数字扫雷推理',
        icon: '💣',
        color: 'linear-gradient(135deg, #ff00ff, #ff0040)',
        path: 'games/minesweeper/minesweeper.js',
        className: 'MinesweeperGame',
        category: 'puzzle',
        players: 1,
        difficulty: 'hard'
    },
    {
        id: 'snake',
        name: 'SNAKE',
        description: '经典贪吃蛇',
        icon: '🐍',
        color: 'linear-gradient(135deg, #00ff40, #00ff00)',
        path: 'games/snake/snake.js',
        className: 'SnakeGame',
        category: 'arcade',
        players: 1,
        difficulty: 'easy'
    },
    {
        id: '2048',
        name: '2048',
        description: '数字合成挑战',
        icon: '🔢',
        color: 'linear-gradient(135deg, #ff8000, #ff0040)',
        path: 'games/2048/2048.js',
        className: 'Game2048',
        category: 'puzzle',
        players: 1,
        difficulty: 'medium'
    },
    {
        id: 'flappy',
        name: 'FLAPPY',
        description: '管道飞行挑战',
        icon: '🐦',
        color: 'linear-gradient(135deg, #ffff00, #ff8000)',
        path: 'games/flappy/flappy.js',
        className: 'FlappyGame',
        category: 'endless',
        players: 1,
        difficulty: 'hard'
    },
    {
        id: 'breakout',
        name: 'BREAKOUT',
        description: '弹球破砖块',
        icon: '🧱',
        color: 'linear-gradient(135deg, #ff0040, #8000ff)',
        path: 'games/breakout/breakout.js',
        className: 'BreakoutGame',
        category: 'arcade',
        players: 1,
        difficulty: 'easy'
    },
    {
        id: 'pong',
        name: 'PONG',
        description: '双人弹球对战',
        icon: '🏓',
        color: 'linear-gradient(135deg, #00f0ff, #00ff40)',
        path: 'games/pong/pong.js',
        className: 'PongGame',
        category: 'multiplayer',
        players: 2,
        difficulty: 'easy'
    },
    {
        id: 'simon',
        name: 'SIMON',
        description: '记忆序列挑战',
        icon: '🎵',
        color: 'linear-gradient(135deg, #ff00ff, #00f0ff)',
        path: 'games/simon/simon.js',
        className: 'SimonGame',
        category: 'memory',
        players: 1,
        difficulty: 'medium'
    }
];
