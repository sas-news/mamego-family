// SHIOMACHIGO — 潮待碁: 潮が引くと一列ずつ磯が干上がる。毎手、干上がった列 (行) には打てない
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
    file: 'shiomachigo.html',
    en: 'SHIOMACHIGO',
    jp: '潮待碁',
    prefix: 'shiomachigo',
    desc: '潮は毎手一列ずつ引く。干上がった行には打てない (列は順繰りに巡る)。',
    kind: 'stone',
    icon: 'shiomachigo',
    spec: [
        ...K.rb('SHIOMACHIGO', '潮待碁', 'shiomachigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 干上がり行: 手数に応じて1行ずつ潮が引く (双方同じ潮)
        function dryRow() {
            return history.length % BOARD_SIZE;
        }`],
        // 着手禁止: 干上がった行には打てない
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 潮待ち: 干上がった行 (行 dryRow) には着手不可
            const dr = dryRow();
            for (const p of cells) {
                if (p.y === dr) return false;
            }`],
        // 干上がり行を描く
        K.CUE_GRID(`            // 潮引き: 干上がった行を砂色に
            {
                ctx.save();
                const dr = dryRow();
                ctx.fillStyle = 'rgba(214,180,120,0.3)';
                ctx.fillRect(padding - cellSize * 0.5, padding + (dr - 0.5) * cellSize, BOARD_SIZE * cellSize, cellSize);
                ctx.strokeStyle = 'rgba(160,120,60,0.4)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.strokeRect(padding - cellSize * 0.5, padding + (dr - 0.5) * cellSize, BOARD_SIZE * cellSize, cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'干上がり ' + (dryRow() + 1) + '行目'`),
        [K.ONE, K.INFO_ALGO, `            潮待碁: 潮は毎手一列ずつ引く — 干上がった行 (砂色) には着手できない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手ごとに潮が引き、1行ずつ磯が干上がる — 干上がった行には誰も打てない。',
            '干上がり行は上から順に巡って一周する。潮の満ち引きは双方同じ。',
            '潮を待って良いタイミングで打て — 置いた石は潮が戻っても残る。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('初手の干上がりは0行', dryRow() === 0);
        assert('0行目は打てない', isValidPlacement([{ x: 5, y: 0 }], 1) === false);
        assert('1行目は打てる', isValidPlacement([{ x: 5, y: 1 }], 1) === true);
        history.length = 3;
        assert('3手目の干上がりは3行', dryRow() === 3);
        assert('3行目は打てない', isValidPlacement([{ x: 5, y: 3 }], 1) === false);
        assert('他の行は打てる', isValidPlacement([{ x: 5, y: 4 }], 1) === true);
    `,
};
