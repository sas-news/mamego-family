// ZASHIKIGO — 座敷碁: 座敷の上座(上段帯)ほど席次が高い。帯ごとに席次点が変わる
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
    file: 'zashikigo.html',
    en: 'ZASHIKIGO',
    jp: '座敷碁',
    prefix: 'zashikigo',
    desc: '上段の席ほど席次が高い座敷。上座+3目、中座+1目、下座はそのまま。',
    kind: 'stone',
    icon: 'zashikigo',
    spec: [
        ...K.rb('ZASHIKIGO', '座敷碁', 'zashikigo'),
        K.params([
            { key: 'top_pts', label: '上座の点', min: 0, max: 9, def: 3, unit: '目' },
            { key: 'mid_pts', label: '中座の点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 席次ボーナス: 上1/3帯+3、中1/3帯+1、下帯0
        [K.ONE, `        function endGameByScore() {`,
`        function seatBonus(player) {
            const t = Math.floor(BOARD_SIZE / 3);
            let bonus = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== player) continue;
                if (y < t) bonus += (P('top_pts') ?? 3);
                else if (y < t * 2) bonus += (P('mid_pts') ?? 1);
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + seatBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + seatBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>席次:</span> <strong>黒 \${seatBonus(1)} / 白 \${seatBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 座敷帯の描画: 三段の畳グラデーション
        K.CUE_GRID(`            // 座敷: 三段の席次帯 (上座ほど濃い畳色)
            {
                const t = Math.floor(BOARD_SIZE / 3);
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                const y0 = padding - cellSize / 2, y1 = padding + t * cellSize - cellSize / 2;
                const y2 = padding + t * 2 * cellSize - cellSize / 2, y3 = w - padding + cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(160,140,60,0.16)'; ctx.fillRect(padding - cellSize / 2, y0, w - padding * 2 + cellSize, y1 - y0);
                ctx.fillStyle = 'rgba(160,140,60,0.08)'; ctx.fillRect(padding - cellSize / 2, y1, w - padding * 2 + cellSize, y2 - y1);
                ctx.fillStyle = 'rgba(160,140,60,0.03)'; ctx.fillRect(padding - cellSize / 2, y2, w - padding * 2 + cellSize, y3 - y2);
                ctx.strokeStyle = 'rgba(120,100,40,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding - cellSize / 2, y1); ctx.lineTo(w - padding + cellSize / 2, y1);
                ctx.moveTo(padding - cellSize / 2, y2); ctx.lineTo(w - padding + cellSize / 2, y2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'席次 黒' + seatBonus(1) + '/白' + seatBonus(2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            座敷碁: 上座(上1/3帯)+3、中座(中帯)+1、下座(下帯)は加点なしの席次点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '座敷の上座ほど席次が高い。終局時、上1/3帯の自石は+3目、中帯は+1目、下帯は加点なし。',
            '同じ帯を両者が使う対称ルール — 上座を取り合う席次争い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const t = Math.floor(BOARD_SIZE / 3);
        board[0 * BOARD_SIZE + 0] = 1;                       // 上座
        board[t * BOARD_SIZE + 5] = 1;                       // 中座上端
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 8] = 1;        // 下座
        assert('席次は3+1+0=4', seatBonus(1) === 4);
        board[0 * BOARD_SIZE + 5] = 2;                       // 白も上座
        assert('白も対称に+3', seatBonus(2) === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
