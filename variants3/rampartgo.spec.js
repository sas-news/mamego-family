// RAMPARTGO — 石垣碁: 盤を2行の石垣が分断。梯子石 (各2個) だけが垣を越えられる
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
const ST_INIT = `{ ladder: { 1: (P('ladder_count') ?? 2), 2: (P('ladder_count') ?? 2) } }`; // 各側の梯子石
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
    file: 'rampartgo.html',
    en: 'RAMPARTGO',
    jp: '石垣碁',
    prefix: 'rampartgo',
    desc: '2行の石垣が盤を分断。各側2個の梯子石だけが垣を越えられる。',
    kind: 'stone',
    icon: 'rampartgo',
    spec: [
        ...K.rb('RAMPARTGO', '石垣碁', 'rampartgo'),
        K.params([
            { key: 'wall_rows', label: '石垣の行数', min: 1, max: 4, def: 2, unit: '行' },
            { key: 'ladder_count', label: '梯子石の数 (各側)', min: 0, max: 6, def: 2, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 石垣: 中央2行が盤を南北に分断する城壁
        const RAMP_Y0 = Math.floor(BOARD_SIZE / 2) - 1;
        function isRampart(x, y) { const wr = Math.max(1, P('wall_rows') || 2); return y >= RAMP_Y0 && y < RAMP_Y0 + wr; }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let x = 0; x < BOARD_SIZE; x++) {
                const wr = Math.max(1, P('wall_rows') || 2);
                for (let w = 0; w < wr; w++) {
                    const ry = RAMP_Y0 + w;
                    if (ry >= BOARD_SIZE) break;
                    board[ry * BOARD_SIZE + x] = 3;
                }
            }`],
        // 梯子石: 梯子が残っていれば垣の点にも着手できる (着手の度に1個消費)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0 && !(board[p.y * BOARD_SIZE + p.x] === 3 && st.ladder[player] > 0)) return false;
            }`],
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            const ladCells = move.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === 3);
            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            ladCells.forEach(p => {
                st.ladder[player]--;
                const li = p.y * BOARD_SIZE + p.x;
                fxGlow(li, '#f59e0b', 800);
                fxText(li, '梯子!', '#f59e0b', 1000);
            });`],
        // 石垣の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_BRICK('#6b6258', '#3a352f'))],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 石垣: 天端の瓦ライン
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(30, 26, 22, 0.7)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                const wr = Math.max(1, P('wall_rows') || 2);
                Array.from({ length: wr }, (_, w) => RAMP_Y0 + w).filter(ry => ry < BOARD_SIZE).forEach(ry => {
                    const cy = padding + ry * cellSize;
                    ctx.beginPath();
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const cx = padding + x * cellSize;
                        ctx.moveTo(cx - cellSize * 0.4, cy);
                        ctx.lineTo(cx, cy - cellSize * 0.22);
                        ctx.lineTo(cx + cellSize * 0.4, cy);
                    }
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'梯子 黒' + st.ladder[1] + ' / 白' + st.ladder[2]`),
        [K.ONE, K.INFO_BASE, `            石垣碁: 中央2行の石垣が盤を分断。梯子石 (各2個) で垣を越えられる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央2行は石垣 (着手不可・呼吸なし) で南北が分断されている。',
            '梯子石を持っていれば垣の点にも着手できる — 各側2個だけ。梯子石は通常の石。',
            '梯子石が取られるとそこは空点になる — 突破口は一度開けば誰のものでもない。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2);
        assert('石垣が2行ある', board[I(0, RAMP_Y0)] === 3 && board[I(0, RAMP_Y0 + 1)] === 3);
        assert('梯子なしでは垣に置けない', (st.ladder[1] = 0, isValidPlacement([{ x: 4 % BOARD_SIZE, y: RAMP_Y0 }], 1)) === false);
        st.ladder = { 1: 2, 2: 2 };
        assert('梯子で垣を越えられる', isValidPlacement([{ x: 4 % BOARD_SIZE, y: RAMP_Y0 }], 1) === true);
        executeMove({ cells: [{ x: 4 % BOARD_SIZE, y: RAMP_Y0 }] }, 1);
        assert('梯子を消費した', st.ladder[1] === 1 && board[I(4 % BOARD_SIZE, RAMP_Y0)] === 1);
    `,
};
