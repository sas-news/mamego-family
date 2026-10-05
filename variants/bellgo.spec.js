// BELLGO — 釣鐘碁: 盤は釣鐘型 (上が窄まる)。石は斜面を転がり裾へ滑る
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'bellgo.html',
    en: 'BELLGO',
    jp: '釣鐘碁',
    prefix: 'bellgo',
    desc: '釣鐘型の盤。石は斜面を転がり、鐘の縁か他の石に当たるまで滑る。',
    kind: 'stone',
    icon: 'bellgo',
    spec: [
        ...K.rb('BELLGO', '釣鐘碁', 'bellgo'),
        K.params([
            { key: 'bell_slope', label: '鐘肩の傾斜', min: 0.5, max: 2, def: 1, step: 0.25, hint: '大きいほど上部が広い' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 1.8, def: 0.9, step: 0.1, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 釣鐘: 上半は窄まった鐘肩、下半は全幅の裾
        const BELL_MID = Math.floor(BOARD_SIZE / 2);
        function inBell(x, y) { return Math.abs(x - BELL_MID) <= Math.min(y * (P('bell_slope') || 1), BELL_MID); }
        // 斜面を滑る: 釣鐘の中で外側へ、縁か石に当たるまで転がる
        function bellSlide(x, y) {
            let dir = x > BELL_MID ? 1 : (x < BELL_MID ? -1 : 0);
            if (dir === 0) return { x, y }; // 鐘の頂では滑らない
            let sx = x;
            while (inBell(sx + dir, y) && board[y * BOARD_SIZE + sx + dir] === 0) sx += dir;
            return { x: sx, y };
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!inBell(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 着手は滑り止め位置に解決される
        [K.ONE, K.VALID_BOUNDS, `            {
                const p0 = cells[0];
                if (p0.x < 0 || p0.x >= BOARD_SIZE || p0.y < 0 || p0.y >= BOARD_SIZE) return false;
                if (board[p0.y * BOARD_SIZE + p0.x] !== 0) return false;
                cells = [bellSlide(p0.x, p0.y)];
            }`],
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            {
                const p0 = move.cells[0];
                const to = bellSlide(p0.x, p0.y);
                if (to.x !== p0.x) fxSlide(p0.y * BOARD_SIZE + p0.x, to.y * BOARD_SIZE + to.x, 380);
                move.cells = [to];
            }
            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`],
        // 釣鐘の外は暗い鋳鉄面
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CAVE)],
        ...K.WALL_GUARD_SPEC,
        K.CUE_GRID(`            // 釣鐘: 頂の鐘乳と肩の稜線
            {
                ctx.save();
                const cx0 = padding + BELL_MID * cellSize;
                const cy0 = padding;
                ctx.strokeStyle = 'rgba(120, 90, 40, 0.55)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx0, cy0 + cellSize * 0.55, cellSize * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            釣鐘碁: 釣鐘型の盤。石は斜面を滑って鐘の縁に転がり落ちる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は上が窄まった釣鐘型 (鐘の外は壁)。',
            '置いた石は斜面を転がる — 外側へ、鐘の縁か他の石に当たるまで滑る。',
            '頂 (真ん中) に置いた石だけ滑らない。裾に集まる石の取り合いが激しい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('鐘の外は壁', board[I(0, 0)] === 3);
        assert('頂には置ける', board[I(mid, 0)] !== 3);
        executeMove({ cells: [{ x: mid + 2, y: mid }] }, 1);
        const landed = [];
        for (let i = 0; i < board.length; i++) if (board[i] === 1) landed.push(i);
        assert('石は外側へ滑る', landed.length === 1 && landed[0] % BOARD_SIZE > mid + 2);
        board.fill(0); pieces = []; history.length = 0;
        executeMove({ cells: [{ x: mid, y: mid }] }, 1);
        assert('頂の石は滑らない', board[I(mid, mid)] === 1);
    `,
};
