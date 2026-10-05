// BALLTOSSGO — 玉入碁: 星点の周囲3x3が「籠」。終局時に籠内の石が多い側がその籠を制し+2点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'balltossgo.html',
    en: 'BALLTOSSGO',
    jp: '玉入碁',
    prefix: 'balltossgo',
    desc: '星点の3x3区域が「籠」。終局時に籠内の石が多い側が籠ごとに+2点。',
    kind: 'stone',
    icon: 'balltossgo',
    spec: [
        ...K.rb('BALLTOSSGO', '玉入碁', 'balltossgo'),
        K.params([
            { key: 'basket_pts', label: '籠の得点', min: 1, max: 8, def: 2, unit: '点' },
            { key: 'basket_radius', label: '籠の半径', min: 1, max: 3, def: 1, hint: '星点からの距離' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 籠得点: 各星点の周囲3x3内で石が多い側に+2
        [K.ONE, `        function endGameByScore() {`, `
        function ballZones() {
            const pts = getStarPoints(BOARD_SIZE).length ? getStarPoints(BOARD_SIZE)
                : [{x: 2, y: 2}, {x: 6, y: 2}, {x: 4, y: 4}, {x: 2, y: 6}, {x: 6, y: 6}];
            return pts.map(s => {
                const cells = [];
                const br = Math.max(1, P('basket_radius') || 1);
                for (let dy = -br; dy <= br; dy++) for (let dx = -br; dx <= br; dx++) {
                    const x = s.x + dx, y = s.y + dy;
                    if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) cells.push(y * BOARD_SIZE + x);
                }
                return cells;
            });
        }
        function basketBonus(player) {
            let bonus = 0;
            ballZones().forEach(cells => {
                let mine = 0, theirs = 0;
                cells.forEach(i => {
                    if (board[i] === player) mine++;
                    else if (board[i] === (player === 1 ? 2 : 1)) theirs++;
                });
                if (mine > theirs) bonus += (P('basket_pts') || 2);
            });
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + basketBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + basketBonus(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の籠:</span> <strong>+\${basketBonus(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の籠:</span> <strong>+\${basketBonus(2)}</strong></div>`],
        // 籠区域を丸い輪で描く
        K.CUE_STARS(`            // 籠: 星点を中心とした3x3の輪
            {
                ctx.save();
                ballZones().forEach(cells => {
                    let sx = 0, sy = 0;
                    cells.forEach(i => { sx += i % BOARD_SIZE; sy += Math.floor(i / BOARD_SIZE); });
                    const cx = padding + (sx / cells.length) * cellSize;
                    const cy = padding + (sy / cells.length) * cellSize;
                    ctx.strokeStyle = 'rgba(220,38,38,0.45)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.setLineDash([cellSize * 0.18, cellSize * 0.12]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * ((P('basket_radius') || 1) + 0.45), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'籠: 星の3x3を多く占めよ'`),
        [K.ONE, K.INFO_BASE, `            玉入碁: 星点の3x3区域が「籠」。終局時に籠内の石が多い側が籠ごとに+2点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各星点を中心とする3x3区域が「籠」。玉=石を籠に入れ合う。',
            '終局時、籠の中で石が多い側がその籠を制して+2点ずつ。',
            '籠の取り合いは両者対称。地取りと並行して玉を投げ込もう。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('籠の数は星の数', ballZones().length === getStarPoints(BOARD_SIZE).length);
        assert('初期は0点', basketBonus(1) === 0 && basketBonus(2) === 0);
        // 黒が最初の星 (左上) の3x3を多く占める
        const star = getStarPoints(BOARD_SIZE)[0];
        board[I(star.x, star.y)] = 1; board[I(star.x - 1, star.y)] = 1; board[I(star.x, star.y - 1)] = 1;
        board[I(star.x + 1, star.y)] = 2;
        assert('多数派の籠で+2', basketBonus(1) === 2);
        assert('少数派は0', basketBonus(2) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }], 1) === true);
    `,
};
