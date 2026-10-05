// CAPEGO — 岬碁: 盤外周は海。四方の岬(突出部)に置くと海上交通を制する得点
const K = require('../gen_kit.js');
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'capego.html',
    en: 'CAPEGO',
    jp: '岬碁',
    prefix: 'capego',
    desc: '盤外周は海、四方の岬だけが突出部。岬を占めると制海点+2。',
    kind: 'stone',
    icon: 'capego',
    spec: [
        ...K.rb('CAPEGO', '岬碁', 'capego'),
        K.params([
            { key: 'cape_pt', label: '岬の制海点', min: 1, max: 5, def: 2, unit: '点' },
            { key: 'cape_liberty', label: '岬の呼吸ボーナス', min: 1, max: 3, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 海と岬: 盤の外周全てが海。四辺の中央だけが突出した岬 (唯一の外周立地)
        let CAPE_SEA = new Set();
        let CAPE_TIP = new Set();
        function rebuildCape() {
            CAPE_SEA = new Set(); CAPE_TIP = new Set();
            const n = BOARD_SIZE - 1, c = Math.floor(BOARD_SIZE / 2);
            for (let i = 0; i < BOARD_SIZE; i++) {
                [i, n * BOARD_SIZE + i, i * BOARD_SIZE, i * BOARD_SIZE + n].forEach(j => {
                    if (!CAPE_TIP.has(j)) CAPE_SEA.add(j);
                });
            }
            [c, n * BOARD_SIZE + c, c * BOARD_SIZE, c * BOARD_SIZE + n].forEach(j => {
                CAPE_SEA.delete(j); CAPE_TIP.add(j);
            });
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildCape();
            CAPE_SEA.forEach(i => { board[i] = 3; });`],
        // 岬の石は呼吸+1
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (CAPE_TIP.has(curr)) liberties += (P('cape_liberty') || 1); // 岬の石は波に強い
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (CAPE_TIP.has(curr)) liberties += (P('cape_liberty') || 1); // 岬の石は波に強い
            }
            return liberties;`],
        // 制海: 岬に置くと+2点
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const ti = p.y * BOARD_SIZE + p.x;
                if (CAPE_TIP.has(ti)) {
                    st.score[player] += (P('cape_pt') || 2);
                    fxGlow(ti, '#38bdf8', 900);
                    fxText(ti, '制海+' + (P('cape_pt') || 2), '#38bdf8', 1200);
                }
            });`],
        // 海の描画 + 岬の旗印
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        ...K.STONE_MARKS_SPEC(`            // 岬: 白い三角旗がはためく
            {
                ctx.save();
                CAPE_TIP.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + cellSize * 0.32); ctx.lineTo(cx, cy - cellSize * 0.34);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.34);
                    ctx.lineTo(cx + cellSize * 0.24, cy - cellSize * 0.24);
                    ctx.lineTo(cx, cy - cellSize * 0.14);
                    ctx.closePath(); ctx.fill();
                });
                ctx.restore();
            }`),
        // 制海点を終局時にアゲハマ相当として加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'制海 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `            岬碁: 盤外周は海。四辺中央の岬に置くと制海点+2 (岬の石は呼吸+1)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の外周は全て海 (着手不可・呼吸なし)。四辺の中央だけが突出した岬。',
            '岬に石を置くと海上交通を制して制海点+2 (終局時にアゲハマ相当で加算)。',
            '岬の石は波を受けても崩れない — 呼吸点+1。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2), n = BOARD_SIZE - 1;
        assert('外周は海', board[I(0, 0)] === 3 && board[I(1, 0)] === 3);
        assert('海は打てない', isValidPlacement([{ x: 1, y: 0 }], 1) === false);
        assert('岬は4つ', CAPE_TIP.size === 4);
        assert('岬は打てる', isValidPlacement([{ x: c, y: 0 }], 1) === true);
        pieces = []; history.length = 0; turn = 1; st.score = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: c, y: 0 }] }, 1);
        assert('岬で制海+2', st.score[1] === 2 && board[I(c, 0)] === 1);
    `,
};
