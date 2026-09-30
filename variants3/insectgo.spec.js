// INSECTGO — 昆虫碁: 石は幼虫→蛹→成虫と変態する。成虫は囲まれても一度だけ飛び去って耐える
const K = require('../gen_kit.js');
module.exports = {
    file: 'insectgo.html',
    en: 'INSECTGO',
    jp: '昆虫碁',
    prefix: 'insectgo',
    desc: '石は打ってから3手で蛹、6手で成虫に変態。成虫は捕獲時に一度だけ2マス先へ飛んで逃げる。',
    kind: 'stone',
    icon: 'insectgo',
    spec: [
        ...K.rb('INSECTGO', '昆虫碁', 'insectgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { born: {} }; // idx→打たれた手数 (変態段階の判定用)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { born: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { born: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { born: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { born: {} };`],
        // 変態段階: 0=幼虫 1=蛹 2=成虫
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function insectStage(i) {
            const b = st.born[i];
            if (b === undefined) return 0;
            const age = history.length - b;
            return age >= 6 ? 2 : age >= 3 ? 1 : 0;
        }
        function pruneBorn() {
            for (const k in st.born) if (board[k] === 0 || board[k] === 3) delete st.born[k];
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 捕獲: 成虫は一度だけ2マス先へ飛んで逃げる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const dirOrder = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const still = [];
                captured.forEach(i => {
                    if (insectStage(i) === 2) {
                        // 成虫は飛び去る: 2マス先の空きへ
                        const ix = i % BOARD_SIZE, iy = Math.floor(i / BOARD_SIZE);
                        for (const [dx, dy] of dirOrder) {
                            const nx = ix + dx * 2, ny = iy + dy * 2;
                            if (nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE
                                && board[ny * BOARD_SIZE + nx] === 0) {
                                board[i] = 0;
                                board[ny * BOARD_SIZE + nx] = opponent;
                                delete st.born[i];
                                st.born[ny * BOARD_SIZE + nx] = history.length;
                                fxSlide(i, ny * BOARD_SIZE + nx, 380);
                                fxText(ny * BOARD_SIZE + nx, '飛翔!', '#fbbf24', 1000);
                                return;
                            }
                        }
                    }
                    still.push(i);
                });
                still.forEach(i => { board[i] = 0; delete st.born[i]; });
                captures[player] += still.length;
                if (still.length > 0) {
                    fxShake(Math.min(6, still.length), 300);
                }
                cleanUpPieces();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 誕生登録: 打った石の齢を記録し、取られた石の齢を掃除
            st.born[move.cells[0].y * BOARD_SIZE + move.cells[0].x] = history.length;
            pruneBorn();

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 変態段階の描画: 蛹は楕円、成虫は翅
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const stage = insectStage(i);
                if (stage === 0) continue;
                const mx = i % BOARD_SIZE, my = Math.floor(i / BOARD_SIZE);
                const cx = padding + mx * cellSize, cy = padding + my * cellSize;
                if (stage === 1) {
                // 蛹: 縦の楕円
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.ellipse(cx, cy, cellSize * 0.16, cellSize * 0.26, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (stage === 2) {
                // 成虫: 翅
                ctx.save();
                ctx.strokeStyle = 'rgba(251,191,36,0.9)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(cx - cellSize * 0.12, cy - cellSize * 0.14, cellSize * 0.14, 0, Math.PI * 2);
                ctx.arc(cx + cellSize * 0.12, cy - cellSize * 0.14, cellSize * 0.14, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            昆虫碁: 石は3手で蛹、6手で成虫に変態。成虫は捕獲時に一度だけ2マス先へ飛ぶ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '打った石は齢とともに変態する: 3手で蛹 (楕円)、6手で成虫 (翅)。',
            '成虫が捕獲されると一度だけ上下左右の2マス先の空きへ飛び去って耐える (齢はリセット)。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { born: {} };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 2);
        assert('齢が登録される', st.born[2 * BOARD_SIZE + 2] === 1);
        for (let i = 0; i < 6; i++) history.push({ turn: 1 });
        assert('6手齢で成虫', insectStage(2 * BOARD_SIZE + 2) === 2);
        // 成虫を囲む → 2マス先へ飛んで逃げる
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('成虫は飛んで逃げた', board[0 * BOARD_SIZE + 2] === 2 && captures[1] === 0);
    `,
};
