// VALLEYGO — 谷間碁: 盤は崖に挟まれた峡谷。谷底の石は呼吸が豊かだが両側から攻められる
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
    file: 'valleygo.html',
    en: 'VALLEYGO',
    jp: '谷間碁',
    prefix: 'valleygo',
    desc: '両側を崖に挟まれた峡谷の盤。谷底 (中央行) の石は1つ余分に呼吸する。',
    kind: 'stone',
    icon: 'valleygo',
    spec: [
        ...K.rb('VALLEYGO', '谷間碁', 'valleygo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 峡谷: 中央の帯が河床、上下は崖。谷底行の石は+1呼吸
        const VALLEY_MID = Math.floor(BOARD_SIZE / 2);
        const VALLEY_H = Math.max(2, Math.round(BOARD_SIZE * 0.19));
        const VALLEY_Y0 = VALLEY_MID - VALLEY_H, VALLEY_Y1 = VALLEY_MID + VALLEY_H;
        const FLOOR_SET = new Set();
        for (let x = 0; x < BOARD_SIZE; x++) FLOOR_SET.add(VALLEY_MID * BOARD_SIZE + x);`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (y < VALLEY_Y0 || y > VALLEY_Y1) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 谷底の石は岩清水で+1呼吸 (取り判定と呼吸表示の両方)
        [K.ONE, `                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            }`,
`                        if (FLOOR_SET.has(curr)) libScore++;
                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                libScore++;
                            }`],
        [K.ONE, `                    let hasLiberty = false;`,
`                    let libScore = 0;`],
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);`,
`                    if (libScore === 0) {
                        captured.push(...group);`],
        [K.ONE, `                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`,
`                if (FLOOR_SET.has(curr)) liberties++;
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;`],
        // 崖は岩肌
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CLIFF)],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 谷底の清流ライン
            {
                ctx.save();
                const yy = padding + VALLEY_MID * cellSize;
                ctx.strokeStyle = 'rgba(80, 160, 200, 0.6)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.08);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize / 2, yy);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.lineTo(padding + x * cellSize, yy + Math.sin(x * 1.3) * cellSize * 0.12);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            谷間碁: 崖に挟まれた峡谷の盤。谷底 (中央行) の石は1つ余分に呼吸する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は上下を断崖に挟まれた峡谷 — 崖の上には置けない。',
            '谷底 (中央行) の石は岩清水で+1呼吸 — 取るには通常より1手多く囲む。',
            '谷底は攻めあいの正面。両岸 (上段・下段) から同時に攻められる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('崖は壁', board[I(0, 0)] === 3 && board[I(0, BOARD_SIZE - 1)] === 3);
        assert('谷底は着手可', isValidPlacement([{ x: 4, y: mid }], 1) === true);
        // 谷底の石1個は呼吸5 (4方向+清水)
        board[I(5, mid)] = 1;
        assert('谷底の石は+1呼吸', getLiberties(board, I(5, mid)) === 5);
        board.fill(0);
        // 斜面上の石は通常
        board[I(5, mid - 1)] = 1;
        assert('斜面の石は通常呼吸', getLiberties(board, I(5, mid - 1)) === 4);
    `,
};
