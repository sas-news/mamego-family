// RAMMERGO — 重錘碁: 置いた石は重い錘。同じ列の下の石を全て1段押し潰す (最下段は押し出されて砕ける)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'rammergo.html',
    en: 'RAMMERGO',
    jp: '重錘碁',
    prefix: 'rammergo',
    desc: '置いた石は重い錘。同じ列の下の石を全て1段ずつ押し潰す (最下段は砕ける)。',
    kind: 'stone',
    icon: 'rammergo',
    spec: [
        ...K.rb('RAMMERGO', '重錘碁', 'rammergo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 重錘: 同じ列で自分より下の石を全て1段ずつ押し下げる (最下段の石は砕ける)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 重錘: 同じ列で自分より下にある石を全て1段ずつ押し潰す
            {
                const bc = move.cells[0];
                const below = [];
                for (let y = bc.y + 1; y < BOARD_SIZE; y++) {
                    const i = y * BOARD_SIZE + bc.x;
                    if (board[i] === 1 || board[i] === 2) below.push(i);
                }
                if (below.length > 0) {
                    // 一番下から順に1段ずつ押し下げる (最下段は盤外へ砕ける)
                    below.sort((a, b) => b - a).forEach(i => {
                        const y = Math.floor(i / BOARD_SIZE);
                        if (y === BOARD_SIZE - 1) {
                            if (board[i] === opponent) captures[player]++;
                            board[i] = 0;
                            fxBurst(i, '#78716c', 12, 1.6);
                        } else {
                            board[i + BOARD_SIZE] = board[i];
                            board[i] = 0;
                            fxSlide(i, i + BOARD_SIZE, 320);
                        }
                    });
                    const ci = bc.y * BOARD_SIZE + bc.x;
                    fxText(ci, 'ドカン!', '#a8a29e', 1000);
                    fxShake(5, 280);
                    cleanUpPieces();
                    // 押し潰しの結果、窒息した連があれば取る (双方)
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
        ...K.EVENT_CHIP_SPEC(`'重錘: 同じ列の下の石を押し潰す'`),
        [K.ONE, K.INFO_BASE, `            重錘碁: 置いた石は重い錘。同じ列の下の石を全て1段ずつ押し潰す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いた石は重い錘となり、同じ列で自分より下にある全ての石を1段ずつ押し下げる。',
            '最下段にあった石は盤外へ押し出されて砕ける (敵石はアゲハマ、自石は損失)。',
            '上から石を積むほど列全体が沈む。重錘は両者に同じ重さ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 列に白(4,8)黒(4,10) — 黒が(4,6)に置くと両方1段沈む
        board[I(4, 8)] = 2; board[I(4, 10)] = 1;
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1);
        assert('下の石が1段沈む', board[I(4, 9)] === 2 && board[I(4, 11)] === 1);
        assert('元の場所は空く', board[I(4, 8)] === 0 && board[I(4, 10)] === 0);
        // 最下段の敵石は砕けてアゲハマ
        board[I(7, BOARD_SIZE - 1)] = 2;
        executeMove({ cells: [{ x: 7, y: 0 }] }, 1);
        assert('最下段は砕ける', board[I(7, BOARD_SIZE - 1)] === 0);
        assert('敵の砕けた石はアゲハマ', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
