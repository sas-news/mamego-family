// ROOKGO — 飛車碁: 自石と同じ行か列にしか置けない
const K = require('../gen_kit.js');
module.exports = {
    file: 'rookgo.html',
    en: 'ROOKGO',
    jp: '飛車碁',
    prefix: 'rookgo',
    desc: '着手は自石と同じ行か列のみ。飛車のように盤を結ぶ。',
    kind: 'rook',
    spec: [
        ...K.rb('ROOKGO', '飛車碁', 'rookgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 飛車碁ルール: 既存の自石と同じ行か列にしか置けない (最初の1手はどこでも)
            {
                let hasOwn = false, sharesAxis = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === player) {
                        hasOwn = true;
                        const sx = i % BOARD_SIZE, sy = Math.floor(i / BOARD_SIZE);
                        for (const p of cells) {
                            if (p.x === sx || p.y === sy) { sharesAxis = true; break; }
                        }
                    }
                    if (sharesAxis) break;
                }
                if (hasOwn && !sharesAxis) return false;
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石と同じ行か列にある交点のみ。',
            '最初の1手はどこにでも置ける。飛車のように筋を結んで盤を制する。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        board[1 * BOARD_SIZE + 1] = 1; // (1,1)に黒
        assert('別行列は置けない', isValidPlacement([{ x: 5, y: 5 }], 1) === false);
        assert('同じ行は置ける', isValidPlacement([{ x: 5, y: 1 }], 1) === true);
        assert('同じ列は置ける', isValidPlacement([{ x: 1, y: 5 }], 1) === true);
        board.fill(0);
        assert('初期はどこでも置ける', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
