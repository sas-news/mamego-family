// KOANGO — 公案碁: 2x2 の同色の枡は解けた公案 — 終局時1枡につき+2目の悟り点
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
    file: 'koango.html',
    en: 'KOANGO',
    jp: '公案碁',
    prefix: 'koango',
    desc: '2x2 を同色で満たすと公案が解ける — 終局時1枡につき+2目の悟り点。',
    kind: 'stone',
    icon: 'koango',
    spec: [
        ...K.rb('KOANGO', '公案碁', 'koango'),
        [K.ONE, `        function endGameByScore() {`,
`        // 公案: 同色の2x2の枡 (左上を基点に数える) は解けた公案 — 1枡+2目
        function koanBonus(player) {
            let b = 0;
            for (let y = 0; y < BOARD_SIZE - 1; y++) {
                for (let x = 0; x < BOARD_SIZE - 1; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] === player && board[i + 1] === player &&
                        board[i + BOARD_SIZE] === player && board[i + BOARD_SIZE + 1] === player) b += 2;
                }
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + koanBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + koanBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>悟り点:</span> <strong>黒 \${koanBonus(1)} / 白 \${koanBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 解けた公案: 2x2の中心に円相の輪
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(250,204,21,0.85)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                for (let y = 0; y < BOARD_SIZE - 1; y++) {
                    for (let x = 0; x < BOARD_SIZE - 1; x++) {
                        const i = y * BOARD_SIZE + x;
                        if (board[i] !== 1 && board[i] !== 2) continue;
                        if (board[i] === board[i + 1] && board[i] === board[i + BOARD_SIZE] && board[i] === board[i + BOARD_SIZE + 1]) {
                            const cx = padding + (x + 0.5) * cellSize;
                            const cy = padding + (y + 0.5) * cellSize;
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            公案碁: 2x2 を同色で満たすと公案が解ける — 終局時1枡につき+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '公案: 終局時、同色の石だけで満たされた2x2の枡は解けた公案として+2目 (左上の目で数え、重なれば重複計上)。',
            '連を塊に育てるほど悟りが深まる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 5] = 1; // 2x2
        assert('同色2x2は解けた公案+2', koanBonus(1) === 2);
        board[4 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 6] = 1; // 隣に延ばして2枡目
        assert('連なる2x2は2枡で+4', koanBonus(1) === 4);
        board[9 * BOARD_SIZE + 9] = 2;
        assert('白の公案は0', koanBonus(2) === 0);
    `,
};
