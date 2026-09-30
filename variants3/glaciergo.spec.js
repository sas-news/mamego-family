// GLACIERGO — 氷河碁: 8手ごとに氷河が上から1行侵食。押し流された石は下へ積み、最下段は融ける
const K = require('../gen_kit.js');
module.exports = {
    file: 'glaciergo.html',
    en: 'GLACIERGO',
    jp: '氷河碁',
    prefix: 'glaciergo',
    desc: '8手ごとに氷河が上端から1行ずつ盤を凍らせる。石は下へ押し流され、最下段は融けて消える。',
    kind: 'stone',
    icon: 'glaciergo',
    spec: [
        ...K.rb('GLACIERGO', '氷河碁', 'glaciergo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        const GLACE_EVERY = 8; // 氷河の侵食周期
        // 氷河の前線: 何列目まで凍ったか
        function glaceFront() { return Math.floor(history.length / GLACE_EVERY); }`],
        // 氷河侵食: 凍る行の石は1マス下へ押され、最下段の石は融けて消える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 氷河: 8手ごとに上から1行が凍る
            if (history.length > 0 && history.length % GLACE_EVERY === 0) {
                const front = history.length / GLACE_EVERY - 1;
                // 最下段は凍らない (残り1行に石が取り残されても全滅しない)
                if (front >= 0 && front < BOARD_SIZE - 1) {
                    fxShake(8, 400);
                    fxText(front * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '氷河!', '#7dd3fc', 1200);
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const bi = (BOARD_SIZE - 1) * BOARD_SIZE + x;
                        if (board[bi] === 1 || board[bi] === 2) {
                            fxBurst(bi, '#7dd3fc', 9, 1.4); // 融けて消える (アゲハマなし)
                        }
                        // 列を1マス下へシフト
                        for (let y = BOARD_SIZE - 1; y > front; y--) {
                            board[y * BOARD_SIZE + x] = board[(y - 1) * BOARD_SIZE + x];
                        }
                        board[front * BOARD_SIZE + x] = 3; // 凍結
                    }
                    cleanUpPieces();
                }
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 氷の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#9fd8f0', '#3d7ea8'))],
        // 氷を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_MIST('125,211,252')],
        [K.ONE, K.INFO_ALGO, `            氷河碁: 8手ごとに氷河が上から1行凍らせる。石は押し流される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '8手ごとに氷河が盤の上端から1行ずつ侵食。凍った行は着手も呼吸点にもならない。',
            '行の石は1マス下へ押し流される。最下段の石は融けて消える (アゲハマなし)。最下段だけは永遠に凍らない。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(2, 0)] = 1; // 最上段に黒
        history.length = 7;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 8手目 → 氷河侵食
        assert('上段が凍る', board[I(0, 0)] === 3 && board[I(1, 0)] === 3);
        assert('石は押し流される', board[I(2, 1)] === 1 && board[I(2, 0)] === 3);
        // 凍った行には置けない
        assert('氷には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('下段には置ける', isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === true);
    `,
};
