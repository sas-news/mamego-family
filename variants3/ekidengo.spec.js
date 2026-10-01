// EKIDENGO — 継走碁: 各プレイヤーの5手ごとの着手は「たすき石」。取ると2個分、終局時も+1点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
// st 永続化一式 (undo/save/load/online)
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
const ST_INIT = `{ n: { 1: 0, 2: 0 }, tasuki: {} }`;
module.exports = {
    file: 'ekidengo.html',
    en: 'EKIDENGO',
    jp: '継走碁',
    prefix: 'ekidengo',
    desc: '5手ごとに「たすき石」が現れる。取ると2個分・残ると+1点の特別石。',
    kind: 'stone',
    icon: 'ekidengo',
    spec: [
        ...K.rb('EKIDENGO', '継走碁', 'ekidengo'),
        K.params([
            { key: 'tasuki_interval', label: 'たすき石の間隔', min: 2, max: 20, def: 5, unit: '手' },
            { key: 'tasuki_bonus', label: 'たすき石の追加アゲハマ', min: 0, max: 4, def: 1, unit: '個' },
            { key: 'tasuki_score', label: 'たすき石の終局ボーナス', min: 0, max: 5, def: 1, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // たすき石は2個分のアゲハマになる (自分の石は取られても2個分失う)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let bonus = 0;
                captured.forEach(idx => {
                    if (st.tasuki[idx]) { bonus++; delete st.tasuki[idx]; }
                    board[idx] = 0;
                });
                captures[player] += captured.length + bonus * (P('tasuki_bonus') || 1); // たすき石は2個分
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 5手ごとの着手を「たすき石」としてマーク
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 継走: 自分の5手ごとの着手は「たすき石」— 取ると2個分、終局時も+1点
            st.n[player] = (st.n[player] || 0) + 1;
            if (st.n[player] % Math.max(1, P('tasuki_interval') || 5) === 0) {
                const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.tasuki[ti] = player;
                fxGlow(ti, '#0ea5e9', 800);
                fxText(ti, 'たすき!', '#0ea5e9', 1100);
            }

            turn = opponent;`],
        // 終局時: 盤上に残ったたすき石は+1点
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const tasukiB = Object.keys(st.tasuki).filter(i => board[i] === 1).length;
            const tasukiW = Object.keys(st.tasuki).filter(i => board[i] === 2).length;
            const blackTotal = territory.black + captures[1] + tasukiB * (P('tasuki_score') || 1);
            const whiteTotal = territory.white + captures[2] + komi + tasukiW * (P('tasuki_score') || 1);`],
        ...K.STONE_MARKS_SPEC(`            // たすき石: 斜めのたすき掛けマーク
            {
                ctx.save();
                Object.keys(st.tasuki || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(14,165,233,0.95)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.10);
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.30, cy + cellSize * 0.30);
                    ctx.lineTo(cx + cellSize * 0.30, cy - cellSize * 0.30);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'たすきまで ' + ((P('tasuki_interval') || 5) - (st.n[turn] || 0) % (P('tasuki_interval') || 5)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            継走碁: 5手ごとの着手は「たすき石」— 取ると2個分・終局時は+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの5手ごと (5・10・15…手目) の着手は「たすき石」になる。',
            'たすき石は取ると2個分のアゲハマ。終局時に盤上に残っていれば+1点のボーナス。',
            '両者に同じ周期で現れる。守るべきか囮にするか、襷を巡る攻防。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 }; st.n = { 1: 0, 2: 0 }; st.tasuki = {};
        let bx = 0, wx = 0;
        for (let i = 0; i < 10; i++) {
            const p = i % 2 === 0 ? 1 : 2;
            executeMove({ cells: [{ x: p === 1 ? bx++ : wx++, y: p === 1 ? 3 : 8 }] }, p);
        }
        assert('黒5手目はたすき石', st.tasuki[3 * BOARD_SIZE + 4] === 1);
        assert('白5手目もたすき石 (対称)', st.tasuki[8 * BOARD_SIZE + 4] === 2);
        // たすき石を取ると2個分
        board.fill(0); pieces = []; prevBoard = null; captures = { 1: 0, 2: 0 };
        st.n = { 1: 0, 2: 0 }; st.tasuki = {};
        board[4 * BOARD_SIZE + 4] = 2; st.tasuki[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('たすき石は2個分のアゲハマ', captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
