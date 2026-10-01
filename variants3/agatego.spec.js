// AGATEGO — 瑪瑙碁: 味方3石以上に囲まれて置いた石は縞模様の層を持ち、取りを1度だけ耐える
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
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
    file: 'agatego.html',
    en: 'AGATEGO',
    jp: '瑪瑙碁',
    prefix: 'agatego',
    desc: '味方3石に囲まれて置いた石は縞の層を持つ。層を持つ石は瑪瑙となり取られない。',
    kind: 'stone',
    icon: 'agatego',
    spec: [
        ...K.rb('AGATEGO', '瑪瑙碁', 'agatego'),
        K.params([
            { key: 'band_min', label: '縞になる囲み数', min: 2, max: 4, def: 3, unit: '石' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST('{ banded: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 瑪瑙碁: 味方3石以上に囲まれた着手は縞模様の層を得る
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const adj = getNeighbors(mi).filter(n => board[n] === player).length;
                if (adj >= (P('band_min') || 3)) {
                    st.banded[mi] = 1;
                    fxGlow(mi, '#f0abfc', 900);
                    fxText(mi, '縞!', '#e879f9', 1000);
                }
                for (const k in st.banded) if (board[k] === 0 || board[k] === 3) delete st.banded[k];
            }

            turn = opponent;`],
        // 層を持つ瑪瑙は取れない (縞を含む連は常に呼吸あり)
        [K.ONE, `                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);`,
`                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);
                        // 縞模様の層を持つ瑪瑙を含む連は常に呼吸あり (取れない)
                        if (st.banded[curr]) hasLiberty = true;`],
        // 縞模様の石は紫の同心円
        ...K.STONE_MARKS_SPEC(`            // 瑪瑙: 層を持つ石に紫の縞リングを2重に描く
            {
                ctx.save();
                for (const k in st.banded) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(217,70,239,0.85)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            瑪瑙碁: 味方3石に囲まれて置いた石は縞の層を持つ。層を持つ石は取られない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方の石3個以上に囲まれる形で置くと、その石は瑪瑙の縞模様 (層) を持つ。',
            '層を持つ石は硬い瑪瑙 — その石を含む連はいくら囲まれても取られない。',
            '囲み合いの中で石を鍛える。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.banded = {}; captures = { 1: 0, 2: 0 };
        // 層付き白石を黒が囲む
        board[I(1, 1)] = 2; st.banded[I(1, 1)] = 1;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 最後の呼吸点を塞ぐ
        assert('層を持つ石は取られない', board[I(1, 1)] === 2 && captures[1] === 0);
        assert('層は残る', st.banded[I(1, 1)] === 1);
        // 層なし白石は普通に取られる
        board[I(5, 5)] = 2;
        board[I(4, 5)] = 1; board[I(5, 4)] = 1; board[I(5, 6)] = 1;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1);
        assert('層なし石は取られる', board[I(5, 5)] === 0 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
