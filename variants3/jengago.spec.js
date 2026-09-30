// JENGAGO — 抜積碁: 「抜く」ボタンで自石を1個抜き取って+1目。抜いた結果、連が分断されると塔崩壊で負け
const K = require('../gen_kit.js');
module.exports = {
    file: 'jengago.html',
    en: 'JENGAGO',
    jp: '抜積碁',
    prefix: 'jengago',
    desc: '「抜く」で自石を1個回収して+1目。抜いて自軍の連が分断されると塔崩壊で負け。',
    kind: 'stone',
    icon: 'jengago',
    spec: [
        ...K.rb('JENGAGO', '抜積碁', 'jengago'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pullMode: false }; // 抜くモード`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pullMode: false };`],
        // 「抜く」ボタン (キーボード不要のonclick操作)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnPull" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm">
                抜く
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnPull = document.getElementById('btnPull');`],
        // 抜く処理: 自石を回収して+1目。連が分断されたら塔崩壊で負け
        [K.ONE, '        function updateUI() {',
`        // 抜積: 自石を抜き取る (1手として手番が回る)
        function jengaPull(idx) {
            if (gameOver || gamePhase !== 'playing') return;
            if (board[idx] !== turn) return;
            const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
            // 退避 (通常着手と同じスナップショット)
            history.push({
                board: [...board],
                pieces: pieces.map(pc => ({ ...pc, cells: pc.cells.map(p => ({ ...p })) })),
                captures: { ...captures },
                turn,
                consecutivePasses,
                prevBoard,
                lastMove,
                currentPieceType,
                pieceQueue: [...pieceQueue],
                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });
            prevBoard = [...board];
            lastMove = { player: turn, cells: [{ x, y }] };
            // 抜く前に、その石を除いた時の自軍連結を確認する
            board[idx] = 0;
            const ownNbs = getNeighbors(idx).filter(n => board[n] === turn);
            let collapsed = false;
            if (ownNbs.length >= 2) {
                // 抜いた石の周りの自石がそれでも互いに繋がっているか
                const reach = new Set([ownNbs[0]]);
                const stack = [ownNbs[0]];
                while (stack.length > 0) {
                    const c = stack.pop();
                    getNeighbors(c).forEach(n => {
                        if (!reach.has(n) && board[n] === turn && n !== idx) {
                            reach.add(n); stack.push(n);
                        }
                    });
                }
                collapsed = !ownNbs.every(n => reach.has(n));
            }
            captures[turn] += 1;
            cleanUpPieces();
            st.pullMode = false;
            if (collapsed) {
                captures[turn] -= 1;
                fxShake(8, 700);
                winByRule(turn === 1 ? 2 : 1, '塔が崩れた', '抜いた石で自軍の連が分断された');
                return;
            }
            fxBurst(idx, '#fbbf24', 8, 1.2);
            fxText(idx, '抜き取り +1', '#fbbf24', 1100);
            consecutivePasses = 0;
            turn = turn === 1 ? 2 : 1;
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }
            updateUI();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            saveState();
            if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
        }

        function updateUI() {`],
        // クリック処理: 抜くモードなら自石を抜く
        [K.ONE, `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);`,
`            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);
            const gx = Math.round(anchor.u), gy = Math.round(anchor.v);
            if (st.pullMode) {
                const pi = gy * BOARD_SIZE + gx;
                if (board[pi] === turn) jengaPull(pi);
                else { st.pullMode = false; render(); }
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnPull.addEventListener('click', () => {
            soundManager.playClick();
            st.pullMode = !st.pullMode;
            btnPull.textContent = st.pullMode ? 'キャンセル' : '抜く';
            render();
        });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.EVENT_CHIP_SPEC(`st.pullMode ? '抜く石を選んで' : '抜積可能'`),
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `

        function endGameByScore() {`],
        [K.ONE, K.INFO_ALGO, `            抜積碁: 「抜く」ボタンで自石を回収して+1目。連が分断されると塔崩壊で負け<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「抜く」ボタンを押して自分の石を選ぶと、その石を抜き取って+1目 (1手を消費)。',
            'ただし抜いた結果、周りの自石がバラバラに分断されると塔が崩れてその時点で負け。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof jengaPull === 'function');
        // 1つの石を抜く → +1
        board[3 * BOARD_SIZE + 3] = 1;
        jengaPull(3 * BOARD_SIZE + 3);
        assert('抜くと+1目', captures[1] === 1);
        assert('石が消える', board[3 * BOARD_SIZE + 3] === 0);
        assert('手番が回る', turn === 2);
        // 分断される抜き → 塔崩壊で負け
        board.fill(0); turn = 1; gameOver = false; gameResultData = null;
        board[2 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 4] = 1; board[2 * BOARD_SIZE + 3] = 1;
        jengaPull(2 * BOARD_SIZE + 3); // 橋の石を抜く → 左右が分断
        assert('塔が崩れて負け', gameOver === true);
    `,
};
