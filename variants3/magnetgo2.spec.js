// MAGNETGO2 — 極性碁: 石は着手ごとにN/S交互の極を持つ。同極は反発(置けない)・異極は斜めで結合
const K = require('../gen_kit.js');
module.exports = {
    file: 'magnetgo2.html',
    en: 'MAGNETGO2',
    jp: '極性碁',
    prefix: 'magnetgo2',
    desc: '石は着手ごとに極性が反転。同極には近接できず、異極の斜めは磁力で結合する。',
    kind: 'stone',
    icon: 'magnetgo2',
    spec: [
        ...K.rb('MAGNETGO2', '極性碁', 'magnetgo2'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pol: {} }; // 極性 idx -> 0:S / 1:N
        function nextPol() { return (history.length + 1) & 1; }
        function nbr8(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0, r = [];
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) r.push(ny * BOARD_SIZE + nx);
            }
            return r;
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pol: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pol: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pol: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pol: {} };`],
        // 同極には反発して近接できない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                const ip = p.y * BOARD_SIZE + p.x, pol = nextPol();
                for (const n of nbr8(ip)) {
                    if ((board[n] === 1 || board[n] === 2) && st.pol[n] === pol) return false; // 同極反発
                }
            }`],
        // 異極の斜めは磁力で結合: getNeighbors に斜めリンクを追加
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 異極の斜め隣は磁力で繋がる (近傍扱い)
            const p0 = st.pol[idx];
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                const ni = ny * BOARD_SIZE + nx;
                if ((board[ni] === 1 || board[ni] === 2) && st.pol[ni] !== undefined && st.pol[ni] !== p0) neighbors.push(ni);
            });
            return neighbors;
        }`],
        // 石の極を記録 & 死石の極性を掃除
        [K.ONE, K.PIECES_PUSH, K.PIECES_PUSH + `
            move.cells.forEach(p => { st.pol[p.y * BOARD_SIZE + p.x] = history.length & 1; });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete st.pol[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 極性の描画: N=赤S=青の磁石マーク + 異極リンク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (const k in st.pol) {
                    const i = +k, x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (board[i] === 0) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = st.pol[i] ? '#ef4444' : '#3b82f6';
                    ctx.font = 'bold ' + Math.max(9, cellSize * 0.3) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(st.pol[i] ? 'N' : 'S', cx, cy);
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            極性碁: 石は着手ごとにN/S交互の極を持つ。同極の8近傍には置けず、異極の斜めは結合する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は着手ごとにN(赤)/S(青)の極が交互に付く。同極の石の8近傍には置けない (反発)。',
            '異極の斜め隣は磁力で結合して近傍扱い (呼吸・連・取りに影響)。',
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
        board.fill(0); pieces = []; st.pol = {}; captures = { 1: 0, 2: 0 }; history = [];
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        const pi = I(4, 4);
        assert('初手の極はN', st.pol[pi] === 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2);
        assert('2手目の極はS', st.pol[I(5, 4)] === 0);
        assert('同極には近接できない', isValidPlacement([{ x: 4, y: 3 }], 1) === false);
        assert('異極なら隣に置ける', isValidPlacement([{ x: 6, y: 4 }], 1) === true);
        board[I(3, 3)] = 1; st.pol[I(3, 3)] = 0;
        assert('異極の斜めは近傍扱い', getNeighbors(I(3, 3)).includes(pi));
    `,
};
