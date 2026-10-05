// SUKIGO — 数奇碁: 数寄屋 (隅の庭園区域) に置いた孤石 (同色と隣接しない石) は終局時+2目
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sukigo.html',
    en: 'SUKIGO',
    jp: '数奇碁',
    prefix: 'sukigo',
    desc: '数寄屋の庭 (二隅の区域) に孤石を置けば風流点+2目。',
    kind: 'stone',
    icon: 'sukigo',
    spec: [
        ...K.rb('SUKIGO', '数奇碁', 'sukigo'),
        K.params([
            { key: 'suki_pts', label: '孤石の風流点', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'garden_size', label: '庭の一辺のサイズ', min: 2, max: 6, def: 4, unit: 'マス' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 数寄屋の庭: 左上隅と右下隅の区域
        const SUKI_C = 1;
        let SUKI_SET = new Set();
        function rebuildSuki() {
            const n = P('garden_size') || 4;
            const s = new Set();
            for (let dy = 0; dy < n; dy++)
                for (let dx = 0; dx < n; dx++) {
                    s.add((SUKI_C + dy) * BOARD_SIZE + (SUKI_C + dx));
                    s.add((BOARD_SIZE - 1 - SUKI_C - n + dy + 1) * BOARD_SIZE + (BOARD_SIZE - 1 - SUKI_C - n + dx + 1));
                }
            SUKI_SET = s;
        }
        rebuildSuki();
        function onVariantParam(p) { if (p.key === 'garden_size') rebuildSuki(); }`],
        // 風流点: 庭にいて同色と隣接しない石は+2目
        [K.ONE, `        function endGameByScore() {`, `        // 風流点: 庭にいる孤石 (同色の隣接なし) を数える
        function sukiBonus() {
            const b = { 1: 0, 2: 0 };
            for (const i of SUKI_SET) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const lonely = !getNeighbors(i).some(n => board[n] === v);
                if (lonely) b[v] += (P('suki_pts') ?? 2);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 数奇ルール: 庭の孤石は+2目
            {
                const sb = sukiBonus();
                territory.black += sb[1];
                territory.white += sb[2];
            }`],
        // 庭の描画: 枯山水の縁取り
        K.CUE_GRID(`            // 数寄屋の庭: 枯山水の縁取り
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.55);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.15]);
                const edge = (x0, y0) => ctx.strokeRect(
                    padding + x0 * cellSize - cellSize * 0.5,
                    padding + y0 * cellSize - cellSize * 0.5,
                    cellSize * (P('garden_size') || 4), cellSize * (P('garden_size') || 4));
                edge(SUKI_C, SUKI_C);
                edge(BOARD_SIZE - 2 - SUKI_C, BOARD_SIZE - 2 - SUKI_C);
                ctx.restore();
            }`),
        // 孤石に竹印
        ...K.STONE_MARKS_SPEC(`            // 庭の孤石: 竹の小印
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.lineCap = 'round';
                for (const i of SUKI_SET) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (getNeighbors(i).some(n => board[n] === v)) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const r = cellSize * 0.16;
                    ctx.beginPath();
                    ctx.moveTo(cx - r * 0.5, cy + r * 0.6);
                    ctx.lineTo(cx + r * 0.4, cy - r * 0.8);
                    ctx.moveTo(cx + r * 0.1, cy + r * 0.6);
                    ctx.lineTo(cx + r * 0.7, cy - r * 0.3);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'風流点 ' + (() => { const b = typeof sukiBonus === 'function' ? sukiBonus() : { 1: 0, 2: 0 }; return '黒' + b[1] + ' 白' + b[2]; })()`),
        [K.ONE, K.INFO_BASE, `            数奇碁: 二隅の庭に置いた孤石 (同色と隣接しない石) は終局時+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '左上と右下の4x4が「数寄屋の庭」。庭にいる石が同色と隣接していなければ風流点+2目。',
            '庭に孤石を置くか、敵の孤石に同色を添えて風流点を消すか。双方同じ庭を持つ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        const gx = 1, gy = 1; // 庭の一点 (左上4x4)
        assert('庭に含まれる', SUKI_SET.has(I(gx, gy)));
        board[I(gx, gy)] = 1;
        assert('庭の孤石は+2目', sukiBonus()[1] === 2);
        board[I(gx + 1, gy)] = 1; // 同色が隣接
        assert('隣接すれば風流点なし', sukiBonus()[1] === 0);
        board[I(gx + 1, gy)] = 2; // 敵色なら孤石のまま
        assert('敵色の隣接は風流点を消さない', sukiBonus()[1] === 2);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
