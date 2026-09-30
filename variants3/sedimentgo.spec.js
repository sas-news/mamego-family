// SEDIMENTGO — 堆積碁: 上下2行は川。河口に堆積して三角州が成長する (取った石が新しい陸地になる)
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
const ST_INIT = `{ delta: 0 }`;
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
    file: 'sedimentgo.html',
    en: 'SEDIMENTGO',
    jp: '堆積碁',
    prefix: 'sedimentgo',
    desc: '上下2行は川。石を取るたびに河口へ堆積し、三角州の新しい陸地が育つ。',
    kind: 'stone',
    icon: 'sedimentgo',
    spec: [
        ...K.rb('SEDIMENTGO', '堆積碁', 'sedimentgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 川: 上下2行は海 (着手不可)。河口(中央列)に堆積して三角州が育つ
        let RIVER = new Set();
        function rebuildRiver() {
            RIVER = new Set();
            for (let y = 0; y < 2; y++) for (let x = 0; x < BOARD_SIZE; x++) RIVER.add(y * BOARD_SIZE + x);
            for (let y = BOARD_SIZE - 2; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) RIVER.add(y * BOARD_SIZE + x);
        }
        // 堆積順: 中央列から外へジグザグに埋まる河口セル列
        function deltaOrder() {
            const c = Math.floor(BOARD_SIZE / 2), out = [];
            for (let d = 0; d < BOARD_SIZE; d++) {
                const xs = d === 0 ? [c] : [c - Math.ceil(d / 2), c + Math.floor(d / 2)];
                xs.forEach(x => {
                    if (x < 0 || x >= BOARD_SIZE) return;
                    // 河口は上下の川端 (y=1 と y=BOARD_SIZE-2)
                    [1, BOARD_SIZE - 2].forEach(y => out.push(y * BOARD_SIZE + x));
                });
            }
            return out;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildRiver();
            RIVER.forEach(i => { board[i] = 3; });`],
        // 堆積: 取るたびに河口の川セルが干潟になる (wall→空)
        [K.ONE, K.CAPTURE_BLOCK, K.CAPTURE_BLOCK + `
            // 堆積: アゲハマの数だけ河口に土砂が積もる
            const grew = Math.min(captured.length, deltaOrder().length - st.delta);
            for (let gi = 0; gi < grew; gi++) {
                const di = deltaOrder()[st.delta + gi];
                st.delta++;
                board[di] = 0;
                fxSplash(di, '#d9b25c', 9);
                fxText(di, '堆積', '#eab308', 900);
            }`],
        // 川の描画 + 堆積した干潟
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        K.CUE_GRID(`            // 堆積した干潟: 河口の新しい陸地を砂色で塗る
            {
                ctx.save();
                const ord = deltaOrder();
                for (let gi = 0; gi < st.delta && gi < ord.length; gi++) {
                    const i = ord[gi];
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(217,178,92,0.55)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'三角州 ' + st.delta + '点'`),
        [K.ONE, K.INFO_ALGO, `            堆積碁: 上下2行は川。石を取るたびに河口に堆積して三角州の新しい陸地が育つ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の上下2行は川 (着手不可・呼吸なし)。中央列が河口。',
            '石を1個取るごとに河口の川セルが1つ干潟になる — 三角州が成長して新しい陸地が生まれる。',
            '取り合いのたびに盤の地形が変わる。生まれた干潟は両者が使える好地。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('川がある', board[I(4, 0)] === 3 && board[I(4, BOARD_SIZE - 1)] === 3);
        assert('川は打てない', isValidPlacement([{ x: 4, y: 0 }], 1) === false);
        assert('河口順がある', deltaOrder().length > 0);
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.delta = 0;
        const c = Math.floor(BOARD_SIZE / 2);
        board[I(c, 1)] = 3; // 河口の川セルを戻す
        board[I(c, 3)] = 2; board[I(c, 2)] = 1; board[I(c - 1, 3)] = 1; board[I(c + 1, 3)] = 1;
        executeMove({ cells: [{ x: c, y: 4 }] }, 1); // 白(c,3)の呼吸を塞いで取る
        assert('取ると堆積する', st.delta === 1 && captures[1] === 1);
        assert('堆積地は陸地', board[deltaOrder()[0]] === 0);
    `,
};
