// NURIKABEGO — 塗壁碁: 6手ごとに置く石は塗り壁に化けて動かぬ壁になる。壁は呼吸も領地も通さない
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
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
const ST_INIT = `{ cnt: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'nurikabego.html',
    en: 'NURIKABEGO',
    jp: '塗壁碁',
    prefix: 'nurikabego',
    desc: '6手ごとに置く石は塗り壁に化ける。壁は取れず、呼吸も領地も塞ぐ。',
    kind: 'stone',
    icon: 'nurikabego',
    spec: [
        ...K.rb('NURIKABEGO', '塗壁碁', 'nurikabego'),
        ...ST(ST_INIT),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            st.cnt[player]++;`],
        // 塗り壁: 6手目の石は壁(board=3)に化ける — 取れず呼吸も通さない
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 塗壁碁: 6手ごとの石は塗り壁になる
            if (st.cnt[player] % 6 === 0) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[ci] === player) {
                    board[ci] = 3;
                    pieces = pieces.filter(p => p.idx !== ci);
                    fxBurst(ci, '#d6d3d1', 10, 1.5);
                    fxText(ci, '塗壁!', '#e7e5e4', 1000);
                }
            }

            turn = opponent;`],
        // 壁の描画: pieces に無いので自前で塗る
        ...K.STONE_MARKS_SPEC(`            // 塗り壁 (board=3): 白漆喰の壁ブロック
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 3) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = '#e7e5e4';
                    ctx.fillRect(cx - cellSize * 0.48, cy - cellSize * 0.48, cellSize * 0.96, cellSize * 0.96);
                    ctx.strokeStyle = '#a8a29e';
                    ctx.lineWidth = Math.max(1, cellSize * 0.03);
                    ctx.strokeRect(cx - cellSize * 0.48, cy - cellSize * 0.48, cellSize * 0.96, cellSize * 0.96);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.2, cy - cellSize * 0.2);
                    ctx.lineTo(cx + cellSize * 0.15, cy + cellSize * 0.1);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.WALL_GUARD_SPEC,
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            塗壁碁: 6手ごとに置く石は塗り壁に化ける — 取れず、呼吸も領地も塞ぐ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとに置く石は塗り壁になる。壁は石ではない: 取ることはできず、呼吸も領地判定も塞ぐ。',
            '敵の生きを絞ったり自陣を守ったりする。両者同じ周期で壁が出る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.cnt = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 6手目 → 壁
        assert('6手目は塗り壁になる', board[6 * BOARD_SIZE + 6] === 3);
        assert('壁の上には置けない', isValidPlacement([{ x: 6, y: 6 }], 2) === false);
        board[6 * BOARD_SIZE + 7] = 1; // 壁の隣に黒石
        assert('壁は呼吸を通さない', getLiberties(board, 6 * BOARD_SIZE + 7) === 3);
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: i, y: 12 }] }, 2);
        executeMove({ cells: [{ x: 6, y: 12 }] }, 2); // 白の6手目 → 壁
        assert('白も6手目は壁', board[12 * BOARD_SIZE + 6] === 3);
    `,
};
