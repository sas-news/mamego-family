// WISTERIAGO — 藤碁: 星の点に置いた石は藤の棚。自分の手番ごとに下へ花房が1つ垂れる (各棚3房まで)
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
    file: 'wisteriago.html',
    en: 'WISTERIAGO',
    jp: '藤碁',
    prefix: 'wisteriago',
    desc: '星の点に置いた石は藤の棚。自分の手番ごとに真下へ花房が1つ垂れる (各棚3房まで)。',
    kind: 'stone',
    icon: 'wisteriago',
    spec: [
        ...K.rb('WISTERIAGO', '藤碁', 'wisteriago'),
        ...ST('{ vine: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 藤碁: 星の棚は自分の手番ごとに真下へ花房を1つ垂らす (各棚3房まで)
            {
                const SP = (getStarPoints(BOARD_SIZE).length ? getStarPoints(BOARD_SIZE)
                    : [{x:2,y:2},{x:6,y:2},{x:2,y:6},{x:6,y:6},{x:4,y:4}]).map(p => p.y * BOARD_SIZE + p.x);
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                for (const k in st.vine) {
                    const vi = +k, vc = st.vine[k];
                    if (board[vi] !== player || vc.flo >= 3) continue;
                    const vx = vi % BOARD_SIZE;
                    for (let y = (vi / BOARD_SIZE | 0) + 1; y < BOARD_SIZE; y++) {
                        const cand = y * BOARD_SIZE + vx;
                        if (board[cand] !== 0) break;
                        if (!isValidPlacement([{ x: vx, y }], player)) continue;
                        board[cand] = player;
                        // 花房が敵連の最後の呼吸を埋める場合は垂れない
                        const safe = getNeighbors(cand).every(n =>
                            board[n] !== opponent || getLiberties(board, n).length > 0);
                        if (safe) {
                            pieces.push({ id: Date.now() + Math.random(), player, type: 'STONE', rot: 0, cells: [{ x: vx, y }] });
                            vc.flo++;
                            fxBurst(cand, '#c084fc', 10);
                            fxText(cand, '花房', '#a855f7', 900);
                            break;
                        }
                        board[cand] = 0;
                        break;
                    }
                }
                if (!st.vine[mi] && SP.includes(mi)) {
                    st.vine[mi] = { flo: 0 };
                    fxText(mi, '棚', '#c084fc', 900);
                }
                for (const k in st.vine) if (board[k] === 0 || board[k] === 3) delete st.vine[k];
            }

            turn = opponent;`],
        // 棚の石は藤色の横筋
        ...K.STONE_MARKS_SPEC(`            // 藤棚: 星の棚石に藤色の垂れ線
            {
                ctx.save();
                for (const k in st.vine) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(192,132,252,0.9)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.22, cy); ctx.lineTo(cx + cellSize * 0.22, cy);
                    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cellSize * 0.3);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            藤碁: 星の点の石は藤の棚。自分の手番ごとに真下へ花房が1つ垂れる (各棚3房)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点に置いた石は「藤棚」になり、自分の手番ごとに真下へ花房 (自分の石) が1つ垂れる。',
            '各棚3房まで。棚を取れば垂れるのは止まる。',
            '垂れ下がる花房で下の地を絡め取る。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { vine: {} };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 星 → 棚
        assert('星の石は棚になる', st.vine[I(3, 3)] !== undefined);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 2); // 星でない
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒の手番 → 下に花房
        assert('花房が垂れる', board[I(3, 4)] === 1);
        assert('通常石は棚でない', st.vine[I(10, 10)] === undefined);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
