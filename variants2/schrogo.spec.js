// SCHROGO — 量子碁: 3手ごとの石は量子石。敵石が隣接で「観測」され、どちらの色かに確定する
const K = require('../gen_kit.js');
module.exports = {
    file: 'schrogo.html',
    en: 'SCHROGO',
    jp: '量子碁',
    prefix: 'schrogo',
    desc: '3手ごとの石は量子の重ね合わせ。隣接で観測され色が確定する。',
    kind: 'quantum',
    spec: [
        ...K.rb('SCHROGO', '量子碁', 'schrogo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 } }; // 量子碁: 各側の着手数 (3手ごとに量子石)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, '        function executeMove(move, player) {',
`        // 量子碁: 量子石が観測 (敵石隣接) されたとき確定する色を決める
        function schroOutcome(pc, idx) { return ((idx + (pc.at || 0) + history.length) % 2 === 0) ? pc.player : (pc.player === 1 ? 2 : 1); }

        function executeMove(move, player) {`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                schro: st.pcnt[player] % 3 === 0
            });`],
        // 量子石は敵石が隣接した瞬間に観測されて確定する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            // 量子碁: 量子石の隣に敵石が置かれると観測 → 色が確定する
            {
                pieces.forEach(pc => {
                    if (!pc.schro) return;
                    const i0 = pc.cells[0].y * BOARD_SIZE + pc.cells[0].x;
                    if (board[i0] === 0) { pc.schro = false; return; }
                    const foe = pc.player === 1 ? 2 : 1;
                    if (!getNeighbors(i0).some(n => board[n] === foe)) return;
                    const newOwner = schroOutcome(pc, i0);
                    board[i0] = newOwner;
                    pc.player = newOwner;
                    pc.schro = false;
                });
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 量子石に白黒の重ね合わせ輪 (半円ずつ二色)
            {
                ctx.save();
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                pieces.forEach(pc => {
                    if (!pc.schro) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.40, Math.PI * 0.5, Math.PI * 1.5);
                        ctx.stroke();
                        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.40, -Math.PI * 0.5, Math.PI * 0.5);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const q = pieces.filter(pc => pc.schro).length; return q > 0 ? '量子石 ' + q + '個' : '量子まで ' + (3 - st.pcnt[turn] % 3) + '手'; })()`),
        [K.ONE, K.INFO_ALGO, `            量子碁: 3手ごとの石は白黒の重ね合わせ。敵石が隣接すると観測され色が確定する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの3・6・9…手目の着手は「量子石」— 白黒の輪を持つ重ね合わせの石。',
            '敵石が直交隣に置かれると観測され、量子石は自分色か敵色かに確定する。',
            '確定で敵色になれば自分の布石が相手の石に化ける。量子石同士の連鎖にも注意。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.pcnt = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒3手目 → 量子石
        const q = pieces[pieces.length - 1];
        assert('3手目は量子石', q.schro === true);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 隣に敵石 → 観測
        assert('観測で確定', q.schro === false);
        assert('確定後は盤上に残る', board[4 * BOARD_SIZE + 4] === 1 || board[4 * BOARD_SIZE + 4] === 2);
        assert('確定色は schroOutcome と一致', board[4 * BOARD_SIZE + 4] === q.player);
    `,
};
