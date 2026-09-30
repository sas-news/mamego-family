// HOMINGGO — 帰巣碁: 巣(天元)から遠い石は餌不足で弱り、連が呼吸点を余分に必要とする
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
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'hominggo.html',
    en: 'HOMINGGO',
    jp: '帰巣碁',
    prefix: 'hominggo',
    desc: '巣(天元)から遠い石は弱る。遠巣の石1つにつき連は余分な呼吸点を必要とする。',
    kind: 'stone',
    icon: 'hominggo',
    spec: [
        ...K.rb('HOMINGGO', '帰巣碁', 'hominggo'),
        // 遠巣の石は弱い: 呼吸スコア <= 遠巣の石数 で取られる
        [K.ONE, `                    let hasLiberty = false;`, `                    let libScore = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                libScore++;`],
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 帰巣: 巣(天元)から遠い石は弱い — 遠巣1つにつき呼吸点+1を要求
                    let weak = 0;
                    {
                        const C = Math.floor(BOARD_SIZE / 2);
                        group.forEach(g => {
                            const gx = g % BOARD_SIZE, gy = Math.floor(g / BOARD_SIZE);
                            if (Math.abs(gx - C) + Math.abs(gy - C) >= 7) weak++;
                        });
                    }
                    if (libScore <= weak) {
                        captured.push(...group);
                    }`],
        // 遠巣の石に飢えの薄橙マーク
        ...K.STONE_MARKS_SPEC(`            // 遠巣 (巣から遠い) の石に飢えマーク
            {
                const C = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = 'rgba(249,115,22,0.85)';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    if (Math.abs(x - C) + Math.abs(y - C) < 7) return;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx + cellSize * 0.16, cy - cellSize * 0.16, cellSize * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        // 巣の位置: 天元に巣の目印
        K.CUE_STARS(`            // 巣 (天元) の目印
            {
                const C = Math.floor(BOARD_SIZE / 2);
                const cx = padding + C * cellSize, cy = padding + C * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(249,115,22,0.55)';
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.08]);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.9, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            帰巣碁: 巣(天元)から遠い石は弱り、連が余分な呼吸点を必要とする<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は全ての石の巣。天元から距離7以上の石は「遠巣」で弱っており (橙マーク)、連に1つにつき呼吸点+1を要求する。',
            '隅や辺に伸びた大きな連は呼吸点を大量に食い尽くされる。巣の近くで育てて遠征は短く。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 隅の遠巣白石: 呼吸点1個だけでは死ぬ (通常碁なら1呼吸で生存)
        board[I(0, 0)] = 2;
        board[I(1, 0)] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 別の場所に打って取り判定を走らせる
        assert('遠巣は呼吸1では死ぬ', board[I(0, 0)] === 0 && captures[1] === 1);
        // 巣の近くの石は通常どおり呼吸0でのみ死ぬ
        const C = Math.floor(BOARD_SIZE / 2);
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[I(C, C)] = 2;
        board[I(C - 1, C)] = 1; board[I(C + 1, C)] = 1; board[I(C, C - 1)] = 1;
        executeMove({ cells: [{ x: C, y: C + 1 }] }, 1);
        assert('巣の近くは通常取り', board[I(C, C)] === 0);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: C, y: C }] , 1) === true);
    `,
};
