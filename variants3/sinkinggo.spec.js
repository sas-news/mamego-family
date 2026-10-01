// SINKINGGO — 水没碁: ダムに沈む村。12手ごとに水位が上がり、下の行から沈んでいく
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
const ST_INIT = `{ level: 0 }`; // 水位: 沈んだ行数
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
    file: 'sinkinggo.html',
    en: 'SINKINGGO',
    jp: '水没碁',
    prefix: 'sinkinggo',
    desc: 'ダムに沈む村。12手ごとに水位が1行上がり、沈んだ石は相手のアゲハマに。',
    kind: 'stone',
    icon: 'sinkinggo',
    spec: [
        ...K.rb('SINKINGGO', '水没碁', 'sinkinggo'),
        K.params([
            { key: 'rise_interval', label: '水位上昇の間隔', min: 4, max: 30, def: 12, unit: '手' },
        ]),
        ...ST(ST_INIT),
        // 水位上昇: 12手ごとに下の行が水没する (両者に同じ周期)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 水没: 12手ごとに水位が1行上がる
            while (st.level < Math.floor(history.length / (P('rise_interval') || 12)) && st.level < BOARD_SIZE - 2) {
                st.level++;
                const wy = BOARD_SIZE - st.level; // 沈む行
                let drowned = 0;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = wy * BOARD_SIZE + x;
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        captures[v === 1 ? 2 : 1]++;
                        drowned++;
                        fxBurst(i, '#38bdf8', 8);
                    }
                    board[i] = 3;
                }
                if (drowned) fxShake(5, 360);
                cleanUpPieces();
                fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '水位上昇!', '#38bdf8', 1100);
            }

            turn = opponent;`],
        // 水面下の村は水の底
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1d5d84', '#0d3349'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        K.CUE_GRID(`            // 水位線と水底の村影
            {
                ctx.save();
                if (st.level > 0) {
                    ctx.fillStyle = 'rgba(30, 95, 140, 0.30)';
                    ctx.fillRect(padding - cellSize / 2, padding + (BOARD_SIZE - st.level - 0.5) * cellSize, cellSize * BOARD_SIZE, cellSize * st.level);
                }
                const wy = BOARD_SIZE - st.level - 1;
                if (wy >= 0) {
                    const yy = padding + (wy + 0.5) * cellSize;
                    ctx.strokeStyle = 'rgba(125, 200, 245, 0.85)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    ctx.setLineDash([cellSize * 0.3, cellSize * 0.22]);
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize / 2, yy);
                    ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, yy);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'水位 ' + st.level + ' 行 / 次の上昇まで ' + ((P('rise_interval') || 12) - (history.length % (P('rise_interval') || 12))) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            水没碁: ダムに沈む村。12手ごとに水位が1行上がり、沈んだ石はアゲハマに<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤はダム湖に沈みゆく村。12手ごとに水位が1行上がり、下の行から沈む。',
            '沈んだ行の石は全て相手のアゲハマ。低地は危険だが捨て石の材料にもなる。',
            '使える区域がだんだん減る — 高地で早めに地を固めよ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('初期水位は0', st.level === 0);
        board[I(0, BOARD_SIZE - 1)] = 2;
        history.push({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('12手で水位が1行上がる', st.level === 1);
        assert('最下行は水没する', board[I(0, BOARD_SIZE - 1)] === 3);
        assert('沈んだ石はアゲハマ', captures[1] >= 1);
    `,
};
