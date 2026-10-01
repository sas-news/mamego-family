// DOHYOGO — 土俵碁: 円形の土形の土俵で闘う。置いた石に隣接し縁に追い込まれた敵石は土俵外に突き出される
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 80) / 100))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
// 土俵の外 (中心から半径を超えるセル) は俵の壁
const RING = `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const cr = (BOARD_SIZE - 1) / 2, rr = Math.max(1, cr + (P('ring_grow') ?? 0));
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if ((x - cr) * (x - cr) + (y - cr) * (y - cr) > rr * rr) board[y * BOARD_SIZE + x] = 3; // 土俵の外
                }
            }`;
module.exports = {
    file: 'dohyogo.html',
    en: 'DOHYOGO',
    jp: '土俵碁',
    prefix: 'dohyogo',
    desc: '円形の土俵で闘う。置いた石に隣接し縁まで追い込まれた敵石は突き出されてアゲハマになる。',
    kind: 'stone',
    icon: 'dohyogo',
    spec: [
        ...K.rb('DOHYOGO', '土俵碁', 'dohyogo'),
        K.params([
            { key: 'ring_grow', label: '土俵の半径調整', min: -2, max: 2, step: 0.5, def: 0, hint: '0で元の大きさ' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 80, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.RESET_BOARD, RING],
        // 突き出し: 着手で、置いた石に隣接し俵(壁)に隣接する敵石は土俵外へ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 土俵碁: 俵(壁)に背中を預けた敵石は突き出される
            {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(ci).forEach(n => {
                    if (board[n] !== opponent) return;
                    if (!getNeighbors(n).some(m => board[m] === 3)) return; // 縁に居なければ突けない
                    board[n] = 0;
                    captures[player]++;
                    fxSlide(n, ci, player, 380, null);
                    fxBurst(n, '#fdba74', 10, 1.6);
                    fxText(n, '突き出し!', '#fed7aa', 1000);
                });
                cleanUpPieces();
            }

            turn = opponent;`],
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, K.CIRCLE_DRAW],
        ...K.WALL_GUARD_SPEC,
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            土俵碁: 円形の土俵で闘う — 置いた石に隣接し俵際の敵石は突き出されてアゲハマになる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '土俵は円形: 俵の外には着手できない。',
            '置いた石に隣接し、俵(盤の縁)にも隣接する敵石は土俵の外に突き出されてアゲハマになる。縁際の闘いが熱い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const cr = (BOARD_SIZE - 1) / 2;
        assert('角は土俵の外', board[0] === 3 && board[BOARD_SIZE - 1] === 3);
        assert('俵の外には着手不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('中央には着手可', isValidPlacement([{ x: cr, y: cr }], 1) === true);
        // 縁 (1,6) の白を突き出す: (2,6) に黒を置く
        board.fill(0); pieces = [];
        for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
            if ((x - cr) * (x - cr) + (y - cr) * (y - cr) > cr * cr) board[y * BOARD_SIZE + x] = 3;
        }
        board[3 * BOARD_SIZE + 1] = 2; // (1,3) — 西隣(0,3)は俵の壁 → 俵際
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('俵際の敵石は突き出される', board[3 * BOARD_SIZE + 1] === 0 && captures[1] === 1);
        board[4 * BOARD_SIZE + 4] = 2; // (4,4) — 縁ではない
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('縁でなければ突けない', board[4 * BOARD_SIZE + 4] === 2);
    `,
};
