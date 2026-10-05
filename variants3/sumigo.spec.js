// SUMIGO — 墨摺碁: 石は墨。硯(区域)で摺ると濃さが変わり、濃い石は取られると価値が高い
const K = require('../gen_kit.js');
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
const ST_INIT = `{ ink: {}, _end: false }`;
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
    file: 'sumigo.html',
    en: 'SUMIGO',
    jp: '墨摺碁',
    prefix: 'sumigo',
    desc: '石は墨。硯の上で打つと濃く摺れ、濃い石は取られると2点のアゲハマになる。',
    kind: 'stone',
    icon: 'sumigo',
    spec: [
        ...K.rb('SUMIGO', '墨摺碁', 'sumigo'),
        K.params([
            { key: 'suzuri_size', label: '硯の一辺のサイズ', min: 1, max: 4, def: 2, unit: 'マス' },
            { key: 'ink_bonus', label: '濃墨の追加アゲハマ', min: 0, max: 5, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 硯: 盤中央の2x2の黒い水盤
        let SUZURI = new Set();
        function rebuildSuzuri() {
            SUZURI = new Set();
            const n = P('suzuri_size') || 2;
            const c = Math.floor(BOARD_SIZE / 2);
            const s = c - Math.floor(n / 2);
            for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) {
                const x = s + dx, y = s + dy;
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) SUZURI.add(y * BOARD_SIZE + x);
            }
        }
        function onVariantParam(p) { if (p.key === 'suzuri_size') rebuildSuzuri(); }
        function onSuzuri(i) { return SUZURI.has(i); }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildSuzuri();`],
        // 摺り: 硯の上で打つと墨が濃くなる (濃度=着手時の手数で固定)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const pi = p.y * BOARD_SIZE + p.x;
                if (onSuzuri(pi)) {
                    st.ink[pi] = 2; // 濃墨
                    fxGlow(pi, '#1f2937', 700);
                }
            });`],
        // 濃墨: 取ると2点のアゲハマになる (通常の1点に+1)
        [K.ONE, K.CAPTURE_BLOCK, K.CAPTURE_BLOCK + `
            // 濃墨ボーナス: 濃い墨は取られると2点のアゲハマになる
            captured.forEach(idx => {
                if (st.ink[idx] > 1) {
                    captures[player] += (P('ink_bonus') ?? 1);
                    delete st.ink[idx];
                    fxText(idx, '濃墨+1', '#374151', 1000);
                }
            });`],
        // 硯の描画: 中央の黒い水盤
        K.CUE_GRID(`            // 硯: 中央の黒い水盤 (墨を摺る面)
            {
                ctx.save();
                SUZURI.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(30,32,40,0.55)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(80,80,95,0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - cellSize * 0.44, cy - cellSize * 0.44, cellSize * 0.88, cellSize * 0.88);
                });
                ctx.restore();
            }`),
        // 濃墨の印: 石の周りに黒い滲み
        ...K.STONE_MARKS_SPEC(`            // 濃墨: 石の周りに墨の滲みが出る
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(30,30,40,0.55)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                Object.keys(st.ink).forEach(k => {
                    const i = +k;
                    if (board[i] === 0 || board[i] === 3) return;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'濃墨 ' + Object.keys(st.ink).length + '石'`),
        [K.ONE, K.INFO_BASE, `            墨摺碁: 中央の硯で打つと墨が濃くなる (黒い滲み)。濃墨は取られると2点のアゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央の2x2は硯。硯の上で打った石は濃墨となり、黒い滲みが出る。',
            '濃墨を取ると通常のアゲハマに+1 — 濃い石は取りがいがある。',
            '硯は双方共通の研磨場。濃墨を育てるか、相手の濃墨を取るかの駆け引き。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('硯がある', SUZURI.size >= 3 && SUZURI.has(I(c, c)));
        const s0 = [...SUZURI][0];
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.ink = {};
        executeMove({ cells: [{ x: s0 % BOARD_SIZE, y: (s0 / BOARD_SIZE) | 0 }] }, 1);
        assert('硯で打つと濃墨', st.ink[s0] === 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.ink = {};
        board[I(5, 5)] = 2; st.ink[I(5, 5)] = 2;
        board[I(5, 4)] = 1; board[I(4, 5)] = 1; board[I(6, 5)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('濃墨は2点で取れる', captures[1] === 2);
    `,
};
