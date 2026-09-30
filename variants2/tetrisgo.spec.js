// TETRISGO — 消滅列碁: 全マス埋まった行が消えて着手者の得点になる
const K = require('../gen_kit.js');
module.exports = {
    file: 'tetrisgo.html',
    en: 'TETRISGO',
    jp: '消滅列碁',
    prefix: 'tetrisgo',
    desc: '行が全て埋まると消滅して着手者の得点に。自石ごと消える諸刃の列消し。',
    kind: 'stone',
    spec: [
        ...K.rb('TETRISGO', '消滅列碁', 'tetrisgo'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 消滅列: 空点0の行が消え、消えたマス数だけ着手者の得点になる
            {
                let cleared = 0;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let full = true;
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (board[y * BOARD_SIZE + x] === 0) { full = false; break; }
                    }
                    if (full) {
                        for (let x = 0; x < BOARD_SIZE; x++) board[y * BOARD_SIZE + x] = 0;
                        cleared += BOARD_SIZE;
                    }
                }
                if (cleared > 0) { captures[player] += cleared; cleanUpPieces(); }
            }

            turn = opponent;`],
        // 残り1空点の行を警告色でハイライト
        K.CUE_GRID(`            // 消えかけの行を薄く警告表示
            for (let ry = 0; ry < BOARD_SIZE; ry++) {
                let empt = 0;
                for (let rx = 0; rx < BOARD_SIZE; rx++) if (board[ry * BOARD_SIZE + rx] === 0) empt++;
                if (empt === 1) {
                    ctx.fillStyle = 'rgba(239,68,68,0.14)';
                    ctx.fillRect(padding - cellSize * 0.5, padding + (ry - 0.5) * cellSize, cellSize * BOARD_SIZE, cellSize);
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            消滅列碁: 行が全部埋まると消滅し、埋めた側の得点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '空点のない行は着手直後に消滅し、消えたマス数が着手者のアゲハマ得点になる。',
            '自分の石も道連れで消えるので、敵石を多く含む行を完成させるのが美味しい。',
            '残り1空点の行は盤上で警告表示される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        for (let x = 0; x < BOARD_SIZE - 1; x++) board[x] = 2;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: 0 }] }, 1);
        assert('埋まった行は消滅', board[0] === 0 && board[BOARD_SIZE - 1] === 0);
        assert('消滅分が得点', captures[1] === BOARD_SIZE);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        for (let x = 1; x < BOARD_SIZE; x++) board[x] = 2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('空点が残れば消えない', board[BOARD_SIZE - 1] === 2);
    `,
};
