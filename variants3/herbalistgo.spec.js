// HERBALISTGO — 本草碁: 盤の薬草点に置くと薬草を採集。3株で調合し全連+1呼吸の強壮剤
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
const ST_INIT = `{ herbs: { 1: 0, 2: 0 }, tonic: { 1: false, 2: false } }`;
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
    file: 'herbalistgo.html',
    en: 'HERBALISTGO',
    jp: '本草碁',
    prefix: 'herbalistgo',
    desc: '薬草点に置いて採集。3株で調合し全連+1呼吸の強壮剤。',
    kind: 'stone',
    icon: 'herbalistgo',
    spec: [
        ...K.rb('HERBALISTGO', '本草碁', 'herbalistgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 薬草点: 回転対称な6点 (辺の中程の4点 + 中央寄りの2点)
        function isHerbPoint(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const c = (BOARD_SIZE - 1) / 2, q = Math.round(c / 2), N = BOARD_SIZE - 1;
            const pts = [[q, 0], [N, q], [N - q, N], [0, N - q], [c - 1, c + 1], [c + 1, c - 1]];
            return pts.some(([px, py]) => px === x && py === y);
        }`],
        // 採集: 薬草点に置くと+1株。3株で調合 → 全連+1呼吸
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const hi = p.y * BOARD_SIZE + p.x;
                if (isHerbPoint(hi)) {
                    st.herbs[player]++;
                    fxGlow(hi, '#4ade80', 900);
                    fxText(hi, '採集 ' + st.herbs[player] + '/3', '#22c55e', 1100);
                    if (st.herbs[player] >= 3 && !st.tonic[player]) {
                        st.tonic[player] = true;
                        fxText(hi, '調合完了!', '#16a34a', 1500);
                        fxShake(4, 300);
                    }
                }
            });`],
        // 捕獲判定: 調合済みなら全連+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (st.tonic[player]) liberties += 1; // 強壮剤: 気力が漲る

                    if (liberties <= 0) {`],
        // 薬草点の描画: 緑の十字葉
        K.CUE_GRID(`            // 薬草点: 緑の葉十字
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (!isHerbPoint(i)) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(34,139,70,0.75)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.2, cy); ctx.lineTo(cx + cellSize * 0.2, cy);
                    ctx.moveTo(cx, cy - cellSize * 0.2); ctx.lineTo(cx, cy + cellSize * 0.2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(74,222,128,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.tonic[turn] ? '強壮剤あり' : '薬草 ' + st.herbs[turn] + '/3'`),
        [K.ONE, K.INFO_ALGO, `            本草碁: 薬草点 (緑の葉十字) に置くと薬草+1。3株採集で調合し全連+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上6箇所の薬草点 (緑十字) に石を置くと薬草を1株採集。',
            '薬草3株で強壮剤を調合 — 以後、自分の全ての連が呼吸点+1。',
            '薬草は双方共通の資源。先に3株集めるか、敵の採集を遮るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const c = (BOARD_SIZE - 1) / 2;
        const herbIdx = (() => { for (let i = 0; i < board.length; i++) if (isHerbPoint(i)) return i; return -1; })();
        assert('薬草点が存在する', herbIdx >= 0);
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.herbs = { 1: 0, 2: 0 }; st.tonic = { 1: false, 2: false };
        executeMove({ cells: [{ x: herbIdx % BOARD_SIZE, y: (herbIdx / BOARD_SIZE) | 0 }] }, 1);
        assert('採集で+1株', st.herbs[1] === 1);
        st.tonic[1] = true;
        board[c * BOARD_SIZE + c] = 1;
        board[c * BOARD_SIZE + c - 1] = 2; board[c * BOARD_SIZE + c + 1] = 2;
        board[(c - 1) * BOARD_SIZE + c] = 2; board[(c + 1) * BOARD_SIZE + c] = 2;
        assert('調合済みの連は呼吸+1で生きる', !getCapturedStones(board, 1).includes(c * BOARD_SIZE + c));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
