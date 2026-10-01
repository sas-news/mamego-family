// KINGENERALGO — 金碁: 同色4方向で囲んだ石は「金将」となり +2目。金将は絶対に取れない
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, gold: {} }`;
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
module.exports = {
    file: 'kingeneralgo.html',
    en: 'KINGENERALGO',
    jp: '金碁',
    prefix: 'kingeneralgo',
    desc: '同色4方向で囲んだ石は金将になる: +2目で、取ることのできない無敵区域。',
    kind: 'stone',
    icon: 'kingeneralgo',
    spec: [
        ...K.rb('KINGENERALGO', '金碁', 'kingeneralgo'),
        ...ST(ST_INIT),
        // 金将は取れない: 取り対象から除外
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent).filter(__i => !st.gold[__i]);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 金将判定: 同色4方向に囲まれた石 → +2目 & 無敵
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 金碁: 同色4方向に囲まれた石は金将 +2目 (取れない無敵石)
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const __targets = [__pi, ...getNeighbors(__pi).filter(__n => board[__n] === player)];
                __targets.forEach(__i => {
                    if (st.gold[__i]) return;
                    if (getNeighbors(__i).length >= 4 &&
                        getNeighbors(__i).every(__n => board[__n] === player)) {
                        st.gold[__i] = 1;
                        st.bonus[player] = (st.bonus[player] || 0) + 2;
                        fxText(__i, '金将 +2', '#fbbf24', 1100);
                        fxGlow(__i, '#fbbf24', 900);
                    }
                });
            }

            turn = opponent;`],
        // 金将マーク: 金色の厚いリング
        ...K.STONE_MARKS_SPEC(`            for (const __k of Object.keys(st.gold || {})) {
                const __i = Number(__k);
                if (board[__i] === 0) continue;
                const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = Math.max(2.2, cellSize * 0.09);
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.22, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_ALGO, `            金碁: 同色4方向で囲んだ石は金将。+2目で無敵<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '上下左右4方向すべてを同色の石で囲んだ石は「金将」になる: +2目。',
            '金将は絶対に取ることができない無敵の石 — 広域守備の核。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, gold: {} };
        // (4,4)の上下左右を黒で囲む → 中央着手で金将
        board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('同色4方向で金将+2', st.gold[4 * BOARD_SIZE + 4] === 1 && st.bonus[1] === 2);
        // 金将の無敵性: 白で取ろうとしても消えない
        st.bonus = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2; board[3 * BOARD_SIZE + 4] = 2;
        // 金将の連は黒だが、白が最後の呼吸点を塞いでも金将は取れない
        board[5 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('金将は取れない', board[4 * BOARD_SIZE + 4] === 1);
    `,
};
