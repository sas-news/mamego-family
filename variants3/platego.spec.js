// PLATEGO — 皿回碁: 孤立した自石は回転が落ちて4手で皿が落ちる。連なった皿は安定
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
const ST_INIT = `{ spin: {} }`;
module.exports = {
    file: 'platego.html',
    en: 'PLATEGO',
    jp: '皿回碁',
    prefix: 'platego',
    desc: '孤立した自石は回転が落ち、4手で落ちて消える。連なれば安定。隣に置くと回し直し。',
    kind: 'stone',
    icon: 'platego',
    spec: [
        ...K.rb('PLATEGO', '皿回碁', 'platego'),
        K.params([{ key: 'spin_max', label: '皿の回転数', min: 2, max: 10, def: 4, unit: '手' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT),

        // 皿回し: 孤立自石の回転が毎手落ちる。隣に置くと回し直し
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 皿回碁: 孤立した自石は回転が落ちる (4手で落下)。連なった皿は安定
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const fell = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) { if (st.spin[i] !== undefined) delete st.spin[i]; continue; }
                    if (i === pi) continue;
                    const lone = !getNeighbors(i).some(n => board[n] === player);
                    if (!lone) { st.spin[i] = (P('spin_max') || 4); continue; }
                    if (st.spin[i] === undefined) st.spin[i] = (P('spin_max') || 4);
                    else st.spin[i]--;
                    if (st.spin[i] <= 0) fell.push(i);
                }
                // 新たに置いた石と、その隣の自石は回し直される
                st.spin[pi] = (P('spin_max') || 4);
                getNeighbors(pi).forEach(n => { if (board[n] === player) st.spin[n] = (P('spin_max') || 4); });
                if (fell.length) {
                    fell.forEach(i => { board[i] = 0; delete st.spin[i]; fxSplash(i, '#94a3b8', 9); });
                    fxText(fell[0], '皿が落ちた!', '#94a3b8', 1200);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 残り回転数を石の上の揺れで表現
        ...K.STONE_MARKS_SPEC(`            // 回転が落ちかけた皿は揺れて光る
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== turn && board[i] !== (3 - turn)) continue;
                const sp = st.spin[i];
                if (sp === undefined || sp > 2) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                const wob = Math.sin(fxNow() / 90 + i) * cellSize * 0.05 * (3 - sp);
                ctx.save();
                ctx.strokeStyle = 'rgba(148,163,184,' + (0.4 + (2 - sp) * 0.2) + ')';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.ellipse(cx + wob, cy, cellSize * 0.5, cellSize * 0.5, wob * 0.05, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(() => { let w = 0; for (let i = 0; i < board.length; i++) if (board[i] === turn && st.spin[i] !== undefined && st.spin[i] <= 2) w++; return w ? 'ぐらつき ' + w : ''; })()`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            皿回碁: 孤立した自石は回転が落ちて4手で皿が落ちる。連なった皿は落ちない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '孤立した自石は竿から外れかけの皿 — 自分の手番ごとに回転が落ち、4手で落下して消える (アゲハマにはならない)。',
            '隣に新たな石を置くとその周りの自石が回し直される。2個以上連なった皿は安定して落ちない。',
            '孤立石を維持するには手を淀ませないこと。相手は孤立を誘うように切断してくる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.spin = {};
        board[5 * BOARD_SIZE + 5] = 1; st.spin[5 * BOARD_SIZE + 5] = 1; // あと1手で落ちる孤立皿
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('孤立皿が落ちる', board[5 * BOARD_SIZE + 5] === 0);
        // 連なった皿は安定
        board.fill(0); st.spin = {};
        board[2 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('連なった皿は落ちない', board[2 * BOARD_SIZE + 2] === 1 && board[2 * BOARD_SIZE + 3] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 2) === true);
    `,
};
