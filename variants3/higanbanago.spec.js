// HIGANBANAGO — 彼岸花碁: 6手ごとの着手は彼岸花。隣の敵石に毒を置き、毒石は連の呼吸を共有できない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'higanbanago.html',
    en: 'HIGANBANAGO',
    jp: '彼岸花碁',
    prefix: 'higanbanago',
    desc: '6手ごとの着手は彼岸花。隣の敵石に毒を置き、毒石は連の呼吸を共有できなくなる。',
    kind: 'stone',
    icon: 'higanbanago',
    spec: [
        ...K.rb('HIGANBANAGO', '彼岸花碁', 'higanbanago'),
        ...ST('{ hib: {}, poi: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 彼岸花碁: 6手ごとの着手は彼岸花。隣の敵石に毒を置く
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (history.length % 6 === 0) {
                    st.hib[mi] = 1;
                    getNeighbors(mi).forEach(n => {
                        if (board[n] === opponent) {
                            st.poi[n] = 1;
                            fxBurst(n, '#ef4444', 12);
                            fxText(n, '毒', '#dc2626', 1000);
                        }
                    });
                    fxGlow(mi, '#ef4444', 900);
                    fxText(mi, '彼岸花', '#f87171', 1000);
                }
                for (const k in st.hib) if (board[k] === 0 || board[k] === 3) delete st.hib[k];
                for (const k in st.poi) if (board[k] === 0 || board[k] === 3) delete st.poi[k];
            }

            turn = opponent;`],
        // 毒石は連を組めない (呼吸を共有しない): 取り判定・呼吸数の双方でBFS拡張を遮断
        [K.ONE, `                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }`,
`                            } else if (boardState[n] === player && !visited[n] && !st.poi[n] && !st.poi[curr]) {
                                visited[n] = true;
                                queue.push(n);
                            }`],
        [K.ONE, `                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }`,
`                    } else if (boardState[n] === player && !visited[n] && !st.poi[n] && !st.poi[curr]) {
                        visited[n] = true;
                        queue.push(n);
                    }`],
        // 彼岸花は紅い放射線、毒石は赤い斑点
        ...K.STONE_MARKS_SPEC(`            // 彼岸花: 紅の放射線。毒石は赤い毒斑
            {
                ctx.save();
                for (const k in st.hib) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(239,68,68,0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    for (let a = 0; a < 6; a++) {
                        const t = a / 6 * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx + Math.cos(t) * cellSize * 0.34, cy + Math.sin(t) * cellSize * 0.34);
                        ctx.stroke();
                    }
                }
                for (const k in st.poi) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(220,38,38,0.85)';
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.1, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            彼岸花碁: 6手ごとの着手は彼岸花。隣の敵石に毒 — 毒石は連の呼吸を共有できない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '全局で6の倍数の手に置かれた石は「彼岸花」になり、隣の敵石に毒を置く。',
            '毒を置かれた石は連と呼吸を共有できない — 単石として取られやすくなる。',
            '彼岸花手を敵連の真横に打てるよう布石する。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { hib: {}, poi: {} };
        board[I(4, 4)] = 2; board[I(4, 3)] = 2; // 白の2連
        history.length = 5;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 6手目 → 彼岸花。(4,4)に毒
        assert('6手目は彼岸花', st.hib[I(4, 5)] === 1);
        assert('隣の敵に毒がつく', st.poi[I(4, 4)] === 1);
        assert('隣でない敵に毒はつかない', st.poi[I(4, 3)] === undefined);
        // 毒石は連と呼吸を共有しない: (4,4)は単石として取られる
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // (4,4)の残り呼吸を塞ぐ → 単石で取れる
        assert('毒石は連を切られて取れる', board[I(4, 4)] === 0 && captures[1] === 1);
        assert('毒でない側の連は残る', board[I(4, 3)] === 2);
    `,
};
