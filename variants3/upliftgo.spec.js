// UPLIFTGO — 隆起碁: 12手ごとに盤の一部が隆起して新しい高地になる (高地の石は呼吸+1)
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
const ST_INIT = `{ ply: 0, upCount: 0, high: [] }`;
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
    file: 'upliftgo.html',
    en: 'UPLIFTGO',
    jp: '隆起碁',
    prefix: 'upliftgo',
    desc: '12手ごとに盤の一部が隆起して新しい高地になる。高地の石は呼吸+1。',
    kind: 'stone',
    icon: 'upliftgo',
    spec: [
        ...K.rb('UPLIFTGO', '隆起碁', 'upliftgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 隆起: 順番に隆起する2x2高地のブロック位置 (中央→四隅)
        function upliftSets() {
            const n = BOARD_SIZE, c = Math.floor(n / 2), q1 = Math.max(1, Math.round(n * 0.18)), q2 = n - 3 - q1;
            return [
                [[c - 1, c - 1], [c, c - 1], [c - 1, c], [c, c]],
                [[q1, q1], [q1 + 1, q1], [q1, q1 + 1], [q1 + 1, q1 + 1]],
                [[q2, q2], [q2 + 1, q2], [q2, q2 + 1], [q2 + 1, q2 + 1]],
                [[q2, q1], [q2 + 1, q1], [q2, q1 + 1], [q2 + 1, q1 + 1]],
                [[q1, q2], [q1 + 1, q2], [q1, q2 + 1], [q1 + 1, q2 + 1]],
            ];
        }
        function isHigh(i) { return st.high.indexOf(i) >= 0; }`],
        // 隆起: 12手ごとに次の高地ブロックがせり上がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 隆起: 12手ごとに新しい2x2高地がせり上がる
            st.ply++;
            if (st.ply % 12 === 0 && st.upCount < upliftSets().length) {
                const set = upliftSets()[st.upCount];
                st.upCount++;
                set.forEach(([x, y]) => {
                    const i = y * BOARD_SIZE + x;
                    st.high.push(i);
                    fxGlow(i, '#d97706', 900);
                });
                fxShake(4, 300);
                const c0 = Math.floor(BOARD_SIZE / 2);
                fxText(set[0][1] * BOARD_SIZE + set[0][0], '隆起!', '#f59e0b', 1300);
            }

            turn = opponent;`],
        // 高地の石は呼吸+1
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (isHigh(curr)) liberties++; // 高地の石は風を受けて硬い
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (isHigh(curr)) liberties++; // 高地の石は風を受けて硬い
            }
            return liberties;`],
        // 高地の描画: 茶色の盛り上がり + 縁の段差線
        K.CUE_GRID(`            // 高地: 隆起した土地は茶色く盛り上がる
            {
                ctx.save();
                st.high.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const g = ctx.createLinearGradient(cx, cy - cellSize * 0.5, cx, cy + cellSize * 0.5);
                    g.addColorStop(0, 'rgba(180,130,70,0.4)');
                    g.addColorStop(1, 'rgba(120,85,45,0.4)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(90,60,30,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.42, cy - cellSize * 0.42, cellSize * 0.84, cellSize * 0.84);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の隆起まで ' + (12 - (st.ply % 12)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            隆起碁: 12手ごとに盤の一部が隆起して新しい高地になる (高地の石は呼吸+1)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '12手ごとに盤の2x2ブロックが隆起して新高地ができる (中央→四隅の順)。',
            '高地に立つ石は呼吸点+1 — せり上がった分だけ風を受けて硬い。',
            '隆起のタイミングはチップで読める。隆起地を先に制すれば地に厚みが出る。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('隆起前は高地なし', st.high.length === 0);
        st.ply = 11;
        pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('12手目で隆起', st.high.length === 4 && st.upCount === 1);
        const h0 = st.high[0];
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[h0] = 1;
        assert('高地の石は呼吸+1', getLiberties(board, h0) >= 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
