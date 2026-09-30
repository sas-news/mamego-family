// SLIMEGO — 粘体碁: 取られた石は跡に粘液を残し、相手は次の1手だけそのマスに置けない
const K = require('../gen_kit.js');
module.exports = {
    file: 'slimego.html',
    en: 'SLIMEGO',
    jp: '粘体碁',
    prefix: 'slimego',
    desc: '取られた石の跡は粘液になり、相手は次の1手だけ置けない。',
    kind: 'stone',
    icon: 'slimego',
    spec: [
        ...K.rb('SLIMEGO', '粘体碁', 'slimego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { slime: {} }; // 粘液マス idx -> 残り手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { slime: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { slime: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { slime: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { slime: {} };`],
        // 粘液マスには置けない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (st.slime[p.y * BOARD_SIZE + p.x] > 0) return false; // 粘液は乾くまで置けない
            }`],
        // 取った石は粘液を残す
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; st.slime[idx] = 2; fxSplash(idx, '#4ade80', 6); });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 手番ごとに粘液が乾いていく
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            for (const k in st.slime) { if (--st.slime[k] <= 0) delete st.slime[k]; }
            turn = opponent;`],
        // 粘液の描画: 緑の半透明ブロブ
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.slime) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(74,222,128,0.38)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.arc(cx - cellSize * 0.16, cy + cellSize * 0.10, cellSize * 0.16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.08, cy - cellSize * 0.09, cellSize * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            粘体碁: 取られた石の跡は粘液になり、相手は次の1手だけそのマスに置けない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石は粘液を残す。粘液は相手の次の1手だけそのマスを塞ぐ (緑のブロブ)。',
            '取った直後に同じ場所へ打ち返す「打ち返し」が1手遅れる。コウに似た間引き効果。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
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
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; st.slime = {}; captures = { 1: 0, 2: 0 };
        board[I(1, 0)] = 1; board[I(0, 1)] = 1; board[I(2, 1)] = 1;
        board[I(1, 1)] = 2;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        assert('白は取られた', board[I(1, 1)] === 0 && captures[1] === 1);
        assert('粘液が残る', st.slime[I(1, 1)] >= 1);
        assert('粘液には置けない', isValidPlacement([{ x: 1, y: 1 }], 2) === false);
        assert('他の点は置ける', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
