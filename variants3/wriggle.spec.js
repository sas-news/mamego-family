// WRIGGLE — 蠕動碁: 「蠕動」ボタンで自石を1マス匍匐移動できる (1手を消費)
const K = require('../gen_kit.js');
module.exports = {
    file: 'wriggle.html',
    en: 'WRIGGLE',
    jp: '蠕動碁',
    prefix: 'wriggle',
    desc: '「蠕動」で自石を1マス匍匐移動 (1手を消費)。移動でも通常の取りは発生する。',
    kind: 'stone',
    icon: 'wriggle',
    spec: [
        ...K.rb('WRIGGLE', '蠕動碁', 'wriggle'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { crawlMode: false, sel: -1 }; // 蠕動モードと選択石`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { crawlMode: false, sel: -1 };`],
        // 「蠕動」ボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnCrawl" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-emerald-500/50 text-emerald-600 rounded-xl hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm">
                蠕動
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnCrawl = document.getElementById('btnCrawl');`],
        // 蠕動移動: 自石を1マス動かす。移動先でも取りは発生する
        [K.ONE, '        function updateUI() {',
`        // 蠕動: 自石を1マス匍匐移動 (1手を消費)
        function wriggleMove(from, to) {
            if (gameOver || gamePhase !== 'playing') return;
            if (board[from] !== turn || board[to] !== 0) return;
            const player = turn, opponent = player === 1 ? 2 : 1;
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
            lastMove = { player, cells: [{ x: to % BOARD_SIZE, y: Math.floor(to / BOARD_SIZE) }] };
            board[from] = 0;
            board[to] = player;
            const pc = pieces.find(x => x.cells.some(c => c.y * BOARD_SIZE + c.x === from));
            if (pc) pc.cells = [{ x: to % BOARD_SIZE, y: Math.floor(to / BOARD_SIZE) }];
            fxSlide(from, to, 300);
            st.crawlMode = false;
            st.sel = -1;
            // 移動でも通常の取りは発生する
            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
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
        // クリック処理: 蠕動モードの石選択と移動
        [K.ONE, `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);`,
`            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);
            {
                const gx = Math.round(anchor.u), gy = Math.round(anchor.v);
                if (gx >= 0 && gx < BOARD_SIZE && gy >= 0 && gy < BOARD_SIZE) {
                    const ci = gy * BOARD_SIZE + gx;
                    if (st.crawlMode) {
                        if (st.sel < 0) {
                            if (board[ci] === turn) { st.sel = ci; render(); }
                            else { st.crawlMode = false; render(); }
                            return;
                        }
                        if (board[ci] === 0 && getNeighbors(st.sel).includes(ci)) {
                            wriggleMove(st.sel, ci);
                        } else if (board[ci] === turn) {
                            st.sel = ci; render();
                        } else {
                            st.crawlMode = false; st.sel = -1; render();
                        }
                        return;
                    }
                }
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnCrawl.addEventListener('click', () => {
            soundManager.playClick();
            st.crawlMode = !st.crawlMode;
            st.sel = -1;
            btnCrawl.textContent = st.crawlMode ? 'やめる' : '蠕動';
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
        // 選択中の石と移動先候補を示す
        ...K.STONE_MARKS_SPEC(`            if (st.crawlMode) {
                ctx.save();
                if (st.sel >= 0) {
                    const cx = padding + (st.sel % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(st.sel / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
                    getNeighbors(st.sel).forEach(n => {
                        if (board[n] !== 0) return;
                        ctx.beginPath();
                        ctx.arc(padding + (n % BOARD_SIZE) * cellSize, padding + Math.floor(n / BOARD_SIZE) * cellSize, cellSize * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.crawlMode ? (st.sel >= 0 ? '移動先を選んで' : '動かす石を選んで') : '蠕動可'`),
        [K.ONE, K.INFO_ALGO, `            蠕動碁: 「蠕動」ボタンで自石を1マス匍匐移動 (1手を消費)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「蠕動」ボタンを押し、自分の石を選んで隣の空点を選ぶと1マス匍匐移動する (1手を消費)。',
            '移動先でも通常の取りが発生する。形を維持しながら這い回ろう。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof wriggleMove === 'function');
        board[3 * BOARD_SIZE + 3] = 1;
        wriggleMove(3 * BOARD_SIZE + 3, 3 * BOARD_SIZE + 4);
        assert('石が1マス動く', board[3 * BOARD_SIZE + 4] === 1);
        assert('元の位置は空', board[3 * BOARD_SIZE + 3] === 0);
        assert('1手を消費', turn === 2);
        // 動けない条件: 移動先が空でない
        board.fill(0); turn = 1; gameOver = false;
        board[1 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 2;
        wriggleMove(1 * BOARD_SIZE + 1, 1 * BOARD_SIZE + 2);
        assert('埋まった先には動けない', board[1 * BOARD_SIZE + 2] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
