// TITHEGO — 什一碁: 3石以上を取るとその約1割 (最低1個) が「税」として相手に納められる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
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
    file: 'tithego.html',
    en: 'TITHEGO',
    jp: '什一碁',
    prefix: 'tithego',
    desc: '3石以上を取ると約1割 (最低1個) が「税」として相手のアゲハマになる。',
    kind: 'stone',
    icon: 'tithego',
    spec: [
        ...K.rb('TITHEGO', '什一碁', 'tithego'),
        K.params([
            { key: 'tax_min', label: '課税される最小捕獲数', min: 2, max: 10, def: 3, unit: '石' },
            { key: 'tax_div', label: '税率', min: 2, max: 20, def: 10, hint: '取った石の1/N' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        // 什一の税: 3石以上の捕獲で約1割を相手に納める
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                const tax = captured.length >= (P('tax_min') || 3) ? Math.max(1, Math.floor(captured.length / (P('tax_div') || 10))) : 0;
                captures[player] += captured.length - tax;
                captures[opponent] += tax; // 什一の税: 取った石の一部が相手に納められる
                if (tax > 0) {
                    const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(ti, '税-' + tax, '#b45309', 1000);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            什一碁: 3石以上を取ると約1割 (最低1個) が税として相手に納められる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '3石以上を一度に取ると、取った石の約1割 (最低1個) が「税」として相手のアゲハマに加わる。',
            '大きく取るほど税も増える。小さく刻んで取るか、税を覚悟で一気に取るか。',
            '両者に同じ税率。着手・コウ・パス終局は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白3石連を黒で囲み、最後の呼吸点を黒が打つ
        [[4,4],[5,4],[6,4]].forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 2; });
        [[3,4],[4,3],[5,3],[6,3],[4,5],[5,5],[6,5]].forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 7, y: 4 }] }, 1);
        assert('3石を取った', captures[1] === 2);
        assert('税1個が相手に納められる', captures[2] === 1);
        assert('白の石は消えた', board[4 * BOARD_SIZE + 4] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
