// BENTOGO — 弁当碁: 盤を4つの弁当仕切り(象限)に分け、全仕切りで個数が拮抗する側が詰め合わせ点を得る
const K = require('../gen_kit.js');
module.exports = {
    file: 'bentogo.html',
    en: 'BENTOGO',
    jp: '弁当碁',
    prefix: 'bentogo',
    desc: '12手ごとの開け弁当判定。4仕切りすべてに石が1個以上ある側がバランス点を得る。先に3点で幕の内勝ち。',
    kind: 'stone',
    icon: 'bentogo',
    spec: [
        ...K.rb('BENTOGO', '弁当碁', 'bentogo'),
        K.params([
            { key: 'bento_interval', label: '開け弁当の間隔', min: 6, max: 24, def: 12, unit: '手' },
            { key: 'bento_win', label: '幕の内勝ちの点数', min: 2, max: 6, def: 3, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 70, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bal: { 1: 0, 2: 0 } }; // バランス点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bal: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bal: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bal: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bal: { 1: 0, 2: 0 } };`],
        // 仕切り: 十字の仕切り線で盤を4区画に
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function bentoQuad(x, y) {
            const mid = (BOARD_SIZE - 1) / 2;
            if (x <= mid && y <= mid) return 0;
            if (x > mid && y <= mid) return 1;
            if (x > mid && y > mid) return 2;
            return 3;
        }
        function countByQuad(player) {
            const c = [0, 0, 0, 0];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] === player) c[bentoQuad(x, y)]++;
                }
            }
            return c;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 開け弁当: 12手ごと。4仕切りすべてに石がある側がバランス点+1
            if (history.length > 0 && history.length % Math.max(1, P('bento_interval') || 12) === 0) {
                const c1 = countByQuad(1), c2 = countByQuad(2);
                const ok1 = c1.every(c => c > 0), ok2 = c2.every(c => c > 0);
                if (ok1 && !ok2) st.bal[1]++;
                else if (ok2 && !ok1) st.bal[2]++;
                else if (ok1 && ok2) { st.bal[1]++; st.bal[2]++; }
                const mid = Math.floor(BOARD_SIZE / 2);
                fxText(mid * BOARD_SIZE + mid, '開け弁当!', '#fb923c', 1200);
                if (st.bal[1] >= (P('bento_win') || 3) || st.bal[2] >= (P('bento_win') || 3)) {
                    const w = st.bal[1] >= (P('bento_win') || 3) ? 1 : 2;
                    winByRule(w, '幕の内勝ち', 'バランス点が3点に達しました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= (P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 弁当の仕切り線を描く
        K.CUE_STARS(`            // 弁当の十字仕切り
            {
                const mid = (BOARD_SIZE - 1) / 2;
                const x = padding + (mid + 0.5) * cellSize, y = padding + (mid + 0.5) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(217,119,6,0.8)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.2]);
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(padding + BOARD_SIZE * cellSize, y);
                ctx.moveTo(x, padding);
                ctx.lineTo(x, padding + BOARD_SIZE * cellSize);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'幕の内 ' + st.bal[1] + '-' + st.bal[2]`),
        [K.ONE, K.INFO_ALGO, `            弁当碁: 4仕切りすべてに石が入るとバランス点。先に3点で幕の内勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は橙色の仕切りで4区画。12手ごとの開け弁当判定で、全区画に自分の石がある側がバランス点+1 (両方なら両者得点)。',
            'バランス点が先に3点で幕の内勝ち。地取りの合間に仕切りの向こうへ具材を詰めよう。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bal: { 1: 0, 2: 0 } };
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('4区画の判定', bentoQuad(0, 0) === 0 && bentoQuad(BOARD_SIZE - 1, BOARD_SIZE - 1) === 2);
        // 黒を全区画に配置
        board[1] = 1; board[BOARD_SIZE + BOARD_SIZE - 1] = 1;
        board[(BOARD_SIZE - 1) * BOARD_SIZE + BOARD_SIZE - 1] = 1; board[(BOARD_SIZE - 1) * BOARD_SIZE] = 1;
        for (let i = 0; i < 11; i++) history.push({ turn: 1 });
        executeMove({ cells: [{ x: mid, y: mid }] }, 2);
        assert('黒がバランス点を得る', st.bal[1] === 1 && st.bal[2] === 0);
        st.bal = { 1: 2, 2: 0 }; history.length = 0;
        for (let i = 0; i < 11; i++) history.push({ turn: 1 });
        executeMove({ cells: [{ x: 0, y: mid }] }, 2);
        assert('3点で幕の内勝ち', gameOver === true && gameResultData && gameResultData.title.includes('幕の内'));
    `,
};
