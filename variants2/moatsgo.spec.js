// MOATSGO — 堀碁: 中央を囲む環状堀で内外分断
const K = require('../gen_kit.js');
module.exports = {
    file: 'moatsgo.html',
    en: 'MOATSGO',
    jp: '堀碁',
    prefix: 'moatsgo',
    desc: '中央の郭を囲む環状の堀。内外が完全に分断された城の盤。',
    kind: 'stone',
    spec: [
        ...K.rb('MOATSGO', '堀碁', 'moatsgo'),
        // チェビシェフ距離 k の環状堀
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), k = Math.round(BOARD_SIZE / 4);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.max(Math.abs(x - c), Math.abs(y - c)) === k) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 堀は水色
        [K.ONE, '            const covered = new Set(); // ピース描画でカバー済みのマス', K.voidDraw('"#2b4a63"')],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '中央の郭を取り囲む環状の堀。橋はなく内外は完全に分断。',
            '城内と外野は別々の戦場。どちらを制するかの配分勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2), k = Math.round(N / 4);
        assert('郭の中は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('堀には置けない', isValidPlacement([{ x: c - k, y: c }], 1) === false);
        assert('外野は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const seen = new Set([c * N + c]);
        const qq = [c * N + c];
        while (qq.length) {
            const i = qq.pop();
            getNeighbors(i).forEach(n => { if (board[n] === 0 && !seen.has(n)) { seen.add(n); qq.push(n); } });
        }
        assert('内側から外へ出られない', !seen.has(0) && seen.size <= (2 * k - 1) * (2 * k - 1));
    `,
};
