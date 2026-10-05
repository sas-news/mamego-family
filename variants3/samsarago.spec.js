// SAMSARAGO — 輪廻碁: 取られた石は六道を廻り、すぐ近くの空き地に同じ色で再誕する
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.max(1, P('move_cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'samsarago.html',
    en: 'SAMSARAGO',
    jp: '輪廻碁',
    prefix: 'samsarago',
    desc: '取られた石は六道を廻り、近くの空き地に同じ色で再誕する。',
    kind: 'stone',
    icon: 'samsarago',
    spec: [
        ...K.rb('SAMSARAGO', '輪廻碁', 'samsarago'),
        K.params([
            { key: 'move_cap', label: '打ち切り手数', min: 40, max: 400, def: 150, unit: '手' },
        ]),
        // 輪廻: 取られた石は盤上を前へ旅し、最初に見つけた空き地に再誕する
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const reborn = [];
                captured.forEach(idx => {
                    board[idx] = 0;
                    captures[player]++;
                    // 六道を廻る旅: 魂はその場所から盤を前へ進み、空きを見つけて再誕する
                    let spot = -1;
                    for (let step = 1; step <= BOARD_SIZE * BOARD_SIZE; step++) {
                        const cand = (idx + step) % (BOARD_SIZE * BOARD_SIZE);
                        if (board[cand] === 0) { spot = cand; break; }
                    }
                    if (spot >= 0) {
                        board[spot] = opponent; // 同じ色の魂で再誕
                        reborn.push(spot);
                        fxSlide(idx, spot, 500);
                        fxText(spot, '再誕', '#f0abfc', 1000);
                    }
                });
                captures[player] -= reborn.length; // 再誕した石はアゲハマに数えない
                soundManager.playCapture();
                cleanUpPieces();
                // 再誕した石が窒息していたらそのまま消滅 (成仏)
                const gone = getCapturedStones(board, opponent).concat(getCapturedStones(board, player));
                if (gone.length) {
                    gone.forEach(i => board[i] = 0);
                    cleanUpPieces();
                }
            } else {
                soundManager.playPlace();
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            輪廻碁: 取られた石は六道を廻り、近くの空き地に再誕する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた石の魂は六道を廻り — その場所から盤を前へ進み、最初に見つけた空き地に同じ色で再誕する。',
            '再誕した石はアゲハマにならない。取っても相手の石は死なずに還ってくる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('取られた場所は空く', board[I(4, 4)] === 0);
        assert('近くに再誕する', board[I(6, 4)] === 2);
        assert('再誕した石はアゲハマに入らない', captures[1] === 0);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
