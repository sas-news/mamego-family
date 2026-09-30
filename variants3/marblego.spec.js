// MARBLEGO — 玉石碁: 石は球体。着手ごとに全ての石が列の底へ転がり落ちて集まる (重力)
const K = require('../gen_kit.js');
module.exports = {
    file: 'marblego.html',
    en: 'MARBLEGO',
    jp: '玉石碁',
    prefix: 'marblego',
    desc: '着手ごとに全ての石が列の底へ転がり落ちる。浮いた石は存在しない玉石の世界。',
    kind: 'stone',
    icon: 'marblego',
    spec: [
        ...K.rb('MARBLEGO', '玉石碁', 'marblego'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 玉石ルール: 全ての石が列の底へ転がり落ちる (列内の順序は保持)
            {
                let rolled = 0;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const col = [];
                    for (let y = BOARD_SIZE - 1; y >= 0; y--) {
                        const v = board[y * BOARD_SIZE + x];
                        if (v === 1 || v === 2) col.push(v);
                    }
                    for (let y = BOARD_SIZE - 1; y >= 0; y--) {
                        const i = y * BOARD_SIZE + x;
                        const nv = col.length ? col.shift() : 0;
                        if (board[i] !== nv) { board[i] = nv; rolled++; }
                    }
                }
                if (rolled) cleanUpPieces();
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手ごとに全ての石が列の底へ転がり落ちる。空中に浮く石はない。',
            '転がり落ちた石で新たな取りは発生しない。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 4列の底 (4,N-1) まで落ちる
        assert('石は列の底へ落ちる', board[(BOARD_SIZE - 1) * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        executeMove({ cells: [{ x: 4, y: 2 }] }, 2); // その上に積まる
        assert('2個目はその上に積まる', board[(BOARD_SIZE - 2) * BOARD_SIZE + 4] === 2 && board[(BOARD_SIZE - 1) * BOARD_SIZE + 4] === 1);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1); // 別の列は独立
        assert('列は独立して落ちる', board[(BOARD_SIZE - 1) * BOARD_SIZE + 8] === 1);
    `,
};
