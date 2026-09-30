// YOMIGO — 黄泉碁: 15手ごとに黄泉の国から両者の石が1つずつ這い出す
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
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'yomigo.html',
    en: 'YOMIGO',
    jp: '黄泉碁',
    prefix: 'yomigo',
    desc: '15手ごとに黄泉の国(盤の裏)から両者の石が1つずつ這い出す。',
    kind: 'stone',
    icon: 'yomigo',
    spec: [
        ...K.rb('YOMIGO', '黄泉碁', 'yomigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { lastRite: 0 };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { lastRite: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { lastRite: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { lastRite: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { lastRite: 0 };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 黄泉の境界: 15手ごとに両者の石が盤の裏から1つずつ這い出す
            {
                const rite = Math.floor(history.length / 15);
                if (rite !== st.lastRite && history.length % 15 === 0) {
                    st.lastRite = rite;
                    const T = BOARD_SIZE * BOARD_SIZE;
                    const spawned = [];
                    // 黒は下段の裏から、白は上段の裏から対称に這い出す
                    [1, 2].forEach(pl => {
                        for (let step = 0; step < T; step++) {
                            // 黒は盤末尾から逆走、白は先頭から順走
                            const cand = pl === 1 ? (T - 1 - (rite * 7 + step) % T) : ((rite * 7 + step) % T);
                            if (board[cand] === 0) {
                                board[cand] = pl;
                                spawned.push(cand);
                                fxGlow(cand, '#4c1d95', 900);
                                fxText(cand, '黄泉より', '#a78bfa', 1100);
                                break;
                            }
                        }
                    });
                    fxShake(4, 450);
                    cleanUpPieces();
                    // 這い出た先が死地なら黄泉へ還る (這い出た石のみ)
                    const dead = new Set(getCapturedStones(board, 1).concat(getCapturedStones(board, 2)));
                    let back = 0;
                    spawned.forEach(s => { if (dead.has(s)) { board[s] = 0; back++; fxSplash(s, '#a78bfa', 7); } });
                    if (back) cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 黄泉の裂け目: 盤端の黒紫の帯
        K.CUE_GRID(`            // 黄泉の国: 上下端を黒紫に染める
            {
                ctx.save();
                const w = BOARD_SIZE * cellSize;
                const top = ctx.createLinearGradient(0, padding - cellSize / 2, 0, padding + cellSize);
                top.addColorStop(0, 'rgba(76,29,149,0.35)');
                top.addColorStop(1, 'rgba(76,29,149,0)');
                ctx.fillStyle = top;
                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, w, cellSize * 1.5);
                const bot = ctx.createLinearGradient(0, padding + w + cellSize / 2, 0, padding + w - cellSize);
                bot.addColorStop(0, 'rgba(76,29,149,0.35)');
                bot.addColorStop(1, 'rgba(76,29,149,0)');
                ctx.fillStyle = bot;
                ctx.fillRect(padding - cellSize / 2, padding + w - cellSize, w, cellSize * 1.5);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'黄泉まで' + (15 - (history.length % 15)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            黄泉碁: 15手ごとに両者の石が1つずつ這い出す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '15手ごとの「黄泉の境界」で、黒は下から白は上から、それぞれ1石が盤の裏から這い出す。',
            '這い出た石はどちらの着手でもない増援。窒息して出た石は黄泉へ還る。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { lastRite: 0 };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        history.length = 14;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 15手目で黄泉の境界
        assert('白石が這い出す', board.includes(2) && board.filter(v => v === 2).length >= 2);
        assert('黒石も這い出す', board.filter(v => v === 1).length >= 2);
        assert('境界が記録される', st.lastRite === 1);
        board.fill(0); st = { lastRite: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
    `,
};
