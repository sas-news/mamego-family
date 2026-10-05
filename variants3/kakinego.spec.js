// KAKINEGO — 垣根碁: 中央の垣根ライン(縦横の正中線)に石を立てて庭を区切ると得点
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kakinego.html',
    en: 'KAKINEGO',
    jp: '垣根碁',
    prefix: 'kakinego',
    desc: '盤を四分割する垣根ライン(中央十字)に立てた石は、別天地を区切る垣根として+2目。',
    kind: 'stone',
    icon: 'kakinego',
    spec: [
        ...K.rb('KAKINEGO', '垣根碁', 'kakinego'),
        K.params([
            { key: 'fence_pts', label: '垣根石1個の得点', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 垣根ボーナス: 中央の行・列にある自石ごとに+2
        [K.ONE, `        function endGameByScore() {`,
`        function fenceBonus(player) {
            const c = Math.floor(BOARD_SIZE / 2);
            let n = 0;
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (board[c * BOARD_SIZE + i] === player) n++;
                if (board[i * BOARD_SIZE + c] === player) n++;
            }
            if (board[c * BOARD_SIZE + c] === player) n--; // 交差点は二重計上を戻す
            return n * (P('fence_pts') ?? 2);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + fenceBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + fenceBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>垣根:</span> <strong>黒 \${fenceBonus(1)} / 白 \${fenceBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 垣根ラインの描画: 中央十字に竹垣風の淡い線
        K.CUE_GRID(`            // 垣根ライン: 中央十字に淡い竹垣の罫線
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                const cc = padding + c * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(120,90,40,0.30)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.28, cellSize * 0.16]);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize * 0.5, cc); ctx.lineTo(w - padding + cellSize * 0.5, cc);
                ctx.moveTo(cc, padding - cellSize * 0.5); ctx.lineTo(cc, w - padding + cellSize * 0.5);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'垣根 黒' + (fenceBonus(1) / Math.max(1, P('fence_pts') || 2)) + '/白' + (fenceBonus(2) / Math.max(1, P('fence_pts') || 2))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            垣根碁: 中央十字は垣根ライン。その上に立てた石は垣根として終局時に1つ+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '中央の行と列 (盤を四分割する十字) は「垣根ライン」。その上の自分の石は垣根となり1つ+2目。',
            '垣根で区切られた別天地を作るか、垣根をまたいで敵庭へ攻め込むか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: 0 }] }, 1); // 縦垣根の上端
        executeMove({ cells: [{ x: 0, y: c }] }, 1); // 横垣根の左端
        assert('垣根ボーナス+4', fenceBonus(1) === 4);
        executeMove({ cells: [{ x: c, y: c }] }, 1); // 中央交差点 — 二重計上されない
        assert('中央は+2のみ', fenceBonus(1) === 6);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
