// SCENTGO — 香り碁: 石に香りがある。自分の3色の香りが盤上で揃うと調香が発動し+2アゲハマ
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ scent: {}, cnt: { 1: 0, 2: 0 } }`;
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { scent: { ...st.scent }, cnt: { ...st.cnt } },
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? { scent: { ...(snap.st.scent || {}) }, cnt: { ...(snap.st.cnt || { 1: 0, 2: 0 }) } } : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st: { scent: { ...st.scent }, cnt: { ...st.cnt } },
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? { scent: { ...(s.st.scent || {}) }, cnt: { ...(s.st.cnt || { 1: 0, 2: 0 }) } } : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st: { scent: { ...st.scent }, cnt: { ...st.cnt } },
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? { scent: { ...(data.st.scent || {}) }, cnt: { ...(data.st.cnt || { 1: 0, 2: 0 }) } } : ${init};`],
];
module.exports = {
    file: 'scentgo.html',
    en: 'SCENTGO',
    jp: '香り碁',
    prefix: 'scentgo',
    desc: '石に3種の香り。自分の3色の香りが盤上で揃うと調香が発動し+2アゲハマ。',
    kind: 'stone',
    icon: 'scentgo',
    spec: [
        ...K.rb('SCENTGO', '香り碁', 'scentgo'),
        K.params([
            { key: 'blend_bonus', label: '調香ボーナス', min: 0, max: 8, def: 2, unit: '点' },
        ]),
        ...ST(ST_INIT),
        // 香り: 各側の着手は順に「花・木・茶」の香りを持つ。3種揃うと調香で+2
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(cell => {
                board[cell.y * BOARD_SIZE + cell.x] = player;
                st.scent[cell.y * BOARD_SIZE + cell.x] = st.cnt[player] % 3;
                st.cnt[player]++;
            });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete st.scent[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
            // 調香: 自分の3色の香りが盤上に揃ったら発動
            {
                const mine = new Set();
                board.forEach((v, i) => { if (v === player && st.scent[i] !== undefined) mine.add(st.scent[i]); });
                if (mine.size === 3) {
                    captures[player] += (P('blend_bonus') ?? 2);
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '調香!', '#d946ef', 1400);
                    // 使い切った香りは石から消える (揃い直しが必要)
                    board.forEach((v, i) => { if (v === player) delete st.scent[i]; });
                }
            }`],
        // 香りを石の下に小さな色丸で示す (花=桃・木=緑・茶=橙)
        ...K.STONE_MARKS_SPEC(`            Object.keys(st.scent).forEach(k => {
                const i = Number(k);
                if (board[i] === 0) return;
                const cols = ['#f9a8d4', '#86efac', '#fdba74'];
                const cx = padding + (i % BOARD_SIZE) * cellSize;
                const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.fillStyle = cols[st.scent[i]];
                ctx.beginPath();
                ctx.arc(cx + cellSize * 0.2, cy + cellSize * 0.2, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            })`),
        ...K.EVENT_CHIP_SPEC(`'香り: ' + ['花', '木', '茶'][st.cnt[turn] % 3]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            香り碁: 石は順に花・木・茶の香りを持つ。自分の3色が盤上で揃うと調香で+2アゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーの石は着手順に「花・木・茶」の香りを帯びる (石の下の小さな色丸)。',
            '盤上に自分の3色の香りが揃った瞬間、調香が発動して+2アゲハマ。',
            '取られて香りが欠けると揃い直しが必要 — 相手の香りを摘む戦略も生まれる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.scent = {}; st.cnt = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 花
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1); // 木
        assert('香りが循環する', st.scent[0] === 0 && st.scent[B] === 1);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1); // 茶 → 3色揃う
        assert('3色揃うと調香で+2', captures[1] === 2);
        captures[1] = 0;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 2); // 白の花
        executeMove({ cells: [{ x: 2, y: 3 }] }, 2); // 白の木
        executeMove({ cells: [{ x: 2, y: 4 }] }, 2); // 白の茶 → 調香
        assert('白の3色も調香する', captures[2] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
