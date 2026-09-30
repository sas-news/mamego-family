// UMEBOSHIGO — 梅干碁: 梅の木の下の点に置いた石は8手ごとに塩漬けされ、終局時+2目
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
const ST_INIT = `{ salted: {} }`;
module.exports = {
    file: 'umeboshigo.html',
    en: 'UMEBOSHIGO',
    jp: '梅干碁',
    prefix: 'umeboshigo',
    desc: '梅の木の下の石は8手ごとに塩漬けされて梅干に。終局時1個+2目。',
    kind: 'stone',
    icon: 'umeboshigo',
    spec: [
        ...K.rb('UMEBOSHIGO', '梅干碁', 'umeboshigo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 梅の木: 5つの点 (天元+四隅寄り)
        const UME_PTS = (() => {
            const uc = Math.floor(BOARD_SIZE / 4);
            const m = Math.floor(BOARD_SIZE / 2);
            return [[uc, uc], [uc, BOARD_SIZE - 1 - uc], [BOARD_SIZE - 1 - uc, uc],
                [BOARD_SIZE - 1 - uc, BOARD_SIZE - 1 - uc], [m, m]]
                .map(([x, y]) => y * BOARD_SIZE + x);
        })();`],
        // 塩漬け: 8手ごとに梅の下の石が塩漬けされる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 梅干: 8手ごとに梅の木の下の石が塩漬けされる
            if (history.length > 0 && history.length % 8 === 0) {
                Object.keys(st.salted).forEach(k => { if (board[+k] !== 1 && board[+k] !== 2) delete st.salted[k]; });
                let salted = 0;
                UME_PTS.forEach(i => {
                    if ((board[i] === 1 || board[i] === 2) && !st.salted[i]) {
                        st.salted[i] = 1;
                        fxGlow(i, '#f472b6', 700);
                        salted++;
                    }
                });
                if (salted) fxText(UME_PTS[UME_PTS.length - 1], '塩漬け!', '#ec4899', 1100);
            }

            turn = opponent;`],
        // 梅干集計: 生きている梅干は+2目ずつ
        [K.ONE, `        function endGameByScore() {`, `        // 梅干: 塩漬けを数える
        function umeBonus() {
            const b = { 1: 0, 2: 0 };
            Object.keys(st.salted || {}).forEach(k => {
                const i = +k;
                if (board[i] === 1 || board[i] === 2) b[board[i]] += 2;
            });
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 梅干ルール: 塩漬けの石は終局時+2目
            {
                const ub = umeBonus();
                territory.black += ub[1];
                territory.white += ub[2];
            }`],
        // 梅の木の描画: 小さな花の点
        K.CUE_STARS(`            // 梅の木: 5弁の花マーク
            {
                ctx.save();
                UME_PTS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    for (let p = 0; p < 5; p++) {
                        const a = p * Math.PI * 2 / 5 - Math.PI / 2;
                        ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(a) * cellSize * 0.26, cy + Math.sin(a) * cellSize * 0.26, cellSize * 0.11, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 梅干: 石の中央に赤紫の印
            {
                ctx.save();
                Object.keys(st.salted || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(190, 24, 93, 0.85)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'塩漬けまで ' + (8 - (history.length % 8)) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            梅干碁: 梅の木の下の石は8手ごとに塩漬けされ終局時+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上に5本の「梅の木」がある (花マーク)。木の下の石は8手ごとに塩漬けされ、終局まで残れば1個+2目。',
            '梅は両者が取り合う名所。塩漬けを守るか相手の梅を摘むか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('梅の木は5本', UME_PTS.length === 5);
        board.fill(0); pieces = []; history.length = 0; st.salted = {};
        board[UME_PTS[0]] = 1;
        history.push({}, {}, {}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2); // history=8 → 塩漬け
        assert('8手で塩漬けになる', st.salted[UME_PTS[0]] === 1);
        assert('梅干は+2目', umeBonus()[1] === 2);
        board.fill(0); pieces = []; history.length = 0; st.salted = {};
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
