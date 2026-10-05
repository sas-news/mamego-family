// PLASTERGO — 左官碁: 石は漆喰。自軍の石が辺で隣接すると塗り固まり壁 (連) になる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'plastergo.html',
    en: 'PLASTERGO',
    jp: '左官碁',
    prefix: 'plastergo',
    desc: '石は漆喰。辺に接した自軍の連は塗り固まり、壁として呼吸を与えない。',
    kind: 'stone',
    icon: 'plastergo',
    spec: [
        ...K.rb('PLASTERGO', '左官碁', 'plastergo'),
        K.params([{ key: 'edge_cost', label: '辺連の呼吸減', min: 0, max: 3, def: 1, unit: '点' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        // 辺に接した連は「漆喰の壁」= 呼吸点として数えない (相手から見ても自分から見ても)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        // 辺に張り付いた連は漆喰の壁として機能: 呼吸点を1消費
                        const edgeStone = group.some(g => g < BOARD_SIZE || g >= BOARD_SIZE * (BOARD_SIZE - 1) || g % BOARD_SIZE === 0 || g % BOARD_SIZE === BOARD_SIZE - 1);
                        if (edgeStone) liberties = Math.max(0, liberties - (P('edge_cost') || 1));
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
            }
            // 辺に張り付いた連は壁として呼吸点を1消費
            const grp = [...visited.map((v, k) => v ? k : -1)].filter(k => k >= 0);
            const edgeStone = grp.some(g => g < BOARD_SIZE || g >= BOARD_SIZE * (BOARD_SIZE - 1) || g % BOARD_SIZE === 0 || g % BOARD_SIZE === BOARD_SIZE - 1);
            if (edgeStone) liberties = Math.max(0, liberties - (P('edge_cost') || 1));
            return liberties;`],
        // 辺の石には漆喰のこて跡 (白い刷毛筋)
        ...K.STONE_MARKS_SPEC(`            // 辺の石は漆喰が固まった印: 白い刷毛筋2本
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                ctx.lineCap = 'round';
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const onEdge = (x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1);
                    if (!onEdge) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.16, cy - cellSize * 0.06);
                    ctx.lineTo(cx + cellSize * 0.16, cy - cellSize * 0.06);
                    ctx.moveTo(cx - cellSize * 0.12, cy + cellSize * 0.08);
                    ctx.lineTo(cx + cellSize * 0.12, cy + cellSize * 0.08);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            左官碁: 辺に接した自軍の連は漆喰が固まり壁になる (連の呼吸点が1減る)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石は漆喰。辺に接した連は塗り固まって壁となり、その連の呼吸点が1減る。',
            '辺を活かすと硬いが、壁化した連は少し脆くなる — 中央との兼ね合いが腕の見せ所。',
            '両者同じ条件なので先手だけ得することはない。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(4, 0)] = 1; // 辺の黒
        assert('辺の石は呼吸-1', getLiberties(board, I(4, 0)) === 2);
        board.fill(0);
        board[I(4, 4)] = 1; // 中央の黒
        assert('中央の石は普通', getLiberties(board, I(4, 4)) === 4);
        board.fill(0);
        board[I(4, 0)] = 1; board[I(5, 0)] = 1; // 辺の連
        assert('辺の連も呼吸-1', getLiberties(board, I(4, 0)) === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
