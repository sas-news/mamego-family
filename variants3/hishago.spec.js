// HISHAGO — 飛車碁: 6手ごとの着手が「飛車」となり縦横4方向の孤立敵石を制圧する
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, rook: {} }`;
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
    file: 'hishago.html',
    en: 'HISHAGO',
    jp: '飛車碁',
    prefix: 'hishago',
    desc: '6手ごとの着手が飛車になる — 縦横4方向の最も近い孤立敵石を取る。',
    kind: 'stone',
    icon: 'hishago',
    spec: [
        ...K.rb('HISHAGO', '飛車碁', 'hishago'),
        K.params([
            { key: 'rook_interval', label: '飛車になる間隔', min: 2, max: 16, def: 6, unit: '手ごと' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 飛車: 6手ごとの着手が飛車となり4方向レイで孤立敵石を取る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 飛車碁: 自軍の6の倍数手が飛車。縦横レイで最初の孤立敵石を取る
            {
                st.placed[player] = (st.placed[player] || 0) + 1;
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                if (st.placed[player] % Math.max(1, P('rook_interval') || 6) === 0) {
                    st.rook[__pi] = 1;
                    const __e = BOARD_SIZE - 1;
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        let x = __p.x + dx, y = __p.y + dy;
                        while (x >= 0 && x <= __e && y >= 0 && y <= __e) {
                            const __i = y * BOARD_SIZE + x;
                            if (board[__i] === 0) { x += dx; y += dy; continue; }
                            if (board[__i] === opponent) {
                                const __iso = getNeighbors(__i).filter(__n => board[__n] === opponent).length === 0;
                                if (__iso) {
                                    board[__i] = 0;
                                    captures[player]++;
                                    fxText(__i, '飛車!', '#ef4444', 1100);
                                    fxBurst(__i, '#ef4444', 10, 1.6);
                                }
                            }
                            break; // 石 (非孤立敵または自軍) はレイを遮る
                        }
                    });
                    cleanUpPieces();
                    fxGlow(__pi, '#ef4444', 900);
                }
            }

            turn = opponent;`],
        // 飛車マーク: 石の上に赤い十字
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.rook || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.15;
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(__cx - __r, __cy); ctx.lineTo(__cx + __r, __cy);
                ctx.moveTo(__cx, __cy - __r); ctx.lineTo(__cx, __cy + __r);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            飛車碁: 6手ごとの着手が飛車になり縦横の孤立敵石を取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の6手目・12手目…の着手は「飛車」。飛車は縦横4方向へ伸び、',
            '各方向で最初に見つけた連結していない敵石を取る。孤立した石が危ない碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { placed: { 1: 5, 2: 0 }, rook: {} };
        board[6 * BOARD_SIZE + 6] = 2; // (6,6)孤立した白
        board[6 * BOARD_SIZE + 8] = 2; board[6 * BOARD_SIZE + 9] = 2; // (8,6)(9,6)連結した白
        executeMove({ cells: [{ x: 6, y: 2 }] }, 1); // 6手目 → 飛車
        assert('飛車になる', st.rook[2 * BOARD_SIZE + 6] === 1);
        assert('孤立敵石をレイで取る', board[6 * BOARD_SIZE + 6] === 0 && captures[1] === 1);
        assert('連結した敵石は取れない', board[6 * BOARD_SIZE + 8] === 2);
    `,
};
