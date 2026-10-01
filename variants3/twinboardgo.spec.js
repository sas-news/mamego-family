// TWINBOARDGO — 双盤碁: 表盤と裏盤。「盤反転」で手番を使い2つの盤を入れ替える。
// 地は両盤の合計で数える。
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'twinboardgo.html',
    en: 'TWINBOARDGO',
    jp: '双盤碁',
    prefix: 'twinboardgo',
    desc: '表盤と裏盤の2枚の盤。「盤反転」で入れ替わり、地は両盤の合計。',
    kind: 'stone',
    icon: 'twinboardgo',
    spec: [
        ...K.rb('TWINBOARDGO', '双盤碁', 'twinboardgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        // 裏盤状態 (board は常に表盤)
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let boardB = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 裏盤
        let piecesB = []; // 裏盤側の着手履歴 (描画用)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            boardB = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            piecesB = [];`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                boardB: [...boardB],
                piecesB: piecesB.map(pc => ({ ...pc, cells: pc.cells.map(p => ({ ...p })) })),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.boardB) boardB = snap.boardB;
            if (snap.piecesB) piecesB = snap.piecesB;`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    boardB,
                    piecesB,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            if (s.boardB) boardB = s.boardB;
            if (s.piecesB) piecesB = s.piecesB;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                boardB,
                piecesB,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            if (data.boardB) boardB = data.boardB;
            if (data.piecesB) piecesB = data.piecesB;`],
        // 「盤反転」ボタン (手番を1つ消費して表裏を入れ替える)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnFlipBoard" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-indigo-500/50 text-indigo-500 rounded-xl hover:bg-indigo-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                盤反転
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnFlipBoard = document.getElementById('btnFlipBoard');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnFlipBoard.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            // 盤反転: 表裏を入れ替えて手番を相手に渡す (1手消費)
            [board, boardB] = [boardB, board];
            [pieces, piecesB] = [piecesB, pieces];
            lastMove = null;
            previewPos = null;
            deadStones.clear();
            prevBoard = null; // 反転でコウ制限は解除
            consecutivePasses = 0;
            fxShake(5, 320);
            fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '反転!', '#818cf8', 900);
            turn = turn === 1 ? 2 : 1;
            updateUI();
            if (gameMode === 'online' && onlineRoomId) syncOnlineState();
            saveState();
            if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
        });`],
        // 採点は両盤の地の合計
        [K.ONE, `            const territory = calculateTerritory();`,
`            const _tA = calculateTerritory();
            const _tmp = board; board = boardB;
            const _tB = calculateTerritory();
            board = _tmp;
            const territory = { black: _tA.black + _tB.black, white: _tA.white + _tB.white };`],
        // 裏盤のプレビューを薄く表示 (右上インセット)
        K.CUE_STARS(`            // 裏盤の影: 右上に裏盤のミニプレビュー
            {
                const bw = cellSize * 2.6, pad2 = 8;
                const ox = padding + (BOARD_SIZE - 1) * cellSize - bw - pad2;
                const oy = padding - bw - pad2 - cellSize * 0.6;
                ctx.save();
                ctx.globalAlpha = 0.75;
                ctx.fillStyle = 'rgba(30, 27, 24, 0.8)';
                ctx.fillRect(ox - 2, oy - 2, bw + 4, bw + 4);
                ctx.strokeStyle = '#a8a29e';
                ctx.lineWidth = 1;
                ctx.strokeRect(ox - 2, oy - 2, bw + 4, bw + 4);
                const cs2 = bw / Math.max(1, BOARD_SIZE - 1);
                ctx.strokeStyle = 'rgba(214, 211, 209, 0.4)';
                for (let i = 0; i < BOARD_SIZE; i++) {
                    ctx.beginPath(); ctx.moveTo(ox + i * cs2, oy); ctx.lineTo(ox + i * cs2, oy + bw); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, oy + i * cs2); ctx.lineTo(ox + bw, oy + i * cs2); ctx.stroke();
                }
                for (let i = 0; i < boardB.length; i++) {
                    if (boardB[i] !== 1 && boardB[i] !== 2) continue;
                    ctx.fillStyle = boardB[i] === 1 ? '#1c1917' : '#fef3c7';
                    ctx.beginPath();
                    ctx.arc(ox + (i % BOARD_SIZE) * cs2, oy + Math.floor(i / BOARD_SIZE) * cs2, cs2 * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#a8a29e';
                ctx.font = Math.max(8, cellSize * 0.32) + 'px sans-serif';
                ctx.fillText('裏盤', ox, oy - 4);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            双盤碁: 表盤と裏盤の2枚の盤。「盤反転」で入れ替わる (1手消費)<br>
            PC: クリックで配置 / 「盤反転」ボタンで盤交換<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '2枚の盤 (表・裏) が重なっている。着手は常に表盤に置く。',
            '「盤反転」ボタンは1手消費して表盤と裏盤を丸ごと入れ替える。',
            '採点は両盤の地の合計。不利な盤を裏に隠すか、反転を読んで裏に布石するか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); boardB.fill(0); pieces = []; piecesB = [];
        history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('表盤に石', board[3 * BOARD_SIZE + 3] === 1);
        assert('裏盤は空', boardB[3 * BOARD_SIZE + 3] === 0);
        // 反転
        [board, boardB] = [boardB, board]; [pieces, piecesB] = [piecesB, pieces];
        assert('反転で石は裏盤へ', boardB[3 * BOARD_SIZE + 3] === 1 && board[3 * BOARD_SIZE + 3] === 0);
        [board, boardB] = [boardB, board]; [pieces, piecesB] = [piecesB, pieces];
        assert('再反転で戻る', board[3 * BOARD_SIZE + 3] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
