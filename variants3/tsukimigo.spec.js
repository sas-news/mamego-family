// TSUKIMIGO — 月見碁: 盤中央の月を囲む8座に月見団子(石)を供えると採点で+1ずつ
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tsukimigo.html',
    en: 'TSUKIMIGO',
    jp: '月見碁',
    prefix: 'tsukimigo',
    desc: '天元は月。月を囲む8座に団子(石)を供えておくと終局時に+1ずつ。',
    kind: 'stone',
    icon: 'tsukimigo',
    spec: [
        ...K.rb('TSUKIMIGO', '月見碁', 'tsukimigo'),
        // 月を天元に置く (中立障害 board=4)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            // 天元に月を置く (中立: 置けず呼吸も通らない)
            { const c = Math.floor(BOARD_SIZE / 2); board[c * BOARD_SIZE + c] = 4; }`],
        // 団子判定ヘルパー: 月を囲む8座の自石を数える
        [K.ONE, `        function endGameByScore() {`, `        // 月見の判定: 月(天元)を囲む8座に供えた石を数える
        function tsukiRing() {
            const c = Math.floor(BOARD_SIZE / 2);
            const cells = [];
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const x = c + dx, y = c + dy;
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) cells.push(y * BOARD_SIZE + x);
            }
            return cells;
        }
        function tsukiBonus(pl) {
            let n = 0;
            tsukiRing().forEach(i => { if (board[i] === pl) n++; });
            return n;
        }

        function endGameByScore() {`],
        // 採点に月見点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + tsukiBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + tsukiBonus(2);`],
        // 月と供え台を描く
        K.CUE_GRID(`            // 月見: 天元の月と供え座の印
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                const now = fxNow();
                ctx.save();
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.85);
                g.addColorStop(0, 'rgba(254,240,138,0.5)');
                g.addColorStop(1, 'rgba(254,240,138,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.85, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef9c3';
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                // 供え座の点
                ctx.strokeStyle = 'rgba(202,138,4,' + (0.35 + 0.15 * Math.sin(now / 700)) + ')';
                tsukiRing().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.12, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            月見碁: 天元は月 (中立)。月を囲む8座に団子(石)を供えておくと終局時に+1ずつ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元には月が浮かぶ (中立の障害。置けない・取れない)。',
            '月を囲む8座に自分の石(月見団子)を供えておくと、終局時に1つにつき+1点。',
            '座は8つだけ。相手に先に供えられた座は奪うしかない。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[c * B + c] = 4;
        assert('月の上には置けない', isValidPlacement([{ x: c, y: c }], 1) === false);
        assert('8座ある', tsukiRing().length === 8);
        assert('初期は供えなし', tsukiBonus(1) === 0);
        board[(c - 1) * B + c] = 1; board[c * B + (c - 1)] = 1; board[c * B + (c + 1)] = 2;
        assert('供えた団子は+1ずつ', tsukiBonus(1) === 2 && tsukiBonus(2) === 1);
    `,
};
