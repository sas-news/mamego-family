// SHOYUGO — 醤油碁: 醤油蔵区域の石は6手ごとに熟成が進み、終局時に熟成度×1目の風味がつく
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
const ST_INIT = `{ aged: {} }`;
module.exports = {
    file: 'shoyugo.html',
    en: 'SHOYUGO',
    jp: '醤油碁',
    prefix: 'shoyugo',
    desc: '醤油蔵の石は6手ごとに熟成が進む。終局時に熟成度×1目の風味。',
    kind: 'stone',
    icon: 'shoyugo',
    spec: [
        ...K.rb('SHOYUGO', '醤油碁', 'shoyugo'),
        K.params([
            { key: 'age_interval', label: '熟成の間隔', min: 2, max: 16, def: 6, unit: '手' },
            { key: 'age_max', label: '熟成の上限', min: 1, max: 8, def: 3, unit: '段' },
            { key: 'flavor_pts', label: '熟成1段の風味', min: 0, max: 3, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 醤油蔵: 対角位置の2つの3x3区域
        const KURA_SET = new Set();
        {
            const kc = Math.floor(BOARD_SIZE / 3);
            [[kc, BOARD_SIZE - 1 - kc], [BOARD_SIZE - 1 - kc, kc]].forEach(([cx, cy]) => {
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    KURA_SET.add((cy + dy) * BOARD_SIZE + (cx + dx));
                }
            });
        }`],
        // 熟成: 6手ごとに蔵内の石が熟成+1 (最大3)。双方同じ周期
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 醤油の熟成: 6手ごとに蔵の石の熟成が一段階進む
            if (history.length > 0 && history.length % (P('age_interval') || 6) === 0) {
                Object.keys(st.aged).forEach(k => { if (board[+k] !== 1 && board[+k] !== 2) delete st.aged[k]; });
                let aged = 0;
                KURA_SET.forEach(i => {
                    if (board[i] === 1 || board[i] === 2) {
                        st.aged[i] = Math.min(P('age_max') || 3, (st.aged[i] || 0) + 1);
                        fxGlow(i, '#92400e', 500);
                        aged++;
                    }
                });
                if (aged) fxText([...KURA_SET][0], '熟成', '#b45309', 1000);
            }

            turn = opponent;`],
        // 風味集計: 蔵内の石の熟成度合計を得点へ
        [K.ONE, `        function endGameByScore() {`, `        // 醤油: 熟成度の合計
        function shoyuBonus() {
            const b = { 1: 0, 2: 0 };
            Object.keys(st.aged || {}).forEach(k => {
                const i = +k;
                if (board[i] === 1 || board[i] === 2) b[board[i]] += st.aged[i];
            });
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 醤油ルール: 蔵の石の熟成度×1目の風味
            {
                const sb = shoyuBonus();
                territory.black += sb[1] * (P('flavor_pts') ?? 1);
                territory.white += sb[2] * (P('flavor_pts') ?? 1);
            }`],
        // 蔵の地色
        K.CUE_GRID(`            // 醤油蔵: 深い琥珀の木樽区域
            {
                ctx.save();
                ctx.fillStyle = 'rgba(120, 53, 15, 0.20)';
                KURA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                KURA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.strokeRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 熟成中の石: 琥珀の滴マーク
            {
                ctx.save();
                Object.keys(st.aged || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    for (let d = 0; d < st.aged[i]; d++) {
                        ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
                        ctx.beginPath();
                        ctx.arc(cx + (d - (st.aged[i] - 1) / 2) * cellSize * 0.18, cy + cellSize * 0.22, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'熟成まで ' + ((P('age_interval') || 6) - (history.length % (P('age_interval') || 6))) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            醤油碁: 蔵区域の石は6手ごとに熟成 (最大3段階)。終局時に熟成度×1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '対角の2つの「醤油蔵」区域。蔵に置いた石は6手ごとに熟成が1段進み (最大3段)、終局時に熟成度×1目の風味がつく。',
            '熟成は両者同じ速さで進む。蔵を守って寝かせるか、相手の樽を荒らすか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('醤油蔵は18点', KURA_SET.size === 18);
        board.fill(0); pieces = []; history.length = 0; st.aged = {};
        const zi = [...KURA_SET][0];
        board[zi] = 1;
        history.push({}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // history=6 → 熟成
        assert('6手で熟成する', st.aged[zi] === 1);
        assert('熟成の風味がつく', shoyuBonus()[1] === 1);
        board.fill(0); pieces = []; history.length = 0; st.aged = {};
        assert('通常着手は合法', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
