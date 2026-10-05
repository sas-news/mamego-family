// OOMAGAGO — 大駒碁: 2手目の着手が「大駒」。生誕時に8方向の孤立敵石を取り、失うとアゲハマが半減
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, ooma: { 1: -1, 2: -1 }, nerf: { 1: 0, 2: 0 } }`;
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
    file: 'oomagago.html',
    en: 'OOMAGAGO',
    jp: '大駒碁',
    prefix: 'oomagago',
    desc: '2手目の石が大駒: 生誕時に8方向の孤立敵石を制圧。大駒を失うとアゲハマが半減する。',
    kind: 'stone',
    icon: 'oomagago',
    spec: [
        ...K.rb('OOMAGAGO', '大駒碁', 'oomagago'),
        K.params([
            { key: 'ooma_move', label: '大駒になる手数', min: 1, max: 5, def: 2, unit: '手目' },
            { key: 'nerf_div', label: '喪失時のアゲハマ割合', options: [{ v: 2, l: '半減 (1/2)' }, { v: 3, l: '1/3' }, { v: 4, l: '1/4' }], def: 2 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 大駒喪失でアゲハマ半減
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += st.nerf[player] ? Math.ceil(captured.length / (P('nerf_div') || 2)) : captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 大駒: 自軍2手目が大駒 (8方向の孤立敵石を取る)。大駒喪失でアゲハマ半減
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 大駒碁: 自軍2手目の着手が大駒。8方向レイで孤立敵石を制圧
            {
                st.placed[player] = (st.placed[player] || 0) + 1;
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                if (st.placed[player] === Math.max(1, P('ooma_move') || 2) && st.ooma[player] < 0) {
                    st.ooma[player] = __pi;
                    const __e = BOARD_SIZE - 1;
                    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
                        let x = __p.x + dx, y = __p.y + dy;
                        while (x >= 0 && x <= __e && y >= 0 && y <= __e) {
                            const __i = y * BOARD_SIZE + x;
                            if (board[__i] === 0) { x += dx; y += dy; continue; }
                            if (board[__i] === opponent) {
                                const __iso = getNeighbors(__i).filter(__n => board[__n] === opponent).length === 0;
                                if (__iso) {
                                    board[__i] = 0;
                                    captures[player]++;
                                    fxText(__i, '大駒!', '#e11d48', 1100);
                                    fxBurst(__i, '#e11d48', 10, 1.6);
                                }
                            }
                            break;
                        }
                    });
                    cleanUpPieces();
                    fxGlow(__pi, '#e11d48', 1100);
                }
                // 大駒を失った側はアゲハマ半減
                [1, 2].forEach(__pl => {
                    if (st.ooma[__pl] >= 0 && board[st.ooma[__pl]] !== __pl) {
                        st.ooma[__pl] = -2;
                        st.nerf[__pl] = 1;
                        fxText(__pi, '大駒喪失!', '#64748b', 1300);
                    }
                });
            }

            turn = opponent;`],
        // 大駒マーク: 石の上に深紅の米印
        ...K.STONE_MARKS_SPEC(`            for (const __p2 of [1, 2]) {
                const __i = st.ooma[__p2];
                if (__i === undefined || __i < 0 || board[__i] !== __p2) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                const __r = cellSize * 0.16;
                ctx.save();
                ctx.strokeStyle = '#e11d48';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(__cx - __r, __cy); ctx.lineTo(__cx + __r, __cy);
                ctx.moveTo(__cx, __cy - __r); ctx.lineTo(__cx, __cy + __r);
                ctx.moveTo(__cx - __r * 0.7, __cy - __r * 0.7); ctx.lineTo(__cx + __r * 0.7, __cy + __r * 0.7);
                ctx.moveTo(__cx + __r * 0.7, __cy - __r * 0.7); ctx.lineTo(__cx - __r * 0.7, __cy + __r * 0.7);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            大駒碁: 2手目の石が大駒。生誕時に8方向を制圧、失うとアゲハマ半減<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の2手目に置いた石は「大駒」 (飛車+角行)。生まれた瞬間、8方向の孤立敵石を取る。',
            '大駒が取られると以後その軍のアゲハマは半減 — 大駒を守ることが戦力維持になる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { placed: { 1: 0, 2: 0 }, ooma: { 1: -1, 2: -1 }, nerf: { 1: 0, 2: 0 } };
        board[6 * BOARD_SIZE + 6] = 2; // (6,6)孤立した白
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 1手目
        executeMove({ cells: [{ x: 6, y: 2 }] }, 1); // 2手目 → 大駒
        assert('2手目が大駒', st.ooma[1] === 2 * BOARD_SIZE + 6);
        assert('大駒が孤立敵石を取る', board[6 * BOARD_SIZE + 6] === 0 && captures[1] === 1);
        // 大駒喪失でアゲハマ半減
        board[2 * BOARD_SIZE + 6] = 0; // 大駒を盤から消す (取られた状況)
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('大駒喪失で半減フラグ', st.nerf[1] === 1);
    `,
};
