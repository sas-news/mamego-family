// SHIPPOGO — 七宝碁: 四方すべてを同色で満たした石は釉薬が彩られた七宝 — 終局時+0.5目
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
    file: 'shippogo.html',
    en: 'SHIPPOGO',
    jp: '七宝碁',
    prefix: 'shippogo',
    desc: '四方すべてを同色の石で囲んだ石は七宝に彩られる — 終局時+0.5目。',
    kind: 'stone',
    icon: 'shippogo',
    spec: [
        ...K.rb('SHIPPOGO', '七宝碁', 'shippogo'),
        [K.ONE, `        function endGameByScore() {`,
`        // 七宝: 全隣接点(盤端は2-3方向)が同色の石は釉薬が彩られた七宝 — 1個+0.5目
        function shippoBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const nb = getNeighbors(i);
                if (nb.length > 0 && nb.every(n => board[n] === player)) b += 0.5;
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + shippoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + shippoBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>七宝の彩り:</span> <strong>黒 \${shippoBonus(1)} / 白 \${shippoBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.STONE_MARKS_SPEC(`            // 七宝の石: 全方向同色の石に釉薬の光彩
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const nb = getNeighbors(i);
                    if (nb.length > 0 && nb.every(n => board[n] === board[i])) {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.strokeStyle = 'rgba(52,211,153,0.9)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.24, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            七宝碁: 四方すべてを同色で囲んだ石は七宝に彩られる — 終局時+0.5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '七宝焼: 終局時、隣接する全方向(盤端は2-3方向)が同色の石は釉薬の彩った七宝として+0.5目。',
            '連を固く結ぶほど彩りが増す。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; // 十字の中心+四方
        assert('四方を同色で囲んだ石は七宝', shippoBonus(1) === 0.5); // 十字の中心のみ条件を満たす
        board[9 * BOARD_SIZE + 9] = 2;
        assert('孤立石は七宝でない', shippoBonus(2) === 0);
    `,
};
