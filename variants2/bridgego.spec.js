// BRIDGEGO — 架橋碁: 海峡で分かれた左右大陸を1本の橋が繋ぐ
const K = require('../gen_kit.js');
module.exports = {
    file: 'bridgego.html',
    en: 'BRIDGEGO',
    jp: '架橋碁',
    prefix: 'bridgego',
    desc: '中央の海峡で断たれた2大陸。唯一の橋を巡る攻防。',
    kind: 'stone',
    spec: [
        ...K.rb('BRIDGEGO', '架橋碁', 'bridgego'),
        // 中央列を海峡に (中央1点だけ橋)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) board[y * BOARD_SIZE + c] = 3;
                board[c * BOARD_SIZE + c] = 0;
            }`],
        // 海峡は青く
        [K.ONE, '            const covered = new Set(); // ピース描画でカバー済みのマス', K.voidDraw('"#2b4a63"')],
        ...K.WALL_GUARD_SPEC,
        // 橋に木の板マーク
        K.CUE_STARS(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = '#8a5a2b';
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.fillRect(cx - cellSize * 0.34, cy - cellSize * 0.10, cellSize * 0.68, cellSize * 0.20);
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の海峡で左右2つの大陸に分断。',
            '渡れるのは中央1点の橋だけ。橋頭堡を押さえれば大陸間の連絡を断てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('橋は渡れる', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('海峡は置けない', isValidPlacement([{ x: c, y: 0 }], 1) === false);
        assert('橋で両岸が繋がる', getNeighbors(c * N + c - 1).includes(c * N + c) && getNeighbors(c * N + c + 1).includes(c * N + c));
        const t = board.slice(); t[c * N + c] = 3;
        const seen = new Set([0]); const qq = [0];
        while (qq.length) {
            const i = qq.pop();
            getNeighbors(i).forEach(n => { if (t[n] === 0 && !seen.has(n)) { seen.add(n); qq.push(n); } });
        }
        assert('橋を失えば渡れない', ![...seen].some(i => i % N > c));
        assert('大陸の上は普通に置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
