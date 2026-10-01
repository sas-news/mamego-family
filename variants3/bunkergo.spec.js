// BUNKERGO — 地下壕碁: 盤中央に地下壕。壕内の石は外から攻められず、壕からも攻められない
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'bunkergo.html',
    en: 'BUNKERGO',
    jp: '地下壕碁',
    prefix: 'bunkergo',
    desc: '中央に屋根付きの地下壕。壕内の石は取られないが、壕からも攻められない。',
    kind: 'stone',
    icon: 'bunkergo',
    spec: [
        ...K.rb('BUNKERGO', '地下壕碁', 'bunkergo'),
        K.params([
            { key: 'bunker_r', label: '壕の半径', min: 2, max: 4, def: 2, hint: '内部はこの値-1の正方形' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 地下壕: 中央5x5の壕。周壁は石垣、内部は天井で護られた空間、2箇所の出入口
        const BUNK_C = Math.floor(BOARD_SIZE / 2);
        const BUNK_SET = new Set(); // 壕内部
        const BUNK_DOORS = new Set();
        // 半径は設定で調整可能。変更は即時再構成される
        function rebuildBunker() {
            const R = Math.max(2, P('bunker_r') || 2);
            BUNK_SET.clear(); BUNK_DOORS.clear();
            for (let y = BUNK_C - (R - 1); y <= BUNK_C + (R - 1); y++)
                for (let x = BUNK_C - (R - 1); x <= BUNK_C + (R - 1); x++) BUNK_SET.add(y * BOARD_SIZE + x);
            [BUNK_C - R, BUNK_C + R].forEach(v => { BUNK_DOORS.add(v * BOARD_SIZE + BUNK_C); BUNK_DOORS.add(BUNK_C * BOARD_SIZE + v); });
        }
        rebuildBunker();
        function onVariantParam(p) { if (p.key === 'bunker_r') rebuildBunker(); }
        function isBunkWall(x, y) {
            const R = Math.max(2, P('bunker_r') || 2);
            const inRing = Math.abs(x - BUNK_C) === R || Math.abs(y - BUNK_C) === R;
            const inside = Math.abs(x - BUNK_C) <= R && Math.abs(y - BUNK_C) <= R;
            return inside && inRing && !BUNK_DOORS.has(y * BOARD_SIZE + x);
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (isBunkWall(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 壕内の石は天井で護られて取られない (捕獲走査から除外 → 連もそこで切れる)
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && !BUNK_SET.has(i)) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && !BUNK_SET.has(n)) {`],
        // 壕から外は攻められない: 壕内への着手では捕獲が起きない
        [K.ONE, K.CAPTURE_BLOCK, `            const inBunker = move.cells.some(p => BUNK_SET.has(p.y * BOARD_SIZE + p.x));
            const captured = inBunker ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 壕の描画: 石壁と暗い内部
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_BRICK('#57534e', '#292524'))],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 地下壕: 内部の暗がりと出入口の明かり
            {
                ctx.save();
                BUNK_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(10, 14, 26, 0.5)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                BUNK_DOORS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            地下壕碁: 中央に地下壕。壕内の石は取られないが、壕からも攻められない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に屋根付きの地下壕 (3x3、出入口4箇所) がある。',
            '壕の中の石は外から全く見えず攻められない — 絶対に取られない避難所。',
            'ただし壕の中からは外の敵を取れない (天井が視界を遮る)。避難か戦場か。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('壕内部は9マス', BUNK_SET.size === 9 && board[I(c, c)] === 0);
        assert('壕の周壁は石垣', board[I(c - 2, c - 2)] === 3);
        assert('出入口は通行可', isValidPlacement([{ x: c, y: c - 2 }], 1) === true);
        // 壕内の石は囲まれても取られない
        board.fill(0);
        board[I(c, c)] = 1;
        getNeighbors(I(c, c)).forEach(n => { if (board[n] !== 3) board[n] = 2; });
        assert('壕内の石は取られない', !getCapturedStones(board, 1).includes(I(c, c)));
    `,
};
