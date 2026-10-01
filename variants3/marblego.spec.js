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
        K.params([
            { key: 'gravity_dir', label: '重力の向き', def: 'down', options: [{ v: 'down', l: '下へ落ちる' }, { v: 'up', l: '上へ落ちる' }, { v: 'left', l: '左へ落ちる' }, { v: 'right', l: '右へ落ちる' }] },
            { key: 'cap_ply', label: '打ち切り手数', min: 60, max: 400, def: 140, hint: 'この手数で地数判定' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 玉石ルール: 全ての石が重力の向きの底へ転がり落ちる (列・行内の順序は保持)
            {
                const GD = P('gravity_dir') || 'down';
                const lines = [];
                if (GD === 'down' || GD === 'up') {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const idxs = [];
                        for (let y = 0; y < BOARD_SIZE; y++) idxs.push(y * BOARD_SIZE + x);
                        if (GD === 'down') idxs.reverse();
                        lines.push(idxs);
                    }
                } else {
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        const idxs = [];
                        for (let x = 0; x < BOARD_SIZE; x++) idxs.push(y * BOARD_SIZE + x);
                        if (GD === 'right') idxs.reverse();
                        lines.push(idxs);
                    }
                }
                let rolled = 0;
                lines.forEach(idxs => {
                    const stones = idxs.map(i => board[i]).filter(v => v === 1 || v === 2);
                    idxs.forEach((i, k) => {
                        const nv = k < stones.length ? stones[k] : 0;
                        if (board[i] !== nv) { board[i] = nv; rolled++; }
                    });
                });
                if (rolled) cleanUpPieces();
            }
            // 長期戦防止: cap_ply 手経過でその時点の地数判定
            if (history.length >= Math.max(10, P('cap_ply') || 140)) { endGameByScore(); return; }

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
