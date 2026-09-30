// HANDCUFFGO — 手錠碁: 5個置くごとに1個に手錠が掛かる。錠の石は12手の間取られない。隣に置くと外れる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, cuffs: {} }`;
module.exports = {
    file: 'handcuffgo.html',
    en: 'HANDCUFFGO',
    jp: '手錠碁',
    prefix: 'handcuffgo',
    desc: '5個置くごとに置いた石に手錠。錠の石は12手の間取られないが、隣に自石を置くと外れる。',
    kind: 'stone',
    icon: 'handcuffgo',
    spec: [
        ...K.rb('HANDCUFFGO', '手錠碁', 'handcuffgo'),
        ...ST(ST_INIT),
        // 5個毎に手錠 + 隣接配置で錠が外れる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const gi = p.y * BOARD_SIZE + p.x;
                board[gi] = player;
            });
            // 手錠: 5個置くごとに今置いた石に錠が掛かる (12手)
            st.placed[player]++;
            if (st.placed[player] % 5 === 0) {
                const li = move.cells[move.cells.length - 1].y * BOARD_SIZE + move.cells[move.cells.length - 1].x;
                st.cuffs[li] = history.length + 12;
                fxText(li, '錠!', '#f59e0b', 1100);
            }
            // 錠の解除: 自石の隣に置くとその石の錠が外れる (連鎖はしない)
            move.cells.forEach(p => {
                getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                    if (board[n] === player && st.cuffs[n] && !move.cells.some(q => q.y * BOARD_SIZE + q.x === n)) {
                        delete st.cuffs[n];
                        fxText(n, '錠が外れた', '#fbbf24', 900);
                    }
                });
            });`],
        // 錠の石は取られない
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            // 手錠の掛かった石は取られない
            captured = captured.filter(i => !(st.cuffs[i] && st.cuffs[i] >= history.length));
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 錠の期限切れ掃除
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 錠の掃除: 期限切れ・盤上に無いものを除去
            Object.keys(st.cuffs).forEach(k => { if (st.cuffs[k] < history.length || (board[+k] !== 1 && board[+k] !== 2)) delete st.cuffs[k]; });

            turn = opponent;`],
        // 錠マーク
        ...K.STONE_MARKS_SPEC(`
            Object.keys(st.cuffs).forEach(k => {
                const i = +k;
                if (st.cuffs[k] < history.length || (board[i] !== 1 && board[i] !== 2)) return;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(mx, my, cellSize * 0.34, Math.PI * 0.15, Math.PI * 1.35);
                ctx.stroke();
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(mx - cellSize * 0.05, my - cellSize * 0.02, cellSize * 0.1, cellSize * 0.14);
            });`),
        ...K.EVENT_CHIP_SPEC(`'錠 ' + Object.keys(st.cuffs).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            手錠碁: 5個置く毎に今の石に手錠。錠の石は12手の間取られないが、隣に置くと外れる<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分が5個置くごとに、今置いた石に手錠が掛かる (橙色のマーク)。',
            '錠の掛かった石は12手の間、取られない。',
            'ただし錠の石の隣に自石を置くと錠が外れる。繋げると守りが解ける攻防。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.placed = { 1: 4, 2: 0 }; st.cuffs = {};
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('5個目に錠が掛かる', st.cuffs[5 * BOARD_SIZE + 5] > history.length);
        // 錠の石は完全に囲まれても取られない
        [[5, 4], [5, 6], [4, 5], [6, 5]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('錠の石は取られない', board[5 * BOARD_SIZE + 5] === 1);
        // 隣に置くと外れる (1面を開けてから隣接着手)
        board[4 * BOARD_SIZE + 5] = 0;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('隣接で錠が外れる', !st.cuffs[5 * BOARD_SIZE + 5]);
    `,
};
