// WATERWHEELGO — 水車碁: 盤下の水流で水車が回る。8手ごとに最下行の石が1マス流され、東端から零れると相手のアゲハマ
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'waterwheelgo.html',
    en: 'WATERWHEELGO',
    jp: '水車碁',
    prefix: 'waterwheelgo',
    desc: '盤下を流れる水車。8手ごとに最下行の石が1マス東へ流され、端から零れると相手のアゲハマ。',
    kind: 'stone',
    icon: 'waterwheelgo',
    spec: [
        ...K.rb('WATERWHEELGO', '水車碁', 'waterwheelgo'),
        K.params([
            { key: 'flow_interval', label: '水車の間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 水車の流れ路: 最下行 (水流レーン)
        const WHEEL_Y = BOARD_SIZE - 1;`],
        // 水車の回転: 8手ごとに最下行の石が1マス東へ流れる (双方同じ周期)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 水車: N手ごとに最下行の石が1マス東へ流れる。端から零れたら相手のアゲハマ
            if (history.length % (P('flow_interval') || 8) === 0) {
                let flowed = 0, spilled = 0;
                for (let x = BOARD_SIZE - 1; x >= 0; x--) {
                    const i = WHEEL_Y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (x === BOARD_SIZE - 1) {
                        board[i] = 0;
                        captures[v === 1 ? 2 : 1]++;
                        spilled++;
                        fxBurst(i, '#38bdf8', 8);
                    } else if (board[i + 1] === 0) {
                        board[i + 1] = v; board[i] = 0;
                        pieces.push({ id: Date.now() + Math.random(), player: v, type: move.type, rot: move.rot, cells: [{ x: x + 1, y: WHEEL_Y }] });
                        fxSlide(i, i + 1, 380);
                        flowed++;
                    }
                }
                if (flowed || spilled) {
                    cleanUpPieces();
                    // 流れで呼吸を失った連も掃く
                    [1, 2].forEach(cp => {
                        const dead = getCapturedStones(board, cp);
                        if (dead.length) {
                            dead.forEach(i => { board[i] = 0; });
                            captures[cp === 1 ? 2 : 1] += dead.length;
                        }
                    });
                    fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '水車が回る!', '#38bdf8', 1000);
                }
            }

            turn = opponent;`],
        // 水流レーンの水面
        K.CUE_GRID(`            // 水流レーン: 最下行を水面に、水車の歯を盤右に
            {
                ctx.save();
                ctx.fillStyle = 'rgba(56, 140, 200, 0.20)';
                ctx.fillRect(padding - cellSize / 2, padding + (WHEEL_Y - 0.5) * cellSize, cellSize * BOARD_SIZE, cellSize);
                // 流れの矢印
                ctx.strokeStyle = 'rgba(125, 200, 245, 0.7)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let x = 1; x < BOARD_SIZE; x += 3) {
                    const cx = padding + x * cellSize, cy = padding + WHEEL_Y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.2, cy - cellSize * 0.15);
                    ctx.lineTo(cx + cellSize * 0.2, cy);
                    ctx.lineTo(cx - cellSize * 0.2, cy + cellSize * 0.15);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        ...K.EVENT_CHIP_SPEC(`'水車まで ' + ((P('flow_interval') || 8) - (history.length % (P('flow_interval') || 8))) + ' 手'`),
        [K.ONE, K.INFO_BASE, `            水車碁: 8手ごとに最下行の石が1マス東へ流れる。端から零れるとアゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤下の水流で水車が回る — 8手ごとに最下行の石が1マス東へ流される。',
            '東端から零れた石は相手のアゲハマ。流れで呼吸を失った連も崩れる。',
            '最下行は輸送路 — 西から置いて東へ運ぶか、敢えて乗せないか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const wy = BOARD_SIZE - 1;
        board[I(3, wy)] = 1; board[I(BOARD_SIZE - 1, wy)] = 2;
        history.push({}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('水車で石が東へ流れる', board[I(4, wy)] === 1 && board[I(3, wy)] === 0);
        assert('端から零れた石はアゲハマ', board[I(BOARD_SIZE - 1, wy)] === 0 && captures[1] === 1);
        board.fill(0); pieces = []; history.length = 0; captures[1] = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
