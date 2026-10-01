// NETGRAPHGO — グラフ碁: 交点=頂点、連=辺。同色3方向以上に接する「ハブ石」は +1目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, hub: {} }`;
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
    file: 'netgraphgo.html',
    en: 'NETGRAPHGO',
    jp: 'グラフ碁',
    prefix: 'netgraphgo',
    desc: 'グラフ理論の碁: 同色3方向以上に接する高次数「ハブ石」を作ると +1目。',
    kind: 'stone',
    icon: 'netgraphgo',
    spec: [
        ...K.rb('NETGRAPHGO', 'グラフ碁', 'netgraphgo'),
        K.params([
            { key: 'hub_deg', label: 'ハブに必要な次数', min: 2, max: 4, def: 3, unit: '方向' },
            { key: 'hub_bonus', label: 'ハブボーナス', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 次数3以上のハブ石 → +1目 (石ごとに1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // グラフ碁: 同色隣接3以上の頂点 (次数≥3) はハブとして +1目
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __targets = [__pi, ...getNeighbors(__pi).filter(__n => board[__n] === player)];
                __targets.forEach(__i => {
                    if (st.hub[__i]) return;
                    const __deg = getNeighbors(__i).filter(__n => board[__n] === player).length;
                    if (__deg >= (P('hub_deg') || 3)) {
                        st.hub[__i] = 1;
                        st.bonus[player] = (st.bonus[player] || 0) + (P('hub_bonus') || 1);
                        fxText(__i, 'ハブ +' + (P('hub_bonus') || 1), '#60a5fa', 1000);
                        fxGlow(__i, '#60a5fa', 700);
                    }
                });
            }

            turn = opponent;`],
        // ハブ石に小さな白い結点リングを描画
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.hub || {})) {
                const __i = Number(__k);
                if (board[__i] !== 1 && board[__i] !== 2) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(96,165,250,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`'ハブ +' + ((st.bonus && st.bonus[turn]) || 0) + '目'`),
        [K.ONE, K.INFO_ALGO, `            グラフ碁: 同色3方向以上に繋がるハブ石を作ると +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '交点は頂点、連は辺。同色の石と3方向以上に接した石は次数の高い「ハブ」。',
            'ハブを作ると +1目 (石ごとに1回)。分岐の多いネットワークを築くほど稼げる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, hub: {} };
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('ハブ未成立ではボーナスなし', st.bonus[1] === 0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // (4,4)は3方向同色 → ハブ
        assert('次数3でハブ成立', st.hub[4 * BOARD_SIZE + 4] === 1 && st.bonus[1] === 1);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 次数4になるがハブ済み
        assert('ハブは1回のみ', st.bonus[1] === 1);
    `,
};
