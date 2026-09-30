// OBSIDIANGO — 玻璃碁: 置いた石の隣の敵石は玻璃に切られて「傷」を負う。傷2つで石は砕けて取られる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                moveCapFired = true;
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
module.exports = {
    file: 'obsidiango.html',
    en: 'OBSIDIANGO',
    jp: '玻璃碁',
    prefix: 'obsidiango',
    desc: '玻璃の刃 — 着手は隣の敵石に傷を刻む。傷2つでその石は砕けて取られる。',
    kind: 'stone',
    icon: 'obsidiango',
    spec: [
        ...K.rb('OBSIDIANGO', '玻璃碁', 'obsidiango'),
        ...ST('{ wound: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 玻璃碁: 隣の敵石に傷を刻む。傷2つで砕けて取られる
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(mi).forEach(n => {
                    if (board[n] !== opponent) return;
                    st.wound[n] = (st.wound[n] || 0) + 1;
                    if (st.wound[n] >= 2) {
                        board[n] = 0;
                        captures[player]++;
                        delete st.wound[n];
                        fxBurst(n, '#a78bfa', 16);
                        fxText(n, '断裂', '#8b5cf6', 1100);
                    } else {
                        fxSplash(n, '#c4b5fd');
                        fxText(n, '傷', '#a78bfa', 800);
                    }
                });
                for (const k in st.wound) if (board[k] === 0 || board[k] === 3) delete st.wound[k];
            }

            turn = opponent;`],
        // 傷のある石は紫のひび割れ線
        ...K.STONE_MARKS_SPEC(`            // 玻璃の傷: 傷ついた石に紫のひび線
            {
                ctx.save();
                for (const k in st.wound) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.3;
                    ctx.strokeStyle = 'rgba(167,139,250,0.95)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy - r * 0.4); ctx.lineTo(cx - r * 0.15, cy); ctx.lineTo(cx - r * 0.4, cy + r);
                    ctx.moveTo(cx + r * 0.3, cy - r); ctx.lineTo(cx + r * 0.1, cy - r * 0.1); ctx.lineTo(cx + r, cy + r * 0.3);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            玻璃碁: 着手の隣の敵石は傷を負う。傷2つで砕けて取られる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を置くと隣接する敵石すべてに1つの傷が刻まれる。',
            '傷が2つ貯まった敵石は砕け、着手側のアゲハマになる。',
            '敵石を挟んで2手かけると断ち切れる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.wound = {};
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 隣 → 傷1
        assert('隣の敵に傷がつく', st.wound[I(4, 4)] === 1 && board[I(4, 4)] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // もう隣 → 傷2で断裂
        assert('傷2で敵石が砕ける', board[I(4, 4)] === 0);
        assert('砕いた石はアゲハマ', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
