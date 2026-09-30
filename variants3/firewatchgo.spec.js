// FIREWATCHGO — 鎮火碁: 盤の燃える8箇所。直上か隣に置いて放水し鎮火させると+1目 (各1回)
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
const ST_INIT = `{ out: {} }`;
module.exports = {
    file: 'firewatchgo.html',
    en: 'FIREWATCHGO',
    jp: '鎮火碁',
    prefix: 'firewatchgo',
    desc: '盤の燃える8点。直上・隣に置くと放水して鎮火+1目 (各1回・両者共通)。',
    kind: 'stone',
    icon: 'firewatchgo',
    spec: [
        ...K.rb('FIREWATCHGO', '鎮火碁', 'firewatchgo'),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        // 火災点: 盤に散る8箇所
const FIRES = [
    [2, 2], [3, 2], [2, 3], [10, 10], [10, 11], [11, 10], [2, 10], [10, 2],
].map(([x, y]) => Math.min(y, BOARD_SIZE - 1) * BOARD_SIZE + Math.min(x, BOARD_SIZE - 1));

        function executeMove(move, player) {`],

        // 火の描画
        K.CUE_STARS(`            // 火災点: 燃える炎
            {
                ctx.save();
                FIRES.forEach(i => {
                    if (st.out[i] || board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(249,115,22,0.4)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(220,60,40,0.75)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.28);
                    ctx.quadraticCurveTo(cx + cellSize * 0.2, cy, cx, cy + cellSize * 0.2);
                    ctx.quadraticCurveTo(cx - cellSize * 0.2, cy, cx, cy - cellSize * 0.28);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(250,204,21,0.85)';
                    ctx.beginPath();
                    ctx.arc(cx, cy + cellSize * 0.05, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        // 放水: 着手点とその隣の火を鎮火して+1目ずつ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鎮火碁: 着手点とその隣の火を放水で消して+1目ずつ
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let out = 0;
                const spots = [pi, ...getNeighbors(pi)];
                spots.forEach(i => {
                    if (!st.out[i] && FIRES.includes(i)) {
                        st.out[i] = 1;
                        captures[player]++;
                        out++;
                        fxSplash(i, '#60a5fa', 8);
                        fxText(i, '鎮火 +1', '#38bdf8', 1000);
                    }
                });
                if (out >= 2) fxText(pi, '一斉放水!', '#38bdf8', 1200);
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'残火 ' + FIRES.filter(i => !st.out[i]).length + '箇所'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            鎮火碁: 盤の燃える8点。直上か隣に石を置くと放水して鎮火+1目 (各1回)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤には8箇所の火災点。着火点の直上または隣に自分の石を置けば放水して+1目。',
            '一度に複数の火を消せる位置取りが美味しい。火は両者共通の得点源。',
            '燃える盤で火消しの意地。消火を競いながら地も取る二正面の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.out = {};
        const f0 = FIRES[6]; // (2,10) 孤立した火
        executeMove({ cells: [{ x: f0 % BOARD_SIZE, y: Math.floor(f0 / BOARD_SIZE) }] }, 1); // 直上
        assert('直上放水で+1', captures[1] === 1 && st.out[f0] === 1);
        const f1 = FIRES[7]; // (10,2) 孤立した火 — その左隣へ
        executeMove({ cells: [{ x: (f1 % BOARD_SIZE) - 1, y: Math.floor(f1 / BOARD_SIZE) }] }, 2);
        assert('隣接放水で+1', captures[2] === 1 && st.out[f1] === 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('鎮火済みは再加点なし', captures[1] === 1);
    `,
};
