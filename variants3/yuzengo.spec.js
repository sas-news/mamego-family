// YUZENGO — 友禅碁: 同色で3連以上の縦・横・斜めの「絵羽模様」を描くと終局時に+2目/模様
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
    file: 'yuzengo.html',
    en: 'YUZENGO',
    jp: '友禅碁',
    prefix: 'yuzengo',
    desc: '同色3連以上の直線は絵羽模様。終局時に模様1本につき+2目。',
    kind: 'stone',
    icon: 'yuzengo',
    spec: [
        ...K.rb('YUZENGO', '友禅碁', 'yuzengo'),
        K.params([
            { key: 'motif_pts', label: '模様1本の点', min: 0, max: 9, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let yuzenDone = false;
        // 絵羽模様: 同色で3連以上の縦・横・斜め直線の数
        function motifCount(pl) {
            let n = 0;
            const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                for (const [dx, dy] of dirs) {
                    const i0 = y * BOARD_SIZE + x;
                    const i1 = (y + dy) * BOARD_SIZE + x + dx;
                    const i2 = (y + dy * 2) * BOARD_SIZE + x + dx * 2;
                    if (x + dx * 2 < 0 || x + dx * 2 >= BOARD_SIZE || y + dy * 2 < 0 || y + dy * 2 >= BOARD_SIZE) continue;
                    if (board[i0] === pl && board[i1] === pl && board[i2] === pl) {
                        const px = x - dx, py = y - dy; // 連の起点のみ数える
                        if (px < 0 || px >= BOARD_SIZE || py < 0 || py >= BOARD_SIZE || board[py * BOARD_SIZE + px] !== pl) n++;
                    }
                }
            }
            return n;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            yuzenDone = false;`],
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!yuzenDone) {
                yuzenDone = true;
                captures[1] += motifCount(1) * (P('motif_pts') ?? 2);
                captures[2] += motifCount(2) * (P('motif_pts') ?? 2);
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        // 模様の筆致: 3連の起点に花色を置く
        ...K.STONE_MARKS_SPEC(`            // 絵羽模様の起点に友禅の花色
            ctx.save();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const pl = board[y * BOARD_SIZE + x];
                if (pl !== 1 && pl !== 2) continue;
                const inMotif = [[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy]) => {
                    for (let k = -2; k <= 0; k++) {
                        const sx = x + dx * k, sy = y + dy * k;
                        if (sx < 0 || sx >= BOARD_SIZE || sy < 0 || sy >= BOARD_SIZE) continue;
                        const ex = sx + dx * 2, ey = sy + dy * 2;
                        if (ex < 0 || ex >= BOARD_SIZE || ey < 0 || ey >= BOARD_SIZE) continue;
                        if (board[sy * BOARD_SIZE + sx] === pl && board[(sy + dy) * BOARD_SIZE + sx + dx] === pl && board[ey * BOARD_SIZE + ex] === pl) return true;
                    }
                    return false;
                });
                if (!inMotif) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.fillStyle = pl === 1 ? 'rgba(255,140,180,0.85)' : 'rgba(180,60,120,0.85)';
                ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.12, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();`),
        ...K.EVENT_CHIP_SPEC(`'絵羽 黒' + motifCount(1) + ' / 白' + motifCount(2)`),
        [K.ONE, K.INFO_BASE, `            友禅碁: 同色で3連以上の縦・横・斜め直線は「絵羽模様」。終局時に模様1本につき+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '同色の石が縦・横・斜めのいずれかに3連以上並ぶと「絵羽模様」(花色印) になる。',
            '終局時、模様1本につき+2目 — 長く伸ばしても1本は1本。別方向に描き分けろ。',
            '取り合いと並行して布に絵を描くように石を連ねる得点戦。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(3, 3)] = 1; board[I(4, 3)] = 1; board[I(5, 3)] = 1; // 横の絵羽
        board[I(7, 7)] = 2; board[I(8, 8)] = 2; board[I(9, 9)] = 2; board[I(10, 10)] = 2; // 斜め4連 → 1本
        assert('横3連は絵羽1本', motifCount(1) === 1);
        assert('斜め4連も絵羽1本', motifCount(2) === 1);
        yuzenDone = false;
        endGameByScore();
        assert('絵羽+2が加算', captures[1] === 2 && captures[2] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
