// RAINBOWGO — 虹霓碁: 24手周期で雨上がり (8手) に虹が架かり、虹の間だけ斜め隣接も連結になる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'rainbowgo.html',
    en: 'RAINBOWGO',
    jp: '虹霓碁',
    prefix: 'rainbowgo',
    desc: '24手周期で雨上がり (8手間) に虹が架かり、斜め隣接も連結になる。',
    kind: 'stone',
    icon: 'rainbowgo',
    spec: [
        ...K.rb('RAINBOWGO', '虹霓碁', 'rainbowgo'),
        K.params([
            { key: 'cycle', label: '虹の周期', min: 8, max: 60, def: 24, unit: '手' },
            { key: 'rainbow_len', label: '虹の出る手数', min: 1, max: 16, def: 8, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 虹 (24手周期の後半8手): 斜め隣接も連結に数える
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const n = [];
            if (x > 0) n.push(idx - 1);
            if (x < BOARD_SIZE - 1) n.push(idx + 1);
            if (y > 0) n.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) n.push(idx + BOARD_SIZE);
            // 虹: 周期の末尾 rbLen 手は斜め隣接も連結
            const rbCyc = Math.max(2, P('cycle') || 24);
            const rbLen = Math.min(Math.max(1, P('rainbow_len') || 8), rbCyc);
            if (history.length % rbCyc >= rbCyc - rbLen) {
                if (x > 0 && y > 0) n.push(idx - BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y > 0) n.push(idx - BOARD_SIZE + 1);
                if (x > 0 && y < BOARD_SIZE - 1) n.push(idx + BOARD_SIZE - 1);
                if (x < BOARD_SIZE - 1 && y < BOARD_SIZE - 1) n.push(idx + BOARD_SIZE + 1);
            }
            return n;
        }`],
        // 虹の描画
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 虹: 雨上がりの間だけ盤に虹のアーチを描く
        fxAmbient((ctx2, now, pad, cs) => {
            const rbCyc = Math.max(2, P('cycle') || 24), rbLen = Math.min(Math.max(1, P('rainbow_len') || 8), rbCyc);
            if (history.length % rbCyc < rbCyc - rbLen) return;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const cx = w / 2, cy = w * 0.62;
            const cols = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'];
            ctx2.save();
            ctx2.globalAlpha = 0.28 + 0.08 * Math.sin(now / 700);
            ctx2.lineWidth = cs * 0.16;
            cols.forEach((c, i) => {
                ctx2.strokeStyle = c;
                ctx2.beginPath();
                ctx2.arc(cx, cy, w * 0.52 - i * cs * 0.16, Math.PI * 1.15, Math.PI * 1.85);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`(() => { const c = Math.max(2, P('cycle') || 24), l = Math.min(Math.max(1, P('rainbow_len') || 8), c), h = history.length % c; return h >= c - l ? '虹出現!' : '虹まで ' + (c - l - h) + '手'; })()`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            虹霓碁: 24手周期の後半8手で虹が架かり、斜め隣接も連結・呼吸になる<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '24手ごとに雨が上がり、後半8手は虹が架かる。',
            '虹の間は斜め4方向の隣接も連結に数える: 呼吸も取りも斜めが有効になる。',
            '虹の間だけ斜め繋がりで石が助かり、逆に斜めからも取れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 通常時は斜めは隣接しない
        assert('通常は4近傍', getNeighbors(5 * BOARD_SIZE + 5).length === 4);
        // 虹の時は斜めも隣接
        history.length = 16;
        assert('虹の時は8近傍', getNeighbors(5 * BOARD_SIZE + 5).length === 8);
        // 虹で斜め連結が呼吸になる: 白1個が黒に囲まれても斜めの白石で助かる
        board.fill(0); pieces = [];
        board[5 * BOARD_SIZE + 5] = 2; // 白
        board[4 * BOARD_SIZE + 4] = 2; // 斜めの白
        [[5, 4], [5, 6], [4, 5], [6, 5]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        const cap = getCapturedStones(board, 2);
        assert('斜め連結で呼吸がある', !cap.includes(5 * BOARD_SIZE + 5));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
