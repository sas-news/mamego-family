// FLUIDGO — 流体碁: 石は流体。着手ごとに全石が低い方(下)へ1マス流れて集まる
const K = require('../gen_kit.js');
module.exports = {
    file: 'fluidgo.html',
    en: 'FLUIDGO',
    jp: '流体碁',
    prefix: 'fluidgo',
    desc: '石は流体。着手のたび全石が下へ1マス流れ、低い側に集まる。',
    kind: 'stone',
    icon: 'fluidgo',
    spec: [
        ...K.rb('FLUIDGO', '流体碁', 'fluidgo'),
        K.params([
            { key: 'flow_interval', label: '流下の間隔', min: 1, max: 5, def: 1, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 流体: 着手後、全石が下へ1マス流れる (下が空の場合のみ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 流体: 全石が下へ1マス流れる (下の行から順に処理)
            if (history.length % Math.max(1, P('flow_interval') || 1) === 0) {
                for (let y = BOARD_SIZE - 2; y >= 0; y--) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x;
                        const below = i + BOARD_SIZE;
                        if ((board[i] === 1 || board[i] === 2) && board[below] === 0) {
                            board[below] = board[i];
                            board[i] = 0;
                            fxSlide(i, below, 300);
                        }
                    }
                }
                cleanUpPieces();
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 水面っぽい常時演出
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        [K.ONE, K.INFO_BASE, `            流体碁: 石は流体。着手のたび全石が下へ1マス流れて集まる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手ごとに、盤上の全ての石が下へ1マス流れる (下が空いているとき)。',
            '石は低い側に集まり、連は流れの中で形を変える。取り・呼吸は通常通り。',
        ])],
        // 連続パスで即採点終局
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒 → 直後に1マス流下
        assert('石が下へ流れる', board[I(4, 4)] === 0 && board[I(4, 5)] === 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2); // 白 → 白も流下 + 黒も再度流下
        assert('白石も流れる', board[I(7, 7)] === 0 && board[I(7, 8)] === 2);
        assert('黒はさらに流下', board[I(4, 6)] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        const c = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
        assert('着手できる', typeof isValidPlacement === 'function' && isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
