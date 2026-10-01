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
        K.params([
            { key: 'cell_score', label: '消えたマス1つあたりの得点', min: 0, max: 4, def: 1, unit: '点' },
            { key: 'cap_rows', label: '打ち切り手数', min: 0, max: 8, def: 2, unit: '行', hint: '盤面+この行数' },
        ]),
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
                        // 列消滅: 各マスが弾けて消える
                        for (let x = 0; x < BOARD_SIZE; x++) {
                            const i = y * BOARD_SIZE + x;
                            fxBurst(i, '#a78bfa', 7, 1.4);
                            fxGlow(i, '#c4b5fd', 650);
                            board[i] = 0;
                        }
                        cleared += BOARD_SIZE;
                        fxText(y * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '+' + BOARD_SIZE + ' 列消滅!', '#a78bfa', 1300);
                    }
                }
                if (cleared > 0) { captures[player] += cleared * (P('cell_score') ?? 1); fxShake(5, 320); cleanUpPieces(); }
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_rows') ?? 2))) {
                endGameByScore();
                return;
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
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
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
