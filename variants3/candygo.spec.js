// CANDYGO — 飴玉碁: 同じ色の石が3個並ぶと消えて得点になる (マッチ3風)
const K = require('../gen_kit.js');
module.exports = {
    file: 'candygo.html',
    en: 'CANDYGO',
    jp: '飴玉碁',
    prefix: 'candygo',
    desc: '同じ色が3個以上並ぶとポップして持ち主の得点に。連鎖ポップも起きる。',
    kind: 'stone',
    icon: 'candygo',
    spec: [
        ...K.rb('CANDYGO', '飴玉碁', 'candygo'),
        K.params([
            { key: 'match_len', label: 'ポップする連数', min: 3, max: 5, def: 3, unit: '連' },
            { key: 'chain_max', label: '連鎖の上限', min: 2, max: 20, def: 8 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 飴玉: 3連以上の並びをポップ (通常の取りの後、連鎖あり)
        [K.ONE, K.TURN_FLIP, `            // 飴玉: 同色3連以上をポップして得点化 (持ち主のアゲハマ)
            {
                for (let loop = 0; loop < (P('chain_max') || 8); loop++) {
                    const pops = new Set();
                    const check = (line) => {
                        let run = [];
                        line.forEach(i => {
                            const v = board[i];
                            if ((v === 1 || v === 2) && run.length && board[run[0]] === v) {
                                run.push(i);
                            } else {
                                if (run.length >= (P('match_len') || 3)) run.forEach(r => pops.add(r));
                                run = (v === 1 || v === 2) ? [i] : [];
                            }
                        });
                        if (run.length >= (P('match_len') || 3)) run.forEach(r => pops.add(r));
                    };
                    for (let r = 0; r < BOARD_SIZE; r++) {
                        const row = [], col = [];
                        for (let c = 0; c < BOARD_SIZE; c++) {
                            row.push(r * BOARD_SIZE + c);
                            col.push(c * BOARD_SIZE + r);
                        }
                        check(row); check(col);
                    }
                    if (pops.size === 0) break;
                    // 盤を全て消すポップは起きない (核を残す)
                    let stones = 0;
                    for (let i = 0; i < board.length; i++) if (board[i] === 1 || board[i] === 2) stones++;
                    if (pops.size >= stones) break;
                    pops.forEach(i => {
                        const o = board[i];
                        board[i] = 0;
                        captures[o]++; // ポップした石は持ち主の得点
                        fxBurst(i, '#f9a8d4', 7, 1.2);
                    });
                    fxShake(4, 200);
                    cleanUpPieces();
                    // ポップでできた死連を片付ける
                    [1, 2].forEach(p => {
                        const dead = getCapturedStones(board, p);
                        if (dead.length > 0) {
                            dead.forEach(i => { board[i] = 0; fxBurst(i, '#f87171', 5, 1.0); });
                            captures[p === 1 ? 2 : 1] += dead.length;
                        }
                    });
                    cleanUpPieces();
                }
            }

            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            飴玉碁: 同色3連以上がポップして得点に。連鎖ポップも<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '同じ色の石が縦横に3個以上並ぶとポップして消え、持ち主の得点になる。',
            'ポップ後の盤面で新たな並びが連鎖する。通常の取り・コウも有効。両者同じルール。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(2, 2)] = 1; board[I(3, 2)] = 1; board[I(4, 2)] = 1; // 黒の横3連
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 白がどこかに着手 → ポップ判定
        assert('横3連はポップ', board[I(2, 2)] === 0 && board[I(3, 2)] === 0 && board[I(4, 2)] === 0);
        assert('ポップは持ち主の得点', captures[1] === 3);
        // 縦の3連もポップ
        board[I(6, 5)] = 2; board[I(6, 6)] = 2; board[I(6, 7)] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('縦3連もポップ', board[I(6, 6)] === 0 && captures[2] === 3);
        // 2連はポップしない
        board[I(1, 8)] = 1; board[I(2, 8)] = 1;
        executeMove({ cells: [{ x: 11, y: 11 }] }, 2);
        assert('2連はポップしない', board[I(1, 8)] === 1 && board[I(2, 8)] === 1);
    `,
};
