// MANDALAGO — 曼荼羅碁: 中心+四方の十字配置が完成すると宇宙が完成 — 終局時+3目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mandalago.html',
    en: 'MANDALAGO',
    jp: '曼荼羅碁',
    prefix: 'mandalago',
    desc: '中心+四方の同色十字は完成した曼荼羅 — 1つにつき終局時+3目。',
    kind: 'stone',
    icon: 'mandalago',
    spec: [
        ...K.rb('MANDALAGO', '曼荼羅碁', 'mandalago'),
        K.params([
            { key: 'mandala_pts', label: '曼荼羅の得点', min: 0, max: 9, def: 3, hint: '完成した十字1つにつき終局加点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 曼荼羅: 中心と四方が同色の十字は完成した宇宙 — 1つ+3目
        function mandalaBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const nb = getNeighbors(i);
                if (nb.length === 4 && nb.every(n => board[n] === player)) b += (P('mandala_pts') ?? 3);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + mandalaBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + mandalaBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>完成した曼荼羅:</span> <strong>黒 \${mandalaBonus(1)} / 白 \${mandalaBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 完成した曼荼羅: 十字の中心に法輪
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const nb = getNeighbors(i);
                    if (nb.length === 4 && nb.every(n => board[n] === board[i])) {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.strokeStyle = 'rgba(251,191,36,0.95)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            曼荼羅碁: 中心+四方の同色十字は完成した曼荼羅 — 終局時+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '曼荼羅: 終局時、中心と四方が同色の十字配置は完成した宇宙として+3目。',
            '盤端では十字を組めない — 中央での構築が尊い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; // 十字
        assert('中心+四方の十字は曼荼羅+3', mandalaBonus(1) === 3);
        board[2 * BOARD_SIZE + 4] = 2; // 十字の上の石は未完成のまま
        assert('白の曼荼羅はまだ0', mandalaBonus(2) === 0);
        board[9 * BOARD_SIZE + 9] = 2;
        board[8 * BOARD_SIZE + 9] = 2; board[10 * BOARD_SIZE + 9] = 2;
        board[9 * BOARD_SIZE + 8] = 2; board[9 * BOARD_SIZE + 10] = 2;
        assert('白も十字を組めば+3', mandalaBonus(2) === 3);
    `,
};
