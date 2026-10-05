// TOUJIGO — 湯治碁: 湯治場(温泉区域)に石を浸けると傷が癒え、浸かった石は+2目
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
    file: 'toujigo.html',
    en: 'TOUJIGO',
    jp: '湯治碁',
    prefix: 'toujigo',
    desc: '上段の湯治場(温泉区域)に石を浸けると傷が癒え、浸かった石は終局時に+2目。',
    kind: 'stone',
    icon: 'toujigo',
    spec: [
        ...K.rb('TOUJIGO', '湯治碁', 'toujigo'),
        K.params([
            { key: 'bonus', label: '浸かった石1つあたりの得点', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'heal', label: '湯治で回復するアゲハマ', min: 0, max: 3, def: 1, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        // 湯治ボーナス: 湯治区域(行1-3 x 中央3列)の自石ごとに+2
        [K.ONE, `        function endGameByScore() {`,
`        function onsenCells() {
            const c = Math.floor(BOARD_SIZE / 2);
            const cells = [];
            for (let y = 1; y <= 3; y++) for (let dx = -1; dx <= 1; dx++)
                cells.push(y * BOARD_SIZE + c + dx);
            return cells;
        }
        function onsenBonus(player) {
            return onsenCells().filter(i => board[i] === player).length * (P('bonus') ?? 2);
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + onsenBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + onsenBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>湯治:</span> <strong>黒 \${onsenBonus(1)} / 白 \${onsenBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 湯治: 浸けると傷が癒えてアゲハマ1つ回復
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 湯治ルール: 湯治区域に浸けると傷が癒えて相手のアゲハマを1つ洗い流す
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (onsenCells().includes(mi)) {
                    if (captures[opponent] > 0) {
                        captures[opponent] -= (P('heal') ?? 1);
                        fxText(mi, '湯治 +1回復', '#38bdf8', 1200);
                    }
                    fxGlow(mi, '#67e8f9', 700);
                }
            }

            turn = opponent;`],
        // 湯治場の描画: 上段に湯けむりの池
        K.CUE_STARS(`            // 湯治区域: 上段中央の温泉 (薄い湯色と湯けむり)
            {
                const c0 = Math.floor(BOARD_SIZE / 2);
                const x0 = padding + (c0 - 1) * cellSize - cellSize / 2;
                const y0 = padding + 1 * cellSize - cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(80,160,200,0.20)';
                ctx.fillRect(x0, y0, cellSize * 3, cellSize * 3);
                ctx.strokeStyle = 'rgba(60,130,180,0.55)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.strokeRect(x0, y0, cellSize * 3, cellSize * 3);
                // 湯けむりの曲線
                ctx.strokeStyle = 'rgba(200,230,245,0.7)';
                ctx.lineWidth = Math.max(1.1, cellSize * 0.04);
                for (let s = 0; s < 3; s++) {
                    const sx = x0 + cellSize * (0.6 + s * 0.9);
                    ctx.beginPath();
                    ctx.moveTo(sx, y0 + cellSize * 2.7);
                    ctx.quadraticCurveTo(sx + cellSize * 0.15, y0 + cellSize * 2.2, sx, y0 + cellSize * 1.8);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'湯治 黒' + (onsenBonus(1) / (P('bonus') ?? 2)) + '/白' + (onsenBonus(2) / (P('bonus') ?? 2))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            湯治碁: 上段の湯治場に石を浸けるとアゲハマ1つ回復、浸かった石は終局時+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '上段中央3x3は「湯治場(温泉)」。石を浸けるごとに傷が癒え、相手のアゲハマが1つ帳消し。',
            '終局時、湯に浸かったままの石は1つ+2目 — 浸かり続けるか、切り上げて戦うか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 2 };
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: 2 }] }, 1);
        assert('湯治で傷が癒える', captures[2] === 1);
        assert('湯治ボーナス+2', onsenBonus(1) === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('湯でない手は癒さない', captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
