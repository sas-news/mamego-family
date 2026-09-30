// YUBAGO — 湯葉碁: 横に4個以上連なった石の「膜」は湯葉として引き上げられ、終局時枚数分の得点
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
    file: 'yubago.html',
    en: 'YUBAGO',
    jp: '湯葉碁',
    prefix: 'yubago',
    desc: '横4連以上の石は湯葉の膜。終局時に膜の枚数 (長さ-3) が得点になる。',
    kind: 'stone',
    icon: 'yubago',
    spec: [
        ...K.rb('YUBAGO', '湯葉碁', 'yubago'),
        // 湯葉集計: 各段の同色横連 (4個以上) は長さ-3の得点
        [K.ONE, `        function endGameByScore() {`, `        // 湯葉: 横の連なりを数える
        function yubaBonus() {
            const b = { 1: 0, 2: 0 };
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = 0, pl = 0;
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const v = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : -1;
                    if (v === pl && (pl === 1 || pl === 2)) { run++; continue; }
                    if ((pl === 1 || pl === 2) && run >= 4) b[pl] += run - 3;
                    pl = v; run = (v === 1 || v === 2) ? 1 : 0;
                }
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 湯葉ルール: 横4連以上の膜は (長さ-3) 目の得点
            {
                const yb = yubaBonus();
                territory.black += yb[1];
                territory.white += yb[2];
            }`],
        // 湯葉膜の表示: 横4連以上に薄い膜ライン
        ...K.STONE_MARKS_SPEC(`            // 湯葉の膜: 横連の上に薄いライン
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let x = 0;
                    while (x < BOARD_SIZE) {
                        const v = board[y * BOARD_SIZE + x];
                        if (v !== 1 && v !== 2) { x++; continue; }
                        let x2 = x;
                        while (x2 + 1 < BOARD_SIZE && board[y * BOARD_SIZE + x2 + 1] === v) x2++;
                        const len = x2 - x + 1;
                        if (len >= 4) {
                            const y0 = padding + y * cellSize;
                            ctx.strokeStyle = v === 1 ? 'rgba(250, 240, 200, 0.85)' : 'rgba(190, 160, 60, 0.9)';
                            ctx.lineWidth = Math.max(1.4, cellSize * 0.08);
                            ctx.beginPath();
                            ctx.moveTo(padding + x * cellSize - cellSize * 0.3, y0 - cellSize * 0.16);
                            ctx.lineTo(padding + x2 * cellSize + cellSize * 0.3, y0 - cellSize * 0.16);
                            ctx.stroke();
                        }
                        x = x2 + 1;
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'湯葉 ' + (() => { let n = 0; for (let y = 0; y < BOARD_SIZE; y++) { let r = 0; for (let x = 0; x < BOARD_SIZE; x++) { const v = board[y * BOARD_SIZE + x]; if (v === turn) { r++; if (r === 4) n++; } else r = 0; } } return n + '膜'; })()`),
        [K.ONE, K.INFO_ALGO, `            湯葉碁: 横に4個以上連なった石は湯葉の膜 (終局時 長さ-3 目)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '横に4個以上連なった自分の石は「湯葉の膜」。終局時に膜1枚につき (長さ-3) 目が入る。',
            '長く伸ばすほど旨いが、敵に切られると膜は破れる。双方同じ条件の編み物勝負。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        for (let x = 2; x <= 6; x++) board[I(x, 3)] = 1; // 黒の横5連
        for (let x = 5; x <= 7; x++) board[I(x, 7)] = 2; // 白の横3連 (湯葉でない)
        assert('横5連は湯葉2枚分', yubaBonus()[1] === 2);
        assert('横3連は湯葉でない', yubaBonus()[2] === 0);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
