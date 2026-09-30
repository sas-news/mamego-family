// BOUNCYGO — 弾み碁: 石は弾む。置くと反発して隣の全ての石を1マス弾き飛ばす
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'bouncygo.html',
    en: 'BOUNCYGO',
    jp: '弾み碁',
    prefix: 'bouncygo',
    desc: '石は弾む。置くと反発して隣の全ての石 (両色) を1マス弾き飛ばす。',
    kind: 'stone',
    icon: 'bouncygo',
    spec: [
        ...K.rb('BOUNCYGO', '弾み碁', 'bouncygo'),
        // 反発: 置いた石の隣の石 (両色) を1マス弾き飛ばす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 弾み: 隣接する全ての石 (敵味方両方) を着手石と反対方向へ1マス弾く
            {
                const bc = move.cells[0];
                const pushes = [];
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const fx2 = bc.x + dx, fy = bc.y + dy;
                    const tx = bc.x + dx * 2, ty = bc.y + dy * 2;
                    if (fx2 < 0 || fy < 0 || fx2 >= BOARD_SIZE || fy >= BOARD_SIZE) continue;
                    const fi = fy * BOARD_SIZE + fx2;
                    if (board[fi] !== 1 && board[fi] !== 2) continue;
                    if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) continue;
                    const ti = ty * BOARD_SIZE + tx;
                    if (board[ti] !== 0) continue;
                    pushes.push([fi, ti]);
                }
                if (pushes.length > 0) {
                    pushes.forEach(([fi, ti]) => {
                        board[ti] = board[fi];
                        board[fi] = 0;
                        fxSlide(fi, ti, 340);
                    });
                    fxShake(3, 200);
                    cleanUpPieces();
                    // 弾かれた結果、窒息した連があれば取る (双方)
                    [1, 2].forEach(pl => {
                        const dead = getCapturedStones(board, pl);
                        if (dead.length > 0) {
                            dead.forEach(i => board[i] = 0);
                            captures[pl === 1 ? 2 : 1] += dead.length;
                            cleanUpPieces();
                        }
                    });
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'石は弾む: 隣の石を弾き飛ばす'`),
        [K.ONE, K.INFO_ALGO, `            弾み碁: 置くと反発して隣の全ての石 (両色) を1マス弾き飛ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を置くと反発し、直交する全ての石 (敵味方両方) が着手石と反対方向へ1マス弾かれる。',
            '弾かれた先が盤外や占有なら動かない。弾かれて窒息した連は取られる。',
            '敵を弾いて崩すもよし、味方を弾いて逃がすもよし。反発は両者に同じ力。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 敵石を弾く
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('敵石が弾かれる', board[I(4, 3)] === 2 && board[I(4, 4)] === 0);
        // 味方石も弾かれる
        board[I(7, 7)] = 1;
        executeMove({ cells: [{ x: 7, y: 8 }] }, 1);
        assert('味方石も弾かれる', board[I(7, 6)] === 1 && board[I(7, 7)] === 0);
        // 端際は弾けない (弾き先が盤外)
        board[I(0, 0)] = 2;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('盤外へは弾かない', board[I(0, 0)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
