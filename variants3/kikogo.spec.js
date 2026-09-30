// KIKOGO — 紀行碁: 名所 (5つの点) を最初に訪れた石が記録に残る。各名所+2目
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
const ST_INIT = `{ meisho: {}, score: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'kikogo.html',
    en: 'KIKOGO',
    jp: '紀行碁',
    prefix: 'kikogo',
    desc: '名所は5箇所。最初に石を据えた者がその地を記して+2目。',
    kind: 'stone',
    icon: 'kikogo',
    spec: [
        ...K.rb('KIKOGO', '紀行碁', 'kikogo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 名所: 四隅寄りと中央の5箇所
        const MEISHO_PTS = (function () {
            const c = Math.floor(BOARD_SIZE / 3), m = Math.floor(BOARD_SIZE / 2);
            return [
                [c, c], [BOARD_SIZE - 1 - c, c], [m, m],
                [c, BOARD_SIZE - 1 - c], [BOARD_SIZE - 1 - c, BOARD_SIZE - 1 - c],
            ].map(([x, y]) => y * BOARD_SIZE + x);
        })();`],
        // 名所登録: 初めて石を据えた者がその名所を記す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 紀行: 名所に石が立てば初訪の記録+2目 (取られても記録は残る)
            {
                const i = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (MEISHO_PTS.includes(i) && st.meisho[i] === undefined && board[i] === player) {
                    st.meisho[i] = player;
                    st.score[player] += 2;
                    fxGlow(i, '#fbbf24', 900);
                    fxText(i, '名所!', '#d97706', 1200);
                }
            }

            turn = opponent;`],
        // 記録加点
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 紀行ルール: 記した名所は+2目ずつ加算済み
            territory.black += st.score[1];
            territory.white += st.score[2];`],
        // 名所の鳥居印と記録色
        K.CUE_STARS(`            // 名所: 鳥居の印 (記録済みは記した色の輪)
            {
                ctx.save();
                for (const i of MEISHO_PTS) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const r = cellSize * 0.32;
                    ctx.strokeStyle = '#dc2626';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                    ctx.lineCap = 'round';
                    // 鳥居: 上の貫と柱
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy - r * 0.8);
                    ctx.lineTo(cx + r, cy - r * 0.8);
                    ctx.moveTo(cx - r * 0.7, cy - r * 0.45);
                    ctx.lineTo(cx + r * 0.7, cy - r * 0.45);
                    ctx.moveTo(cx - r * 0.55, cy - r * 0.8);
                    ctx.lineTo(cx - r * 0.55, cy + r * 0.6);
                    ctx.moveTo(cx + r * 0.55, cy - r * 0.8);
                    ctx.lineTo(cx + r * 0.55, cy + r * 0.6);
                    ctx.stroke();
                    if (st.meisho && st.meisho[i]) {
                        ctx.strokeStyle = st.meisho[i] === 1 ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,0.85)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'名所 黒' + (st.score ? st.score[1] : 0) + ' 白' + (st.score ? st.score[2] : 0)`),
        [K.ONE, K.INFO_ALGO, `            紀行碁: 5箇所の名所に最初に石を据えた者が+2目 (取られても記録は残る)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の5箇所が名所。最初にそこへ石を据えた者がその地を記して+2目 — 後から取られても記録は消えない。',
            '序盤の名所巡りが勝負を分ける。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        const p0 = MEISHO_PTS[0];
        executeMove({ cells: [{ x: p0 % BOARD_SIZE, y: (p0 / BOARD_SIZE) | 0 }] }, 1);
        assert('名所の初訪は+2目', st.score[1] === 2 && st.meisho[p0] === 1);
        // 同じ名所に白が置いても記録は上書きされない (実際は埋まっているので直接検証)
        assert('記録は残る', st.meisho[p0] === 1);
        const p2 = MEISHO_PTS[2];
        executeMove({ cells: [{ x: p2 % BOARD_SIZE, y: (p2 / BOARD_SIZE) | 0 }] }, 2);
        assert('白の名所は白の記録', st.score[2] === 2 && st.meisho[p2] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
