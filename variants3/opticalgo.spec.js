// OPTICALGO — 錯視碁: 幾何学錯視の盤。見た目は歪むが着手の効果は盤論理そのまま
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
    file: 'opticalgo.html',
    en: 'OPTICALGO',
    jp: '錯視碁',
    prefix: 'opticalgo',
    desc: '幾何学錯視の盤。中央が拡大して見える視覚効果に惑わされる碁。',
    kind: 'stone',
    icon: 'opticalgo',
    spec: [
        ...K.rb('OPTICALGO', '錯視碁', 'opticalgo'),
        // 錯視の盤: グリッドに放射状の収束線と同心円を重ねて描き、距離感を狂わせる
        K.CUE_GRID(`            // 錯視: 中央からの放射線と同心円 (エビングハウス風)
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const cx = padding + cc * cellSize, cy = padding + cc * cellSize;
                const w = (BOARD_SIZE - 1) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(120,120,140,0.25)';
                ctx.lineWidth = Math.max(0.8, cellSize * 0.03);
                for (let a = 0; a < 12; a++) {
                    const ang = a * Math.PI / 6;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(ang) * cellSize * 0.7, cy + Math.sin(ang) * cellSize * 0.7);
                    ctx.lineTo(cx + Math.cos(ang) * w * 0.6, cy + Math.sin(ang) * w * 0.6);
                    ctx.stroke();
                }
                for (let r = 1; r <= 4; r++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * r * 1.3, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'錯視盤: 距離感に注意'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            錯視碁: 幾何学錯視の盤。放射線と同心円が距離感を狂わせるがルールは通常の碁<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤面には放射状の収束線と同心円が描かれ、点間の距離が実際より歪んで見える。',
            'ルールは通常の碁と同一 — 錯視に惑わされず正確な読みが要求される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('着手は通常通り可能', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        const B = BOARD_SIZE;
        board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('取りも通常通り', board[4 * B + 4] === 0 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
