// FASTINGO — 斎戒碁: 6手ごとに斎戒手番 — 盤中央域には打てず縁 (外周2路) のみに制限される
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
    file: 'fastingo.html',
    en: 'FASTINGO',
    jp: '斎戒碁',
    prefix: 'fastingo',
    desc: '6手ごとの斎戒手番は身を清めて縁 (外周2路) のみに打てる。',
    kind: 'stone',
    icon: 'fastingo',
    spec: [
        ...K.rb('FASTINGO', '斎戒碁', 'fastingo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 斎戒手番: 6手ごと (historyの手数が6の倍数の次手)
        function isFastingTurn() {
            return (history.length + 1) % 6 === 0;
        }
        // 縁点: 盤外周2路以内
        function isRimPoint(x, y) {
            const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
            return d <= 1;
        }`],
        // 着手禁止: 斎戒手番は縁のみ
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 斎戒: この手番は身を清めて縁 (外周2路) のみ打てる
            if (isFastingTurn()) {
                for (const p of cells) {
                    if (!isRimPoint(p.x, p.y)) return false;
                }
            }`],
        // 斎戒の制限域を表示
        K.CUE_GRID(`            // 斎戒手番: 中央域を白く祓って縁のみ残す
            if (isFastingTurn()) {
                ctx.save();
                ctx.fillStyle = 'rgba(240,240,235,0.4)';
                ctx.fillRect(padding + 1.5 * cellSize, padding + 1.5 * cellSize, (BOARD_SIZE - 3) * cellSize, (BOARD_SIZE - 3) * cellSize);
                ctx.strokeStyle = 'rgba(180,160,90,0.5)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.strokeRect(padding + 1.5 * cellSize, padding + 1.5 * cellSize, (BOARD_SIZE - 3) * cellSize, (BOARD_SIZE - 3) * cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`isFastingTurn() ? '斎戒中: 縁のみ' : '斎戒まで' + (6 - ((history.length + 1) % 6)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            斎戒碁: 6手ごとの斎戒手番は身を清めて縁 (外周2路) のみに打てる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとの手番は斎戒 — 中央域は祓われ、盤の縁 (外周2路以内) にしか打てない。',
            '斎戒中に打てる点がなければパスしかない。交互に訪れる制約は双方同じ。',
            '斎戒を読み切って布石しろ — 縁を制する者が願いを届ける。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('初手は斎戒でない', isFastingTurn() === false);
        history.length = 5; // 次が6手目 → 斎戒
        assert('6手目は斎戒', isFastingTurn() === true);
        assert('縁点は斎戒中OK', isValidPlacement([{ x: 0, y: 5 }], 1) === true);
        assert('中央は斎戒中NG', isValidPlacement([{ x: 6, y: 6 }], 1) === false);
        history.length = 0;
        assert('斎戒後は中央OK', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
