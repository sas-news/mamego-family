// MOCHIGO — 鏡餅碁: 自分の石の上に重ね置きして段を増やす (最大3段)。取られるとき1段ずつ削られる
const K = require('../gen_kit.js');
const LV = () => `Array(BOARD_SIZE * BOARD_SIZE).fill(0)`;
const LV_SAVE = [
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                mochi: [...mochi],
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            mochi = snap.mochi ? [...snap.mochi] : ${LV()};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    mochi,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            mochi = s.mochi ? [...s.mochi] : ${LV()};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                mochi,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            mochi = data.mochi ? [...data.mochi] : ${LV()};`],
];
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
    file: 'mochigo.html',
    en: 'MOCHIGO',
    jp: '鏡餅碁',
    prefix: 'mochigo',
    desc: '自分の石の上に重ね置きして段を増やす (最大3段)。取られるときは1段ずつ削られる。',
    kind: 'stone',
    icon: 'mochigo',
    spec: [
        ...K.rb('MOCHIGO', '鏡餅碁', 'mochigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 餅の段数: 0=平たい餅 1=二段 2=三段 (鏡餅)
        let mochi = ${LV()};`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            mochi = ${LV()};`],
        ...LV_SAVE,
        // 重ね置き: 自分の石の上に置くと段が増える (2段まで増やせる)
        [K.ONE, K.VALID_BOUNDS, `            {
                const p0 = cells[0];
                if (p0.x < 0 || p0.x >= BOARD_SIZE || p0.y < 0 || p0.y >= BOARD_SIZE) return false;
                const v = board[p0.y * BOARD_SIZE + p0.x];
                if (v !== 0 && !(v === player && mochi[p0.y * BOARD_SIZE + p0.x] < 2)) return false;
            }`],
        // 着手実行: 重ねは段加算、通常置きはピース登録
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            const __stackIdx = move.cells.length === 1 && board[move.cells[0].y * BOARD_SIZE + move.cells[0].x] === player
                ? move.cells[0].y * BOARD_SIZE + move.cells[0].x : -1;
            if (__stackIdx >= 0) {
                mochi[__stackIdx] = Math.min(2, mochi[__stackIdx] + 1);
                fxBurst(__stackIdx, '#fde68a', 8);
            } else {
                move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            }`],
        [K.ONE, K.PIECES_PUSH, `            if (__stackIdx < 0) pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        // 段が削られる: 取られるとき1段ずつ減る
        [K.ONE, `            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;`,
`            if (captured.length > 0) {
                captured.forEach(idx => {
                    if (mochi[idx] > 0) {
                        mochi[idx]--; // 一段削られて残る
                        fxBurst(idx, '#fde68a', 6);
                    } else {
                        board[idx] = 0;
                        captures[player]++;
                    }
                });`],
        // 段の描画: 段数に応じた積み餅リング
        ...K.STONE_MARKS_SPEC(`            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const lv = mochi[y * BOARD_SIZE + x];
                if (lv <= 0) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = v === 1 ? 'rgba(255,235,180,0.9)' : 'rgba(120,60,20,0.8)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let k = 1; k <= lv; k++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy - k * cellSize * 0.13, cellSize * (0.34 - k * 0.05), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            鏡餅碁: 自分の石に重ね置きで段を増やす。取られるとき1段ずつ削られる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石の上に重ねて置くと餅が一段増える (最大三段)。重ねにも1手を使う。',
            '取られるとき餅は一段ずつ削られて残る — 三段餅は3回取られないと死なない。',
            '要石を高く積むか、広く薄く打つか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('重ね置きで段が増える', mochi[I(5, 5)] === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('三段が上限', mochi[I(5, 5)] === 2);
        assert('三段の上には置けない', isValidPlacement([{ x: 5, y: 5 }], 1) === false);
        // 囲むと一段ずつ削られる
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 2);
        assert('取られると一段削られて残る', board[I(5, 5)] === 1 && mochi[I(5, 5)] === 1);
    `,
};
