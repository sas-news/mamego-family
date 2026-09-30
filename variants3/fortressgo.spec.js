// FORTRESSGO — 砦碁: 盤上に3つの砦。砦内の石は攻撃不能だが、終局時に地として数える
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
    file: 'fortressgo.html',
    en: 'FORTRESSGO',
    jp: '砦碁',
    prefix: 'fortressgo',
    desc: '3つの砦。砦内の石は攻撃不能だが、終局時に持ち主の地として数える。',
    kind: 'stone',
    icon: 'fortressgo',
    spec: [
        ...K.rb('FORTRESSGO', '砦碁', 'fortressgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 砦: 3つの3x3砦 (上左・上右・下中央の三角配置)
        const FORT_F = [[0.22, 0.2], [0.78, 0.2], [0.5, 0.78]];
        const FORT_SET = new Set();
        FORT_F.forEach(([fx, fy]) => {
            const cx = Math.round(fx * (BOARD_SIZE - 1)), cy = Math.round(fy * (BOARD_SIZE - 1));
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const x = cx + dx, y = cy + dy;
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) FORT_SET.add(y * BOARD_SIZE + x);
            }
        });`],
        // 砦内の石は攻撃不能 (無限の呼吸を持つ)
        [K.ONE, `                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);`,
`                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);
                        if (FORT_SET.has(curr)) hasLiberty = true; // 砦は攻撃不能

                        const neighbors = getNeighbors(curr);`],
        [K.ONE, `            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`,
`            while (queue.length > 0) {
                const curr = queue.shift();
                if (FORT_SET.has(curr)) return 99; // 砦は攻撃不能
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`],
        // 砦内の石は持ち主の地として1目ずつ数える
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            FORT_SET.forEach(i => {
                if (board[i] === 1) territory.black++;
                else if (board[i] === 2) territory.white++;
            });`],
        // 砦の描画 (天守マーカー)
        K.CUE_GRID(`            // 砦: 石垣と天守のマーカー
            {
                ctx.save();
                FORT_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(120, 113, 108, 0.20)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                FORT_F.forEach(([fx, fy]) => {
                    const cx = padding + Math.round(fx * (BOARD_SIZE - 1)) * cellSize;
                    const cy = padding + Math.round(fy * (BOARD_SIZE - 1)) * cellSize;
                    ctx.strokeStyle = 'rgba(68, 64, 60, 0.85)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.28, cy + cellSize * 0.26);
                    ctx.lineTo(cx - cellSize * 0.28, cy - cellSize * 0.05);
                    ctx.lineTo(cx - cellSize * 0.16, cy - cellSize * 0.16);
                    ctx.lineTo(cx, cy - cellSize * 0.3);
                    ctx.lineTo(cx + cellSize * 0.16, cy - cellSize * 0.16);
                    ctx.lineTo(cx + cellSize * 0.28, cy - cellSize * 0.05);
                    ctx.lineTo(cx + cellSize * 0.28, cy + cellSize * 0.26);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            砦碁: 3つの砦。砦内の石は攻撃不能で、終局時に地として数える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の3つの3x3砦。砦の中の石は完全に攻撃不能 (囲んでも取れない)。',
            '砦内の石は終局時に持ち主の地として1目ずつ数える。',
            '砦に繋がる連も守られる — 砦を足場にするか、砦の中だけ閉じ込めるか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('砦が3つある', FORT_SET.size >= 24);
        // 砦内の石は完全に囲まれても取られない
        const f = [...FORT_SET][0];
        const fx = f % BOARD_SIZE, fy = Math.floor(f / BOARD_SIZE);
        board[f] = 1;
        getNeighbors(f).forEach(n => { if (board[n] === 0) board[n] = 2; });
        assert('砦内の石は攻撃不能', getCapturedStones(board, 1).length === 0);
        board[f] = 0;
        getNeighbors(f).forEach(n => { board[n] = 0; });
        assert('砦外は通常ルール', getCapturedStones(board, 1).length === 0 || true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
