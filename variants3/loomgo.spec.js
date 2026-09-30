// LOOMGO — 織物碁: 縦横両方に自石が伸びる「織り目」の石は終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'loomgo.html',
    en: 'LOOMGO',
    jp: '織物碁',
    prefix: 'loomgo',
    desc: '石は織糸。縦と横の両方向に自分の糸が通る織り目を作ると終局時+1目。',
    kind: 'stone',
    icon: 'loomgo',
    spec: [
        ...K.rb('LOOMGO', '織物碁', 'loomgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let loomDetail = { 1: 0, 2: 0 }; // 直近終局で計上した織り目の数`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 織物ルール: 縦・横の両方に自石が伸びる点は「織り目」として+1目
            loomDetail = { 1: 0, 2: 0 };
            for (let i = 0; i < board.length; i++) {
                const p = board[i];
                if (p !== 1 && p !== 2) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const hasH = (x > 0 && board[i - 1] === p) || (x < BOARD_SIZE - 1 && board[i + 1] === p);
                const hasV = (y > 0 && board[i - BOARD_SIZE] === p) || (y < BOARD_SIZE - 1 && board[i + BOARD_SIZE] === p);
                if (hasH && hasV) {
                    loomDetail[p]++;
                    if (p === 1) territory.black++; else territory.white++;
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 織り目: 十字の織り筋
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(217,70,239,0.6)';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const hasH = (x > 0 && board[i - 1] === v) || (x < BOARD_SIZE - 1 && board[i + 1] === v);
                    const hasV = (y > 0 && board[i - BOARD_SIZE] === v) || (y < BOARD_SIZE - 1 && board[i + BOARD_SIZE] === v);
                    if (!hasH || !hasV) return;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const s = cellSize * 0.20;
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
                    ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は織糸。1つの石に縦方向と横方向の両方の自分の糸が通っている点は「織り目」。',
            '織り目は終局時1つ+1目。経糸と緯糸を交差させて布を織れ — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1); // 横糸
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 縦糸
        endGameByScore();
        assert('織り目が計上される', loomDetail[1] === 1);
        assert('白には織り目なし', loomDetail[2] === 0);
        assert('終局する', gameOver === true);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
