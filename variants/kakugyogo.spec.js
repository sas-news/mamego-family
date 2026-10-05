// KAKUGYOGO — 角行碁: 6手ごとの着手が「角行」となり斜め4方向の孤立敵石を串刺しにする
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, bishop: {} }`;
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
    file: 'kakugyogo.html',
    en: 'KAKUGYOGO',
    jp: '角行碁',
    prefix: 'kakugyogo',
    desc: '6手ごとの着手が角行になる — 斜めレイが孤立敵石を貫き串刺しにする。',
    kind: 'stone',
    icon: 'kakugyogo',
    spec: [
        ...K.rb('KAKUGYOGO', '角行碁', 'kakugyogo'),
        K.params([
            { key: 'bishop_interval', label: '角行になる間隔', min: 2, max: 15, def: 6, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 角行: 6手ごとの着手が角行。斜め4方向レイで孤立敵石を全て貫いて取る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 角行碁: 自軍の6の倍数手が角行。斜めレイで孤立敵石を串刺し (貫通) する
            {
                st.placed[player] = (st.placed[player] || 0) + 1;
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                if (st.placed[player] % Math.max(1, P('bishop_interval') || 6) === 0) {
                    st.bishop[__pi] = 1;
                    const __e = BOARD_SIZE - 1;
                    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
                        let x = __p.x + dx, y = __p.y + dy;
                        while (x >= 0 && x <= __e && y >= 0 && y <= __e) {
                            const __i = y * BOARD_SIZE + x;
                            if (board[__i] === 0) { x += dx; y += dy; continue; }
                            if (board[__i] === opponent) {
                                const __iso = getNeighbors(__i).filter(__n => board[__n] === opponent).length === 0;
                                if (__iso) {
                                    board[__i] = 0;
                                    captures[player]++;
                                    fxText(__i, '角行!', '#8b5cf6', 1100);
                                    fxBurst(__i, '#8b5cf6', 10, 1.6);
                                    x += dx; y += dy; continue; // 串刺し: 孤立敵石を貫いて進む
                                }
                            }
                            break; // 非孤立敵または自軍の石はレイを遮る
                        }
                    });
                    cleanUpPieces();
                    fxGlow(__pi, '#8b5cf6', 900);
                }
            }

            turn = opponent;`],
        // 角行マーク: 石の上に紫のX字
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.bishop || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.14;
                ctx.save();
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(__cx - __r, __cy - __r); ctx.lineTo(__cx + __r, __cy + __r);
                ctx.moveTo(__cx + __r, __cy - __r); ctx.lineTo(__cx - __r, __cy + __r);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            角行碁: 6手ごとの着手が角行になり斜めの孤立敵石を串刺し<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の6手目・12手目…の着手は「角行」。斜め4方向へ伸びるレイは、',
            '孤立した敵石を全て貫き通して取る (連結している敵石は遮る)。斜め制圧の碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { placed: { 1: 5, 2: 0 }, bishop: {} };
        board[7 * BOARD_SIZE + 7] = 2; // (7,7)孤立した白
        board[8 * BOARD_SIZE + 8] = 2; // (8,8)も孤立した白 (串刺し対象)
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 6手目 → 角行
        assert('角行になる', st.bishop[6 * BOARD_SIZE + 6] === 1);
        assert('孤立敵石を串刺しで2枚取る', board[7 * BOARD_SIZE + 7] === 0 && board[8 * BOARD_SIZE + 8] === 0 && captures[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 7手目は通常着手
        assert('7手目は角行にならない', st.bishop[0] === undefined);
    `,
};
