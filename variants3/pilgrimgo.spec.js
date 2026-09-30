// PILGRIMGO — 巡礼碁: 5つの聖地 (星の点) のうち3つを同時に自石で占めると奉納達成で即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'pilgrimgo.html',
    en: 'PILGRIMGO',
    jp: '巡礼碁',
    prefix: 'pilgrimgo',
    desc: '5つの聖地のうち3ヶ所を同時に制すると奉納達成で即勝利。',
    kind: 'stone',
    icon: 'pilgrimgo',
    spec: [
        ...K.rb('PILGRIMGO', '巡礼碁', 'pilgrimgo'),
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 巡礼判定: 聖地 (星の点) を3箇所以上制すると奉納達成
            {
                const shrines = getStarPoints(BOARD_SIZE);
                const held = shrines.filter(pt => board[pt.y * BOARD_SIZE + pt.x] === player);
                if (held.length >= 3) {
                    held.forEach(pt => fxGlow(pt.y * BOARD_SIZE + pt.x, '#f87171', 900));
                    fxShake(6, 380);
                    winByRule(player, '奉納達成', '3つの聖地に石を奉納しました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 聖地に鳥居を描く
        K.CUE_STARS(`            // 聖地: 朱い鳥居
            {
                getStarPoints(BOARD_SIZE).forEach(pt => {
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(220,60,50,0.75)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.34, cy - cellSize * 0.30);
                    ctx.lineTo(cx + cellSize * 0.34, cy - cellSize * 0.30);
                    ctx.moveTo(cx - cellSize * 0.28, cy - cellSize * 0.16);
                    ctx.lineTo(cx + cellSize * 0.28, cy - cellSize * 0.16);
                    ctx.moveTo(cx - cellSize * 0.22, cy - cellSize * 0.30);
                    ctx.lineTo(cx - cellSize * 0.22, cy + cellSize * 0.30);
                    ctx.moveTo(cx + cellSize * 0.22, cy - cellSize * 0.30);
                    ctx.lineTo(cx + cellSize * 0.22, cy + cellSize * 0.30);
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const s = getStarPoints(BOARD_SIZE).filter(pt => board[pt.y * BOARD_SIZE + pt.x] === turn).length; return '聖地 ' + s + '/3'; })()`),
        [K.ONE, K.INFO_ALGO, `            巡礼碁: 5つの聖地 (星の点) のうち3つを同時に制すると奉納達成で即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の5つの聖地 (朱い鳥居の星の点) のうち3箇所を同時に自分の石で占めると奉納達成で即勝ち。',
            '聖地の石は普通に取られる — 巡礼路を守りながら地取り勝負も続く。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const shrines = getStarPoints(BOARD_SIZE);
        assert('聖地は5箇所', shrines.length === 5);
        shrines.slice(0, 3).forEach(pt => { board[pt.y * BOARD_SIZE + pt.x] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('3聖地制覇で即勝ち', gameOver === true && gameResultData && gameResultData.title.includes('奉納'));
        // 2箇所では勝たない
        board.fill(0); gameOver = false; gameResultData = null; turn = 1;
        shrines.slice(0, 2).forEach(pt => { board[pt.y * BOARD_SIZE + pt.x] = 1; });
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('2聖地では続行', gameOver === false);
    `,
};
