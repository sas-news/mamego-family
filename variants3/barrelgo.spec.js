// BARRELGO — 樽酒碁: 石は酒樽。置いてから24手経つと熟成し、熟成石1個につき終局時+1目
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
const ST_INIT = `{ born: {} }`;
const AGED = `(i) => st.born[i] && history.length - st.born[i].at >= 24 && board[i] === st.born[i].p`;
module.exports = {
    file: 'barrelgo.html',
    en: 'BARRELGO',
    jp: '樽酒碁',
    prefix: 'barrelgo',
    desc: '石は酒樽。24手留まると熟成 (金縁) し、熟成石1個につき終局時+1目。',
    kind: 'stone',
    icon: 'barrelgo',
    spec: [
        ...K.rb('BARRELGO', '樽酒碁', 'barrelgo'),
        ...ST(ST_INIT),
        // 配置時に仕込み時刻を記録
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const gi = p.y * BOARD_SIZE + p.x;
                board[gi] = player;
                st.born[gi] = { p: player, at: history.length }; // 仕込み
            });`],
        // 壊れた樽 (取られた/消えた石) の記録を掃除
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 樽の記録掃除: 盤上に無い/持ち主が変わったものを除去
            Object.keys(st.born).forEach(k => { if (board[+k] !== st.born[k].p) delete st.born[k]; });

            turn = opponent;`],
        // 熟成石を得点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const aged = ${AGED};
            const blackAged = board.reduce((n, v, i) => n + (v === 1 && aged(i) ? 1 : 0), 0);
            const whiteAged = board.reduce((n, v, i) => n + (v === 2 && aged(i) ? 1 : 0), 0);
            const blackTotal = territory.black + captures[1] + blackAged;
            const whiteTotal = territory.white + captures[2] + komi + whiteAged;`],
        // 熟成石に金の縁取り
        ...K.STONE_MARKS_SPEC(`
            const aged = ${AGED};
            for (let i = 0; i < board.length; i++) {
                if (!aged(i)) continue;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(mx, my, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
            }`),
        ...K.EVENT_CHIP_SPEC(`'熟成 ' + board.reduce((n, v, i) => n + (st.born[i] && history.length - st.born[i].at >= 24 && board[i] === st.born[i].p ? 1 : 0), 0)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            樽酒碁: 石は酒樽。24手残った石は熟成し、終局時に1個+1目の価値になる<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石はその手数で「仕込み」が記録される。',
            '仕込みから24手残った石は熟成 (金の縁取り)。終局時、熟成石1個につき+1目。',
            '石を長く残すほど得になる守りのゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.born = {};
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('仕込み時刻が記録される', st.born[3 * BOARD_SIZE + 3].at === 1);
        // 24手進めて熟成
        history.length = 30;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        const aged = (i) => st.born[i] && history.length - st.born[i].at >= 24 && board[i] === st.born[i].p;
        assert('古い石は熟成', aged(3 * BOARD_SIZE + 3));
        assert('新しい石は未熟成', !aged(5 * BOARD_SIZE + 5));
        // 取られた石の記録は消える
        board[3 * BOARD_SIZE + 3] = 2;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('壊れた樽は消える', !st.born[3 * BOARD_SIZE + 3]);
    `,
};
