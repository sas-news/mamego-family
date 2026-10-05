// MOATSGO — 堀碁: 中央を囲む環状堀で内外分断
const K = require('../gen_kit.js');
module.exports = {
    file: 'moatsgo.html',
    en: 'MOATSGO',
    jp: '堀碁',
    prefix: 'moatsgo',
    desc: '中央の郭を囲む環状の堀。内外が完全に分断された城の盤。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('MOATSGO', '堀碁', 'moatsgo'),
        K.params([
            { key: 'moat_shift', label: '堀の位置補正', min: -2, max: 2, def: 0, hint: '中心からの距離 (標準は盤サイズ÷4) からのずれ' },
        ]),
        // チェビシェフ距離 k の環状堀
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2), k = Math.max(1, Math.round(BOARD_SIZE / 4) + (P('moat_shift') ?? 0));
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.max(Math.abs(x - c), Math.abs(y - c)) === k) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 堀は揺れる水面
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1b5e8a', '#0a3049'))],
        ...K.WALL_GUARD_SPEC,
        // 堀の水面のきらめき
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        [K.ONE, K.RV_BASE, K.rv([
            '中央の郭を取り囲む環状の堀。橋はなく内外は完全に分断。',
            '城内と外野は別々の戦場。どちらを制するかの配分勝負。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
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
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
