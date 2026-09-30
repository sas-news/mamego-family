// ROKUROHIGO — 轆轤碁: 各着手後、盤が轆轤のように90度回転する (取り・コウは回転後の盤で判定)
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'rokurohigo.html',
    en: 'ROKUROHIGO',
    jp: '轆轤碁',
    prefix: 'rokurohigo',
    desc: '各着手後、盤が轆轤のように90度回転する。',
    kind: 'stone',
    icon: 'rokurohigo',
    spec: [
        ...K.rb('ROKUROHIGO', '轆轤碁', 'rokurohigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 轆轤回転: 盤を時計回り90度回す ((x,y) → (B-1-y, x))
        function spinBoard() {
            const nb = board.slice();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                nb[x * BOARD_SIZE + (BOARD_SIZE - 1 - y)] = board[y * BOARD_SIZE + x];
            }
            for (let i = 0; i < board.length; i++) board[i] = nb[i];
            pieces.forEach(pc => pc.cells.forEach(p => { const nx = BOARD_SIZE - 1 - p.y, ny = p.x; p.x = nx; p.y = ny; }));
            if (lastMove) lastMove.cells.forEach(p => { const nx = BOARD_SIZE - 1 - p.y, ny = p.x; p.x = nx; p.y = ny; });
            cleanUpPieces();
            fxShake(2, 250);
        }`],
        // 着手後・取り解決後に盤を回転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            spinBoard();

            turn = opponent;`],
        [K.ONE, K.INFO_ALGO, `            轆轤碁: 各着手後、盤全体が轆轤のように時計回り90度回転する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたびに盤面全体が時計回りに90度回転する — 石の座標が変わる。',
            '取り・コウの判定は回転後の盤面で行われる。追いかけっこの絶えない器作り。',
            '回転は双方同じ — 相手の次の一手がどこに来るかを読め。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1); // 着手後に回転: (2,3) → (x'=B-1-3, y'=2)
        const sx = BOARD_SIZE - 1 - 3, sy = 2;
        assert('石が90度回転する', board[I(sx, sy)] === 1 && board[I(2, 3)] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        board.fill(0); pieces = []; history.length = 0;
        board[I(5, 5)] = 2;
        spinBoard();
        assert('spinBoardは盤を回す', board[I(BOARD_SIZE - 1 - 5, 5)] === 2);
        assert('中心近傍が回転後も保持', board.some(v => v === 2));
    `,
};
