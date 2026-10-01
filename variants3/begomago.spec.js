// BEGOMAGO — ベーゴマ碁: 置いた石に隣接する敵石はぶつかって1マス押し出される。盤外へ飛べばアゲハマ
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'begomago.html',
    en: 'BEGOMAGO',
    jp: 'ベーゴマ碁',
    prefix: 'begomago',
    desc: '置いた石が敵石にぶつかって1マス押し出す。盤外へ弾き飛ばせばアゲハマに。',
    kind: 'stone',
    icon: 'begomago',
    spec: [
        ...K.rb('BEGOMAGO', 'ベーゴマ碁', 'begomago'),
        // ぶつかり: 着地点に隣接する敵石を1マス押し出す (盤外なら場外アゲハマ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ベーゴマ碁: 隣接した敵石はぶつかって1マス押し出される (盤外ならアゲハマ)
            {
                const bc = move.cells[0];
                const ci = bc.y * BOARD_SIZE + bc.x;
                getNeighbors(ci).forEach(n => {
                    if (board[n] !== opponent) return;
                    const nx = n % BOARD_SIZE, ny = Math.floor(n / BOARD_SIZE);
                    const tx = nx + (nx - bc.x), ty = ny + (ny - bc.y);
                    if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) {
                        // 盤外へ弾き飛ばした → 場外アゲハマ
                        board[n] = 0;
                        captures[player]++;
                        fxBurst(n, '#f97316', 12, 2.0);
                        fxText(n, '場外!', '#fb923c', 900);
                        fxShake(4, 260);
                    } else {
                        const t = ty * BOARD_SIZE + tx;
                        if (board[t] === 0) {
                            board[t] = board[n];
                            board[n] = 0;
                            fxSlide(n, t, 320);
                            fxBurst(t, '#eab308', 6, 1.2);
                            // 押し出し先で孤立した連の救済はしない (次の捕獲判定に委ねる)
                        } else {
                            fxText(n, 'ガン!', '#a8a29e', 700); // 押し先が塞がっていて動かない
                        }
                    }
                });
                cleanUpPieces();
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            ベーゴマ碁: 置いた石に隣接する敵石は1マス押し出される。盤外へ飛べばアゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石の上下左右に隣接する敵石は、ベーゴマ同士の衝突で1マス押し出される。',
            '押し出し先が盤外なら場外に飛んでアゲハマ。別の石があれば跳ね返って動かない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 5] = 2; // 白 at (5,4)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒 at (4,4) → 白を(6,4)へ押し出す
        assert('敵石が1マス押し出される', board[4 * BOARD_SIZE + 6] === 2 && board[4 * BOARD_SIZE + 5] === 0);
        // 盤外への押し出し: 白を右端に置いて黒でぶつける
        board[8 * BOARD_SIZE + 12] = 2;
        executeMove({ cells: [{ x: 11, y: 8 }] }, 1);
        assert('盤外へ飛ぶとアゲハマ', board[8 * BOARD_SIZE + 12] === 0 && captures[1] === 1);
        // 押し先が塞がっていれば動かない
        board[2 * BOARD_SIZE + 6] = 2; board[2 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 5, y: 2 }] }, 1);
        assert('押し先が石なら動かない', board[2 * BOARD_SIZE + 6] === 2);
    `,
};
