// VORTEX2GO — 旋風碁: 着手点の周囲3x3外周が時計回りに1マスずつ回転する
const K = require('../gen_kit.js');
module.exports = {
    file: 'vortex2go.html',
    en: 'VORTEX2GO',
    jp: '旋風碁',
    prefix: 'vortex2go',
    desc: '石を置くと周囲8マスが時計回りに1マスずつ環流する。連は渦で千切れる。',
    kind: 'stone',
    icon: 'vortex2go',
    spec: [
        ...K.rb('VORTEX2GO', '旋風碁', 'vortex2go'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 300, step: 10, def: 140, unit: '手' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 旋風: 着手点を中心とする3x3の外周が時計回りに1マス回転
            {
                const bx = move.cells[0].x, by = move.cells[0].y;
                const ring = [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]
                    .map(([dx, dy]) => [bx + dx, by + dy])
                    .filter(([x, y]) => x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE);
                if (ring.length >= 3) {
                    const vals = ring.map(([x, y]) => board[y * BOARD_SIZE + x]);
                    ring.forEach(([x, y], i) => {
                        const src = ring[(i + ring.length - 1) % ring.length];
                        board[y * BOARD_SIZE + x] = vals[(i + ring.length - 1) % ring.length];
                        if (board[y * BOARD_SIZE + x] !== 0) {
                            fxSlide(src[1] * BOARD_SIZE + src[0], y * BOARD_SIZE + x, 380);
                        }
                    });
                    fxGlow(by * BOARD_SIZE + bx, '#67e8f9', 700);
                    cleanUpPieces();
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= Math.max(1, P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を置くと、その着手点を囲む3x3の外周8マスが時計回りに1マスずつ回転する。',
            '石ごと運ばれるので連は渦に千切れやすい。両者の着手で同じように回転する。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[3*BOARD_SIZE+3] = 2; // 回転させるマーカー石
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('周囲の石が時計回りに回る', board[3*BOARD_SIZE+3] === 0 && board[3*BOARD_SIZE+4] === 2);
        assert('着手石自体は動かない', board[4*BOARD_SIZE+4] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 隅でも例外なく動作
        assert('隅の着手もクラッシュしない', board[0] === 2);
    `,
};
