// PAWNARMYGO — 歩兵碁: 5手ごとの着手は「大将石」。大将は甲冑で最初の捕獲を1度だけ耐える
const K = require('../gen_kit.js');
module.exports = {
    file: 'pawnarmygo.html',
    en: 'PAWNARMYGO',
    jp: '歩兵碁',
    prefix: 'pawnarmygo',
    desc: '5手ごとの着手は大将石。大将は甲冑で最初の捕獲を1度耐える。',
    kind: 'stone',
    icon: 'pawnarmygo',
    spec: [
        ...K.rb('PAWNARMYGO', '歩兵碁', 'pawnarmygo'),
        K.params([
            { key: 'general_interval', label: '大将石の周期', min: 3, max: 12, def: 5, unit: '手ごと' },
            { key: 'move_cap', label: '打ち切り手数', min: 40, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { big: {} }; // 大将石: idx → 色。甲冑で最初の捕獲を耐える`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { big: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { big: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { big: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { big: {} };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 捕獲: 大将は甲冑で1度だけ持ちこたえる (消えずに残る)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let kept = 0;
                captured.forEach(idx => {
                    if (st.big[idx]) {
                        st.big[idx] = 0; // 甲冑が砕けて通常石に
                        kept++;
                        fxGlow(idx, '#facc15', 800);
                        fxText(idx, '大将!', '#facc15', 900);
                    } else {
                        board[idx] = 0;
                    }
                });
                captures[player] += captured.length - kept;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 歩兵碁: 各軍5手ごとの着手は大将石になる
            {
                const movesMade = history.filter(h => h.turn === player).length;
                if (movesMade % Math.max(2, P('general_interval') || 5) === 0) {
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    if (board[mi] === player && !st.big[mi]) {
                        st.big[mi] = player;
                        fxGlow(mi, '#facc15', 800);
                        fxText(mi, '大将', '#facc15', 1000);
                    }
                }
                // 盤から消えた大将情報を掃除
                Object.keys(st.big).forEach(k => { if (board[k] !== st.big[k]) delete st.big[k]; });
            }

            // 打ち切り終局
            if (history.length >= (P('move_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_MARKS_SPEC(`            // 大将石に金の兜印
            {
                ctx.save();
                Object.keys(st.big || {}).forEach(k => {
                    if (!st.big[k] || board[k] !== st.big[k]) return;
                    const i = Number(k);
                    const dx = i % BOARD_SIZE, dy = Math.floor(i / BOARD_SIZE);
                    const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                    ctx.strokeStyle = '#facc15';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.14, cy - cellSize * 0.30);
                    ctx.lineTo(cx, cy - cellSize * 0.46);
                    ctx.lineTo(cx + cellSize * 0.14, cy - cellSize * 0.30);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の大将まで ' + ((P('general_interval') || 5) - (history.filter(h => h.turn === turn).length % (P('general_interval') || 5))) + '手'`),
        [K.ONE, K.INFO_BASE, `            歩兵碁: 5手ごとの着手は大将石。大将は最初の捕獲を甲冑で1度耐える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各軍5手ごとの着手は金印の「大将石」になる (歩兵の隊列に将が混ざる)。',
            '大将は取られた時に甲冑で1度だけ持ちこたえて盤に残る (甲冑は砕けて通常石に)。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { big: {} };
        assert('起動', typeof st.big === 'object');
        // 黒の5手目を大将化 (交互着手なので9手プレイ)
        for (let i = 0; i < 9; i++) {
            executeMove({ cells: [{ x: i % 8, y: (i / 8) | 0 }] }, i % 2 === 0 ? 1 : 2);
        }
        assert('5手目の石が大将', st.big[BOARD_SIZE + 0] === 1);
        // 大将は最初の捕獲を耐える
        board.fill(0); st.big = {}; turn = 1; captures = { 1: 0, 2: 0 };
        board[2 * BOARD_SIZE + 2] = 2; st.big[2 * BOARD_SIZE + 2] = 2;
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1); // 最後の呼吸点を塞ぐ → (2,2)は取られるはずが大将で耐える
        assert('大将は捕獲を耐える', board[2 * BOARD_SIZE + 2] === 2);
        assert('甲冑は砕けた', !st.big[2 * BOARD_SIZE + 2]);
    `,
};
