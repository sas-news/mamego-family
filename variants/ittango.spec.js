// ITTANGO — 一反碁: 7手ごとに置く一反木綿は隣の敵石を包んで運び去る (両方消えてアゲハマ+1)
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
    file: 'ittango.html',
    en: 'ITTANGO',
    jp: '一反碁',
    prefix: 'ittango',
    desc: '7手ごとに置く一反木綿は隣の敵石を包んで運び去る。包んだ石はアゲハマになる。',
    kind: 'stone',
    icon: 'ittango',
    spec: [
        ...K.rb('ITTANGO', '一反碁', 'ittango'),
        K.params([
            { key: 'momen_interval', label: '木綿の間隔', min: 3, max: 14, def: 7, unit: '手' },
        ]),
        ...ST(ST_INIT),
        // 置いた石に一反木綿を重ねる: 7手ごと (両者対称)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            st.cnt[player]++;`],
        // 一反木綿: 7手目の石は隣の敵石を1つ包んで共に飛び去る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 一反碁: 7手ごとの石は一反木綿 — 隣の敵石を包んで運び去る
            if (st.cnt[player] % Math.max(1, P('momen_interval') || 7) === 0) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const tgt = getNeighbors(ci).find(n => board[n] === opponent);
                if (tgt !== undefined) {
                    board[tgt] = 0;
                    board[ci] = 0; // 木綿ごと飛び去る
                    pieces = pieces.filter(p => p.idx !== ci && p.idx !== tgt);
                    captures[player]++;
                    fxSlide(tgt, ci, player, 400, null);
                    fxBurst(ci, '#e2e8f0', 14, 2.0);
                    fxText(ci, '一反!', '#f8fafc', 1100);
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            一反碁: 7手ごとに置く石は一反木綿 — 隣の敵石を包んで運び去る (アゲハマ+1)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '7手ごとに置く石は一反木綿になる。置いた時に隣の敵石があれば1つを包み、木綿ごと飛び去ってアゲハマ1個になる。',
            '包む相手がいなければ普通の石。7手目を敵に隣接して置くと得する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        st.cnt = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 5] = 2; // 白 at (5,4)
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 7手目 — 隣の白を包む
        assert('木綿は隣の敵石を包んで消える', board[4 * BOARD_SIZE + 5] === 0 && board[4 * BOARD_SIZE + 4] === 0);
        assert('包んだ分はアゲハマ', captures[1] === 1);
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 12 }] }, 2);
        board[12 * BOARD_SIZE + 8] = 1; // 黒を白の近くに置く
        executeMove({ cells: [{ x: 7, y: 12 }] }, 2); // 白の7手目 → 木綿
        assert('白も7手目は木綿で包む', board[12 * BOARD_SIZE + 8] === 0 && board[12 * BOARD_SIZE + 7] === 0 && captures[2] === 1);
    `,
};
