// HONEYGO — 蜂巣碁: 斜交する壁がハニカム状に盤を分断
const K = require('../gen_kit.js');
module.exports = {
    file: 'honeygo.html',
    en: 'HONEYGO',
    jp: '蜂巣碁',
    prefix: 'honeygo',
    desc: '斜交する壁が六角の巣房を刻む。小部屋ごとの局地戦。',
    kind: 'stone',
    spec: [
        ...K.rb('HONEYGO', '蜂巣碁', 'honeygo'),
        // 2方向の斜め壁が交差して菱形〜六角の巣房を作る
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if ((x + y) % 5 === 0 || (x - y + 2 * BOARD_SIZE) % 5 === 0) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 巣房っぽく蜂蜜色の壁
        [K.ONE, '            const covered = new Set(); // ピース描画でカバー済みのマス', K.voidDraw('"#8a6a20"')],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '斜めに交差する壁がハニカム状の巣房を作る。',
            '巣房を隔てる薄い隔壁をめぐって小さな殺し合いが連続する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        let walls = 0;
        for (const v of board) if (v === 3) walls++;
        assert('蜂巣状の壁がある', walls > 20);
        let playable = -1;
        for (let i = 0; i < board.length; i++) if (board[i] === 0) { playable = i; break; }
        assert('巣房の内側は置ける', playable >= 0 && isValidPlacement([{ x: playable % BOARD_SIZE, y: Math.floor(playable / BOARD_SIZE) }], 1) === true);
        assert('壁には置けない', (() => {
            for (let i = 0; i < board.length; i++) if (board[i] === 3) return !isValidPlacement([{ x: i % BOARD_SIZE, y: Math.floor(i / BOARD_SIZE) }], 1);
            return false;
        })());
        executeMove({ cells: [{ x: playable % BOARD_SIZE, y: Math.floor(playable / BOARD_SIZE) }] }, 1);
        assert('交互着手が機能', turn === 2);
    `,
};
