// EROSIONGO — 浸食碁: 25手ごとの増水で、川岸(上下端)の石が流れに攫われて海へ消える
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.max(1, P('ply_cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'erosiongo.html',
    en: 'EROSIONGO',
    jp: '浸食碁',
    prefix: 'erosiongo',
    desc: '25手ごとの増水で、川岸(上下端)の石が流れに攫われて消える。',
    kind: 'stone',
    icon: 'erosiongo',
    spec: [
        ...K.rb('EROSIONGO', '浸食碁', 'erosiongo'),
        K.params([
            { key: 'flood_interval', label: '増水の間隔', min: 6, max: 60, def: 25, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { lastFlood: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { lastFlood: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { lastFlood: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { lastFlood: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { lastFlood: 0 };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 増水: 25手ごとに川岸(上下の辺)の石が流れに攫われる — アゲハマにならず海へ
            {
                const fi = Math.max(1, P('flood_interval') || 25);
                const flood = Math.floor(history.length / fi);
                if (flood !== st.lastFlood && history.length % fi === 0) {
                    st.lastFlood = flood;
                    let swept = 0;
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        [x, (BOARD_SIZE - 1) * BOARD_SIZE + x].forEach(i => {
                            if (board[i] === 1 || board[i] === 2) {
                                board[i] = 0;
                                swept++;
                                fxSplash(i, '#38bdf8', 9);
                            }
                        });
                    }
                    if (swept) {
                        fxShake(5, 500);
                        fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '増水! ' + swept + '石が流された', '#38bdf8', 1400);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 川岸: 上下端を淡い水色に
        K.CUE_GRID(`            // 川岸: 上下端を淡い水色に染める
            {
                ctx.save();
                const w = BOARD_SIZE * cellSize;
                ctx.fillStyle = 'rgba(56,189,248,0.14)';
                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, w, cellSize);
                ctx.fillRect(padding - cellSize / 2, padding + w - cellSize / 2, w, cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'増水まで' + ((P('flood_interval') || 25) - (history.length % (P('flood_interval') || 25))) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            浸食碁: 25手ごとの増水で川岸の石が流される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '上下の辺は川岸。25手ごとの「増水」で、川岸に残る石は全て流れに攫われて消える (アゲハマにならない)。',
            '辺の地は長持ちしない。増水の直前に川岸へ敵を追い込むか、早めに内側へ逃がせ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { lastFlood: 0 };
        board[I(3, 0)] = 1;          // 川岸の黒石
        board[I(6, BOARD_SIZE - 1)] = 2; // 対岸の白石
        board[I(6, 6)] = 1;          // 内側の黒石
        history.length = 24;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 25手目で増水
        assert('川岸の石が流される', board[I(3, 0)] === 0 && board[I(6, BOARD_SIZE - 1)] === 0);
        assert('内側は無事', board[I(6, 6)] === 1 && board[I(9, 9)] === 1);
        assert('アゲハマにならない', captures[1] === 0);
        board.fill(0); st = { lastFlood: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
    `,
};
