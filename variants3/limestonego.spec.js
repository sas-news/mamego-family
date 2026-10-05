// LIMESTONEGO — 石灰碁: 星の点は泉。泉に接する石は水に溶けて4手後に消え、鍾乳(領地の印)を残す
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
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
    file: 'limestonego.html',
    en: 'LIMESTONEGO',
    jp: '石灰碁',
    prefix: 'limestonego',
    desc: '星の点は泉。泉に接した石は4手で水に溶け、その跡に鍾乳 (領地の印) を残す。',
    kind: 'stone',
    icon: 'limestonego',
    spec: [
        ...K.rb('LIMESTONEGO', '石灰碁', 'limestonego'),
        K.params([
            { key: 'melt_turns', label: '溶解までの手数', min: 1, max: 12, def: 4, hint: '濡れた石がこの手数で溶ける' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST('{ wet: {}, stal: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 石灰碁: 泉(星)に接した石は4手後に溶けて鍾乳を残す
            {
                const SP = (getStarPoints(BOARD_SIZE).length ? getStarPoints(BOARD_SIZE)
                    : [{x:2,y:2},{x:6,y:2},{x:2,y:6},{x:6,y:6},{x:4,y:4}]).map(p => p.y * BOARD_SIZE + p.x);
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (!st.wet[mi] && (SP.includes(mi) || SP.some(s => getNeighbors(mi).includes(s)))) {
                    st.wet[mi] = history.length + Math.max(1, P('melt_turns') || 4);
                    fxSplash(mi, '#7dd3fc');
                    fxText(mi, '湿', '#38bdf8', 900);
                }
                for (const k in st.wet) {
                    const idx = +k;
                    if (board[idx] === 0 || board[idx] === 3) { delete st.wet[k]; continue; }
                    if (history.length >= st.wet[k]) {
                        st.stal[idx] = board[idx];
                        board[idx] = 0;
                        delete st.wet[k];
                        fxBurst(idx, '#93c5fd', 10);
                        fxText(idx, '鍾乳', '#60a5fa', 1000);
                    }
                }
                for (const k in st.stal) if (board[k] !== 0) delete st.stal[k];
            }

            turn = opponent;`],
        // 濡れた石に水色ドット、鍾乳跡に三角の鍾乳石
        ...K.STONE_MARKS_SPEC(`            // 石灰: 濡れている石に水滴印、鍾乳跡に小さな鍾乳石
            {
                ctx.save();
                for (const k in st.wet) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(125,211,252,0.9)';
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                }
                for (const k in st.stal) {
                    const idx = +k;
                    if (board[idx] !== 0) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.14;
                    ctx.fillStyle = st.stal[k] === 1 ? 'rgba(148,163,184,0.75)' : 'rgba(203,213,225,0.85)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy + r); ctx.lineTo(cx - r * 0.7, cy + r);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }`),
        // 終局時: 空点の鍾乳1個につき所有者+1目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.stal) {
                if (board[k] !== 0) continue;
                if (st.stal[k] === 1) territory.black += 1;
                else territory.white += 1;
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            石灰碁: 星の点は泉。泉に接した石は4手で溶け、跡に鍾乳 (+1目) を残す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星の点 (泉) またはその隣に置いた石は水に濡れ、4手後に溶けて消える。',
            '溶けた跡には鍾乳が残り、終局時に空点なら所有者に+1目。',
            '泉の周りは石が保たない — 一時的な確保か捨て石の地化か。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { wet: {}, stal: {} };
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1); // 星(3,3)の隣 → 濡れる
        assert('泉の隣の石は濡れる', st.wet[I(3, 4)] !== undefined);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 8 }] }, 2);
        assert('4手経過前はまだ石', board[I(3, 4)] === 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1); // history=5 で溶解
        assert('4手で溶けて鍾乳を残す', board[I(3, 4)] === 0 && st.stal[I(3, 4)] === 1);
        assert('溶けた後は濡れ記録が消える', st.wet[I(3, 4)] === undefined);
    `,
};
