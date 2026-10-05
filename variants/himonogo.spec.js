// HIMONOGO — 干物碁: 干場 (盤の上下端の列) の石は8手ごとに干されて乾物になり終局時+2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ dried: {} }`;
module.exports = {
    file: 'himonogo.html',
    en: 'HIMONOGO',
    jp: '干物碁',
    prefix: 'himonogo',
    desc: '干場 (上下端の列) の石は8手ごとに干されて乾物に。終局時1枚+2目。',
    kind: 'stone',
    icon: 'himonogo',
    spec: [
        ...K.rb('HIMONOGO', '干物碁', 'himonogo'),
        K.params([
            { key: 'dry_interval', label: '干し上がる間隔', min: 2, max: 20, def: 8, unit: '手ごと' },
            { key: 'dry_bonus', label: '乾物1枚の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 干場: 盤の上下端の列 (海風の通る軒下)
        const HIBA_SET = new Set();
        {
            for (let x = 0; x < BOARD_SIZE; x++) {
                HIBA_SET.add(x); // 上端 y=0
                HIBA_SET.add((BOARD_SIZE - 1) * BOARD_SIZE + x); // 下端
            }
        }`],
        // 干し上がり: 8手ごとに干場の石が乾物になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 干物: 8手ごとに干場の石が乾物になる
            if (history.length > 0 && history.length % Math.max(1, P('dry_interval') || 8) === 0) {
                Object.keys(st.dried).forEach(k => { if (board[+k] !== 1 && board[+k] !== 2) delete st.dried[k]; });
                let dried = 0;
                HIBA_SET.forEach(i => {
                    if ((board[i] === 1 || board[i] === 2) && !st.dried[i]) {
                        st.dried[i] = 1;
                        fxGlow(i, '#fbbf24', 700);
                        dried++;
                    }
                });
                if (dried) fxText((BOARD_SIZE / 2) | 0, '干し上がり!', '#d97706', 1100);
            }

            turn = opponent;`],
        // 乾物集計: 生きている乾物は+2目ずつ
        [K.ONE, `        function endGameByScore() {`, `        // 干物: 乾物を数える
        function himonoBonus() {
            const b = { 1: 0, 2: 0 };
            Object.keys(st.dried || {}).forEach(k => {
                const i = +k;
                if (board[i] === 1 || board[i] === 2) b[board[i]] += (P('dry_bonus') || 2);
            });
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 干物ルール: 乾物になった石は終局時+2目
            {
                const hb = himonoBonus();
                territory.black += hb[1];
                territory.white += hb[2];
            }`],
        // 干場の描画: 陽だまりの帯
        K.CUE_GRID(`            // 干場: 陽だまりの帯
            {
                ctx.save();
                ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
                HIBA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.strokeStyle = 'rgba(180, 120, 20, 0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                HIBA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.3, cy);
                    ctx.lineTo(cx + cellSize * 0.3, cy);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 乾物: 石に小さな魚影マーク
            {
                ctx.save();
                Object.keys(st.dried || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(217, 119, 6, 0.85)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, cellSize * 0.16, cellSize * 0.09, -0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(cx + cellSize * 0.14, cy - cellSize * 0.02);
                    ctx.lineTo(cx + cellSize * 0.24, cy - cellSize * 0.10);
                    ctx.lineTo(cx + cellSize * 0.24, cy + cellSize * 0.06);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'干し上がりまで ' + (Math.max(1, P('dry_interval') || 8) - (history.length % Math.max(1, P('dry_interval') || 8))) + ' 手'`),
        [K.ONE, K.INFO_BASE, `            干物碁: 上下端の干場の石は8手ごとに乾物になり終局時+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の上下端の列は「干場」。干場の石は8手ごとに乾物となり、終局まで生き残れば1枚+2目。',
            '端は普通薄い場所だが、ここでは保存食の棚。干すか取り込むか、潮風の読み合い。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('干場は2列分', HIBA_SET.size === BOARD_SIZE * 2);
        board.fill(0); pieces = []; history.length = 0; st.dried = {};
        board[I(3, 0)] = 1;
        history.push({}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // history=8 → 干し上がり
        assert('8手で乾物になる', st.dried[I(3, 0)] === 1);
        assert('乾物は+2目', himonoBonus()[1] === 2);
        board.fill(0); pieces = []; history.length = 0; st.dried = {};
        assert('通常着手は合法', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
