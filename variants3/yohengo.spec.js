// YOHENGO — 窯変碁: 窯の中では何が起きるか分からない。着手時12%で石が「窯変」して別の色に変わる
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'yohengo.html',
    en: 'YOHENGO',
    jp: '窯変碁',
    prefix: 'yohengo',
    desc: '着手時12%で石が窯変して相手の色に変わる (変化は双方に公平)。',
    kind: 'stone',
    icon: 'yohengo',
    spec: [
        ...K.rb('YOHENGO', '窯変碁', 'yohengo'),
        K.params([
            { key: 'mutation_rate', label: '窯変の確率', min: 0, max: 0.5, step: 0.01, def: 0.12 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        // 窯変: 着手直後、置いた石が12%で色反転 (置いた本人にも起きる)
        [K.ONE, `            // ネクストモードでは次のピースを供給`, `            // 窯変: 置いた石が一定確率で相手の色に焼き変わる
            let mutated = false;
            if (Math.random() < (P('mutation_rate') ?? 0.12)) {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[mi] === player) {
                    board[mi] = opponent;
                    mutated = true;
                    const pc = pieces[pieces.length - 1];
                    if (pc) pc.player = opponent;
                    fxBurst(mi, '#d97706', 10, 1.6);
                    fxText(mi, '窯変!', '#d97706', 1200);
                }
            }
            // 窯変後は取りを再解決 (変色で双方の連が死に得る)
            if (mutated) {
                const recapOpp = getCapturedStones(board, opponent);
                if (recapOpp.length) { recapOpp.forEach(idx => board[idx] = 0); captures[player] += recapOpp.length; }
                const recap = getCapturedStones(board, player);
                if (recap.length) { recap.forEach(idx => board[idx] = 0); captures[opponent] += recap.length; }
                if (recapOpp.length || recap.length) cleanUpPieces();
            }

            // ネクストモードでは次のピースを供給`],
        [K.ONE, K.INFO_ALGO, `            窯変碁: 着手するたび12%の確率でその石が「窯変」して相手の色に変わる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '窯の中では何が起きるか分からない — 着手のたび12%でその石が相手の色に「窯変」する。',
            '窯変は双方に公平に起きる。変色で連が死ぬことも生きることもある。',
            '確率に抗うか運に身を任せるか — 曜変天目のように一変する盤を読め。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        const c = board[I(5, 5)];
        assert('着手で石が置かれる', c === 1 || c === 2);
        if (c === 2) assert('窯変した石は相手色', pieces[pieces.length - 1].player === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        // 通常着手が機能する
        board.fill(0); pieces = []; history.length = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('連続着手可', board.some(v => v !== 0));
    `,
};
