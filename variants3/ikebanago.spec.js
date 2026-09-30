// IKEBANAGO — 生花碁: 真(縦線上3連)・副(斜め3連)の構図を自石で完成させると得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'ikebanago.html',
    en: 'IKEBANAGO',
    jp: '生花碁',
    prefix: 'ikebanago',
    desc: '自石が縦3連(真)または斜め3連(副)を完成させると構図点。先に4点で生花勝ち。',
    kind: 'stone',
    icon: 'ikebanago',
    spec: [
        ...K.rb('IKEBANAGO', '生花碁', 'ikebanago'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { comp: { 1: 0, 2: 0 } }; // 構図点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { comp: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { comp: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { comp: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { comp: { 1: 0, 2: 0 } };`],
        // 構図判定: 新規の3連 (縦 or 斜め) を数える
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function ikebanaRuns(player) {
            const dirs = [[0, -1], [-1, -1], [1, -1]]; // 真(縦)・副(斜め2方向)
            const runs = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== player) continue;
                    for (const [dx, dy] of dirs) {
                        const x1 = x + dx, y1 = y + dy, x2 = x + dx * 2, y2 = y + dy * 2;
                        if (x2 < 0 || y2 < 0 || x2 >= BOARD_SIZE || y2 >= BOARD_SIZE) continue;
                        if (board[y1 * BOARD_SIZE + x1] === player && board[y2 * BOARD_SIZE + x2] === player) {
                            runs.push([y2 * BOARD_SIZE + x2, y1 * BOARD_SIZE + x1, y * BOARD_SIZE + x]);
                        }
                    }
                }
            }
            return runs;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 生花判定: 打った石を含む3連があれば構図点+1 (同じ3連は一度だけ)
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const runs = ikebanaRuns(player).filter(r => r.includes(li));
                if (runs.length > 0) {
                    st.comp[player]++;
                    runs[0].forEach(i => fxGlow(i, '#f9a8d4', 800));
                    fxText(li, '生花!', '#f9a8d4', 1100);
                    if (st.comp[player] >= 4) {
                        winByRule(player, '生花勝ち', '構図を4つ完成させました'); return;
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.EVENT_CHIP_SPEC(`'構図 ' + st.comp[1] + '-' + st.comp[2]`),
        [K.ONE, K.INFO_ALGO, `            生花碁: 縦3連(真)・斜め3連(副)を作ると構図点。4点で生花勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が縦の3連 (真) か斜めの3連 (副) を新たに完成させるたびに構図点+1。先に4点で生花勝ち。',
            '横の3連は数えない — 生け花は上へ伸びる構図。花材(石)は普通に取られる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { comp: { 1: 0, 2: 0 } };
        board[4 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1); // 縦3連完成
        assert('真の構図で得点', st.comp[1] === 1);
        board[7 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 8 }] }, 1); // 4連の中央延長でも新3連
        assert('延長でも構図点', st.comp[1] === 2);
        // 斜め3連
        board.fill(0); st.comp = { 1: 0, 2: 0 }; gameOver = false;
        board[2 * BOARD_SIZE + 2] = 1; board[3 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('副の構図で得点', st.comp[1] === 1);
        st.comp[1] = 3;
        board[6 * BOARD_SIZE + 6] = 1; board[7 * BOARD_SIZE + 7] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        assert('4点で生花勝ち', gameOver === true && gameResultData && gameResultData.title.includes('生花'));
    `,
};
