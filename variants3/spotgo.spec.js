// SPOTGO — 勘所碁: 盤の星(勘どころ)に石を置くと終局時にその点ごと+2の直感ボーナス
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
const SPOT_FN = `        // 勘どころ: 盤の星の位置 (盤サイズから算出)
        function spotCells() {
            const m = BOARD_SIZE - 1;
            const lo = Math.round(m * 0.25), hi = Math.round(m * 0.75), c = Math.round(m * 0.5);
            return [[lo, lo], [hi, lo], [lo, hi], [hi, hi], [c, c]].map(([x, y]) => y * BOARD_SIZE + x);
        }
`;
module.exports = {
    file: 'spotgo.html',
    en: 'SPOTGO',
    jp: '勘所碁',
    prefix: 'spotgo',
    desc: '星の「勘どころ」に置いた石は終局時に+2の直感ボーナスになる。',
    kind: 'stone',
    icon: 'spotgo',
    spec: [
        ...K.rb('SPOTGO', '勘所碁', 'spotgo'),
        [K.ONE, '        function updateUI() {', SPOT_FN + `
        function updateUI() {`],
        // 終局時: 勘どころを占める石ごとに+2
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const spots = spotCells();
            const spotB = spots.filter(i => board[i] === 1).length * 2;
            const spotW = spots.filter(i => board[i] === 2).length * 2;
            const blackTotal = territory.black + captures[1] + spotB;
            const whiteTotal = territory.white + captures[2] + komi + spotW;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="mt-1 text-xs">勘所ボーナス: 黒+\${spotB} / 白+\${spotW}</div>`],
        ...K.STONE_MARKS_SPEC(`            // 勘どころ: 金色の星マーク
            {
                ctx.save();
                spotCells().forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(251,191,36,0.95)';
                    ctx.strokeStyle = 'rgba(146,64,14,0.7)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let k = 0; k < 10; k++) {
                        const r2 = k % 2 === 0 ? cellSize * 0.22 : cellSize * 0.09;
                        const a = -Math.PI / 2 + k * Math.PI / 5;
                        const sx = cx + Math.cos(a) * r2, sy = cy + Math.sin(a) * r2;
                        if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            勘所碁: 5つの星 (勘どころ) に石を置くと終局時にその点ごと+2のボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の5つの星は「勘どころ」。終局時にそこを占める石1つにつき+2点。',
            '地の大きさだけでなく、勘どころの争奪も勝敗を分ける。',
            '両者に同じ勘所・同じボーナス。着手・取り・コウ・パス終局は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const spots = spotCells();
        assert('勘所は5箇所', spots.length === 5);
        board[spots[0]] = 1;
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('勘所ボーナスが明記', gameResultData.details.includes('勘所ボーナス: 黒+2'));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
