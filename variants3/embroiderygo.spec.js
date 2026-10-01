// EMBROIDERYGO — 刺繍碁: 盤に9つの図案マス (3x3の大きな刺繍枠)。図案マスを縫い取ると終局時+1目/マス
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
    file: 'embroiderygo.html',
    en: 'EMBROIDERYGO',
    jp: '刺繍碁',
    prefix: 'embroiderygo',
    desc: '9つの図案枠。枠内の石多数が縫い取り、終局時+1目/枠。',
    kind: 'stone',
    icon: 'embroiderygo',
    spec: [
        ...K.rb('EMBROIDERYGO', '刺繍碁', 'embroiderygo'),
        K.params([
            { key: 'motif_grid', label: '図案枠の分割', options: [{ v: 2, l: '2x2 (4枠)' }, { v: 3, l: '3x3 (9枠)' }, { v: 4, l: '4x4 (16枠)' }], def: 3 },
            { key: 'motif_pts', label: '縫い取りボーナス', min: 0, max: 5, def: 1, unit: '目/枠' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let embDone = false;
        // 図案枠: 盤を3x3に分けた各枠 (index 0-8)
        function motifBox(i) {
            const g = Math.max(1, P('motif_grid') || 3);
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const bx = Math.min(g - 1, Math.floor(x * g / BOARD_SIZE));
            const by = Math.min(g - 1, Math.floor(y * g / BOARD_SIZE));
            return by * g + bx;
        }
        // 各枠の縫い取り判定: 枠内の石が多い側が縫い取る (同数・双方0なら不成立)
        function motifOwners() {
            const g = Math.max(1, P('motif_grid') || 3);
            const cnt = { 1: Array(g * g).fill(0), 2: Array(g * g).fill(0) };
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 1 || board[i] === 2) cnt[board[i]][motifBox(i)]++;
            }
            const own = [0, 0];
            for (let m = 0; m < g * g; m++) {
                if (cnt[1][m] > cnt[2][m]) own[0]++; else if (cnt[2][m] > cnt[1][m]) own[1]++;
            }
            return own;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            embDone = false;`],
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!embDone) {
                embDone = true;
                const own = motifOwners();
                captures[1] += own[0] * (P('motif_pts') || 1);
                captures[2] += own[1] * (P('motif_pts') || 1);
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        // 図案枠の罫線と縫い目の描画
        K.CUE_GRID(`            // 刺繍の図案枠: 3x3の大枠を点線の縫い目で
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(160,90,140,0.4)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.14]);
                for (let k = 1; k < (P('motif_grid') || 3); k++) {
                    const p = padding + k * (BOARD_SIZE / (P('motif_grid') || 3)) * cellSize - cellSize * 0.5;
                    ctx.beginPath(); ctx.moveTo(p, padding - cellSize * 0.5); ctx.lineTo(p, padding + (BOARD_SIZE - 0.5) * cellSize); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(padding - cellSize * 0.5, p); ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, p); ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(() => { const o = motifOwners(); return '縫取 黒' + o[0] + ' / 白' + o[1]; })()`),
        [K.ONE, K.INFO_ALGO, `            刺繍碁: 盤は3x3の図案枠。各枠で石が多い側が縫い取り、終局時+1目/枠<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は3x3の9つの図案枠 (点線の縫い目)。',
            '各枠で自分の石が相手より多ければその枠を「縫い取る」— 終局時に1枠+1目。',
            '通常の地取りと別に図案のバランスも読め。枠の跨ぎで布を縫い分ける。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('左上は図案枠0', motifBox(0) === 0);
        assert('右下は図案枠8', motifBox(BOARD_SIZE * BOARD_SIZE - 1) === 8);
        // 枠0に黒2・白1 → 黒が縫い取る
        board[I(1, 1)] = 1; board[I(2, 2)] = 1; board[I(0, 0)] = 2;
        const own = motifOwners();
        assert('黒が枠0を縫い取る', own[0] === 1 && own[1] === 0);
        embDone = false;
        endGameByScore();
        assert('縫取+1が加算', captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
