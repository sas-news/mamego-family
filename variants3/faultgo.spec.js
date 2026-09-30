// FAULTGO — 断層碁: 盤の中央に断層。10手ごとの地震で右側が1段ずつずれる
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
const ST_INIT = `{ ply: 0 }`;
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
    file: 'faultgo.html',
    en: 'FAULTGO',
    jp: '断層碁',
    prefix: 'faultgo',
    desc: '中央に断層。10手ごとの地震で右半分が1段ずれ、縁から落ちた石は呑まれる。',
    kind: 'stone',
    icon: 'faultgo',
    spec: [
        ...K.rb('FAULTGO', '断層碁', 'faultgo'),
        ...ST(ST_INIT),
        // 断層の位置
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 断層: x > FAULT_X が右側 (ずれる側)
        function faultX() { return Math.floor(BOARD_SIZE / 2) - 1; }`],
        // 地震: 10手ごとに右側を1段ずらす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 断層活動: 10手ごとの地震で右側の盤面が1段ずれる
            st.ply++;
            if (st.ply % 10 === 0) {
                const fx = faultX();
                const moved = [];
                let dropped = 0;
                for (let y = BOARD_SIZE - 1; y >= 0; y--) {
                    for (let x = fx + 1; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x, v = board[i];
                        if (v === 0) continue;
                        if (y === BOARD_SIZE - 1) {
                            captures[v === 1 ? 2 : 1]++; // 断層の縁から落ちた
                            board[i] = 0;
                            dropped++;
                            fxBurst(i, '#78716c', 8, 1.4);
                            continue;
                        }
                        board[i + BOARD_SIZE] = v;
                        board[i] = 0;
                        moved.push([i, i + BOARD_SIZE]);
                    }
                }
                moved.forEach(([a, b]) => {
                    const ax = a % BOARD_SIZE, ay = (a / BOARD_SIZE) | 0;
                    const bx = b % BOARD_SIZE, by = (b / BOARD_SIZE) | 0;
                    pieces.forEach(pc => pc.cells.forEach(p => {
                        if (p.x === ax && p.y === ay) { p.x = bx; p.y = by; }
                    }));
                    fxSlide(a, b, 460);
                });
                fxShake(7, 420);
                const fi = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + fx;
                fxText(fi, dropped > 0 ? '地震! ' + dropped + '石落下' : '地震!', '#f87171', 1400);
            }

            turn = opponent;`],
        // 断層線の描画: 中央にジグザグの割れ目
        K.CUE_GRID(`            // 断層線: 中央を縦に走るジグザグの割れ目
            {
                ctx.save();
                const fx = padding + (faultX() + 0.5) * cellSize;
                ctx.strokeStyle = 'rgba(60,40,30,0.75)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    const jx = fx + ((y % 2 === 0) ? -cellSize * 0.09 : cellSize * 0.09);
                    const jy = padding + y * cellSize - cellSize * 0.5;
                    if (y === 0) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
                }
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,120,80,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                ctx.beginPath();
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    const jx = fx + ((y % 2 === 0) ? -cellSize * 0.05 : cellSize * 0.05);
                    const jy = padding + y * cellSize - cellSize * 0.5;
                    if (y === 0) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'地震まで ' + (10 - (st.ply % 10)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            断層碁: 中央に断層。10手ごとの地震で右側が1段ずれ、縁から落ちた石は呑まれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央に断層 (赤い割れ目) 。10手ごとに地震が起き、右半分の盤面が1段ずれる。',
            'ずれで縁から落ちた石は色に関わらず相手のアゲハマになる。',
            '右側の連は地震ごとに寸断される。左側は動かない — 地形の非対称な盤。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const fx = faultX();
        st.ply = 9;
        board[I(fx + 2, 4)] = 1; // 右側中段に黒
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('地震で右側が1段ずれる', board[I(fx + 2, 4)] === 0 && board[I(fx + 2, 5)] === 1);
        st.ply = 9;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(fx + 2, BOARD_SIZE - 1)] = 2; // 右側最下段に白
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('縁から落ちた石は呑まれる', board[I(fx + 2, BOARD_SIZE - 1)] === 0 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
