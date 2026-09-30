// FULCRUMGO — 梃碁: 石は梃子。置くと隣の敵石を梃子で跳ね飛ばす (反対側へ / 端では盤外へ)
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
    file: 'fulcrumgo.html',
    en: 'FULCRUMGO',
    jp: '梃碁',
    prefix: 'fulcrumgo',
    desc: '石は梃子。置くと隣の敵石を反対側へ跳ね飛ばす (盤端では盤外へ飛んで取る)。',
    kind: 'stone',
    icon: 'fulcrumgo',
    spec: [
        ...K.rb('FULCRUMGO', '梃碁', 'fulcrumgo'),
        // 梃子: 隣の敵石を着手石の反対側へ跳ね飛ばす (盤外へ飛べばアゲハマ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 梃子: 隣の敵石を着手石を支点に反対側へ跳ね飛ばす
            {
                const bc = move.cells[0];
                const victims = [];
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const ex = bc.x + dx, ey = bc.y + dy;
                    if (ex < 0 || ey < 0 || ex >= BOARD_SIZE || ey >= BOARD_SIZE) continue;
                    if (board[ey * BOARD_SIZE + ex] === opponent) victims.push([dx, dy]);
                }
                let flung = false;
                victims.forEach(([dx, dy]) => {
                    const ex = bc.x + dx, ey = bc.y + dy;
                    const ei = ey * BOARD_SIZE + ex;
                    if (board[ei] !== opponent) return;
                    // 支点の反対側 = 着手石の向こう側
                    const lx = bc.x - dx, ly = bc.y - dy;
                    if (lx < 0 || ly < 0 || lx >= BOARD_SIZE || ly >= BOARD_SIZE) {
                        // 盤外へ跳ね飛ぶ → 取る
                        board[ei] = 0;
                        captures[player]++;
                        fxBurst(ei, '#f97316', 12, 2.0);
                        flung = true;
                        return;
                    }
                    const li = ly * BOARD_SIZE + lx;
                    if (board[li] !== 0) return; // 障害があれば梃子は効かない
                    board[li] = board[ei];
                    board[ei] = 0;
                    fxSlide(ei, li, 380);
                    flung = true;
                });
                if (flung) {
                    const ci = bc.y * BOARD_SIZE + bc.x;
                    fxText(ci, 'テコ!', '#fb923c', 900);
                    cleanUpPieces();
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
        ...K.EVENT_CHIP_SPEC(`'梃子: 隣の敵石を跳ね飛ばす'`),
        [K.ONE, K.INFO_ALGO, `            梃碁: 置くと隣の敵石を梃子で跳ね飛ばす。盤端では盤外へ飛んで取れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を置くと、隣の敵石が着手石を支点に反対側へ跳ね飛ばされる (着地点が空なら)。',
            '端際で梃子を使うと敵石は盤外へ飛んでいきアゲハマになる。',
            '敵陣を跳ね崩しにする梃子。両者同じ力で働く。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白(4,4)の隣に黒(4,5)を置く → 白は反対側(4,6)へ跳ぶ
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('敵石が反対側へ跳ぶ', board[I(4, 6)] === 2 && board[I(4, 4)] === 0);
        // 盤端では盤外へ飛んで取る: 白(1,6)の隣 (支点) に黒(0,6)を置く → 白は(-1,6)の盤外へ
        board[I(1, 6)] = 2;
        executeMove({ cells: [{ x: 0, y: 6 }] }, 1);
        assert('盤外へ跳んで取る', board[I(1, 6)] === 0 && captures[1] === 1);
        // 跳び先が塞がっていれば跳ばない
        board[I(7, 7)] = 2; board[I(7, 9)] = 1;
        executeMove({ cells: [{ x: 7, y: 8 }] }, 1);
        assert('跳び先が塞がれば跳ばない', board[I(7, 7)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
    `,
};
