// KYOSHAGO — 香車碁: 6手ごとの着手が「香車」となり正面1方向の孤立敵石を貫く
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, lance: {} }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kyoshago.html',
    en: 'KYOSHAGO',
    jp: '香車碁',
    prefix: 'kyoshago',
    desc: '6手ごとの着手が香車になる — 敵陣へ向かう正面1方向だけの一撃で孤立敵石を取る。',
    kind: 'stone',
    icon: 'kyoshago',
    spec: [
        ...K.rb('KYOSHAGO', '香車碁', 'kyoshago'),
        K.params([
            { key: 'lance_interval', label: '香車が出る間隔', min: 2, max: 15, def: 6, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 香車: 6手ごとの着手が香車。敵陣方向1レイで最初の孤立敵石を取る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 香車碁: 自軍の6の倍数手が香車。前方 (黒は下・白は上) 1レイのみ
            {
                st.placed[player] = (st.placed[player] || 0) + 1;
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                if (st.placed[player] % Math.max(1, P('lance_interval') || 6) === 0) {
                    st.lance[__pi] = 1;
                    const __e = BOARD_SIZE - 1;
                    const __dy = player === 1 ? 1 : -1; // 黒は下へ、白は上へ
                    let x = __p.x, y = __p.y + __dy;
                    while (x >= 0 && x <= __e && y >= 0 && y <= __e) {
                        const __i = y * BOARD_SIZE + x;
                        if (board[__i] === 0) { y += __dy; continue; }
                        if (board[__i] === opponent) {
                            const __iso = getNeighbors(__i).filter(__n => board[__n] === opponent).length === 0;
                            if (__iso) {
                                board[__i] = 0;
                                captures[player]++;
                                fxText(__i, '香車!', '#f97316', 1100);
                                fxBurst(__i, '#f97316', 10, 1.6);
                            }
                        }
                        break; // 石はレイを遮る
                    }
                    cleanUpPieces();
                    fxGlow(__pi, '#f97316', 900);
                }
            }

            turn = opponent;`],
        // 香車マーク: 石の上に橙の前向き矢印
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.lance || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.15;
                ctx.save();
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(__cx, __cy + __r); ctx.lineTo(__cx, __cy - __r);
                ctx.moveTo(__cx - __r * 0.6, __cy - __r * 0.3);
                ctx.lineTo(__cx, __cy - __r); ctx.lineTo(__cx + __r * 0.6, __cy - __r * 0.3);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            香車碁: 6手ごとの着手が香車になり前方の孤立敵石を取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の6手目・12手目…の着手は「香車」。敵陣へ向かう正面1方向へ伸び、',
            '最初に見つけた連結していない敵石を取る。一方向だけの一撃 — 打つ向きが肝心。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { placed: { 1: 5, 2: 0 }, lance: {} };
        board[6 * BOARD_SIZE + 6] = 2; // (6,6)前方の孤立白
        board[2 * BOARD_SIZE + 6] = 2; // (6,2)後方の孤立白
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // 黒6手目 → 香車 (前方=下)
        assert('香車になる', st.lance[4 * BOARD_SIZE + 6] === 1);
        assert('前方の孤立敵石を取る', board[6 * BOARD_SIZE + 6] === 0 && captures[1] === 1);
        assert('後方は取れない', board[2 * BOARD_SIZE + 6] === 2);
    `,
};
