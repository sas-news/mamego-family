// FISHGO — 釣碁: 打った石から伸ばした直線の先の敵石を釣り上げる
const K = require('../gen_kit.js');
module.exports = {
    file: 'fishgo.html',
    en: 'FISHGO',
    jp: '釣碁',
    prefix: 'fishgo',
    desc: '着手点から直線を伸ばし、2マス以上先の敵石を釣り上げてアゲハマに。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('FISHGO', '釣碁', 'fishgo'),
        K.params([
            { key: 'fish_range', label: '釣れる最小間合い', min: 1, max: 8, def: 2, unit: 'マス' },
        ]),
        // 釣り処理を通常捕獲の前に挿入
        [K.ONE, K.CAPTURE_BLOCK, `            // 釣碁: 打った石から4方向に伸ばした先にある敵石を釣り上げる
            move.cells.forEach(p => {
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    let d = 0;
                    while (true) {
                        d++;
                        const nx = p.x + dx * d, ny = p.y + dy * d;
                        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
                        const bi = board[ny * BOARD_SIZE + nx];
                        if (bi === 0) continue;         // 空点は飛び越す
                        if (bi === opponent && d >= Math.max(1, P('fish_range') || 2)) { // 間合いがあれば釣れる
                            const fi = ny * BOARD_SIZE + nx;
                            const ti = p.y * BOARD_SIZE + p.x;
                            board[fi] = 0;
                            captures[player]++;
                            cleanUpPieces();
                            fxSlide(fi, ti, 340);
                            fxSplash(fi, '#38bdf8', 10);
                            fxText(ti, '釣!', '#38bdf8', 950);
                        }
                        return; // 最初の石で針は止まる
                    }
                });
            });

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.INFO_BASE, `            釣碁: 着手点から直線を伸ばし、間合い先の敵石を釣り上げる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '打った石から上下左右に伸ばした直線の先、最初に当たる石が敵石なら釣り上げてアゲハマに。',
            '隣接 (1マス先) の敵石は釣れない — 間合いを取る位置取りが肝心。自石が先にあれば針は止まる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[8] = 2;
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('遠くの敵石を釣る', board[8] === 0 && captures[1] === 1);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[5] = 1; board[8] = 2;
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('自石が先なら釣れない', board[8] === 2 && captures[1] === 0);
    `,
};
