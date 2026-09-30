// SENYAKUGO — 煎薬碁: 孤立した一石(生薬)を煎じると薬効点が出る。単石ごとに+3目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'senyakugo.html',
    en: 'SENYAKUGO',
    jp: '煎薬碁',
    prefix: 'senyakugo',
    desc: '味方の石と繋がらない単石は「生薬」。煎じるほど薬効が出て、単石ごとに+3目。',
    kind: 'stone',
    icon: 'senyakugo',
    spec: [
        ...K.rb('SENYAKUGO', '煎薬碁', 'senyakugo'),
        // 煎薬ボーナス: 同色の隣を持たない単石ごとに+3
        [K.ONE, `        function endGameByScore() {`,
`        function senyakuBonus(player) {
            let bonus = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                if (!getNeighbors(i).some(n => board[n] === player)) bonus += 3;
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + senyakuBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + senyakuBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>薬効:</span> <strong>黒 \${senyakuBonus(1)} / 白 \${senyakuBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 生薬の描画: 単石の上に小さな葉印
        ...K.STONE_MARKS_SPEC(`            {
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) ||
                        getNeighbors(i).some(n => board[n] === v)) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(34,160,80,0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.12, cy - cellSize * 0.18);
                    ctx.quadraticCurveTo(cx, cy - cellSize * 0.34, cx + cellSize * 0.12, cy - cellSize * 0.18);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'薬効 黒' + senyakuBonus(1) + '/白' + senyakuBonus(2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            煎薬碁: 同色に隣接しない単石は「生薬」。単石ごとに終局時+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同じ色の石と隣接していない「単石」は生薬。終局時に煎じられて1つ+3目。',
            '連を組めば強いが薬効は出ない — ばらまくか固めるか、薬と石のさじ加減。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[0] = 1;                                     // 単石
        board[5 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 6] = 1;                    // 連結した2石
        assert('単石のみ+3', senyakuBonus(1) === 3);
        board[9 * BOARD_SIZE + 2] = 2;                    // 白の単石2つ
        board[9 * BOARD_SIZE + 9] = 2;
        assert('白も対称+6', senyakuBonus(2) === 6);
        assert('起動して通常着手可', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
    `,
};
