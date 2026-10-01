// TAKEYABUGO — 竹藪碁: 孤立して置いた竹は地下茎を伸ばし、自分の手番ごとに周囲8方向へ筍を1本出す (各竹1本)
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
    file: 'takeyabugo.html',
    en: 'TAKEYABUGO',
    jp: '竹藪碁',
    prefix: 'takeyabugo',
    desc: '孤立して置いた竹は地下茎を伸ばし、自分の手番に周囲8方向へ筍を1本出す (各竹1本まで)。',
    kind: 'stone',
    icon: 'takeyabugo',
    spec: [
        ...K.rb('TAKEYABUGO', '竹藪碁', 'takeyabugo'),
        K.params([
            { key: 'bamboo_shots', label: '竹1本の筍の回数', min: 1, max: 4, def: 1, unit: '回' },
        ]),
        ...ST('{ bamboo: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 竹藪碁: 竹は自分の手番ごとに周囲8方向へ筍を1本出す (各竹1本まで)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                for (const k in st.bamboo) {
                    const bi = +k, bc = st.bamboo[k];
                    if (board[bi] !== player || bc.shot) continue; // bc.shot=筍を出し切った
                    const bx = bi % BOARD_SIZE, by = (bi / BOARD_SIZE) | 0;
                    for (let dy = -1; dy <= 1 && !bc.shot; dy++) for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const nx = bx + dx, ny = by + dy;
                        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue;
                        const cand = ny * BOARD_SIZE + nx;
                        if (board[cand] !== 0) continue;
                        if (!isValidPlacement([{ x: nx, y: ny }], player)) continue;
                        board[cand] = player;
                        // 筍が敵連の最後の呼吸を埋める場合は出ない
                        const safe = getNeighbors(cand).every(n =>
                            board[n] !== opponent || getLiberties(board, n).length > 0);
                        if (safe) {
                            pieces.push({ id: Date.now() + Math.random(), player, type: 'STONE', rot: 0, cells: [{ x: nx, y: ny }] });
                            bc.shots = (bc.shots || 0) + 1;
                            bc.shot = bc.shots >= (P('bamboo_shots') || 1);
                            fxBurst(cand, '#4ade80', 10);
                            fxText(cand, '筍', '#22c55e', 900);
                            break;
                        }
                        board[cand] = 0;
                    }
                }
                // 孤立して置いた石は竹になる (筍は次の手番から)
                if (!st.bamboo[mi] && getNeighbors(mi).every(n => board[n] !== player)) {
                    st.bamboo[mi] = { shot: false };
                    fxText(mi, '竹', '#4ade80', 900);
                }
                for (const k in st.bamboo) if (board[k] === 0 || board[k] === 3) delete st.bamboo[k];
            }

            turn = opponent;`],
        // 竹は緑の節線
        ...K.STONE_MARKS_SPEC(`            // 竹: 竹の石に緑の縦節線
            {
                ctx.save();
                for (const k in st.bamboo) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(74,222,128,0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.28); ctx.lineTo(cx, cy + cellSize * 0.28);
                    ctx.moveTo(cx - cellSize * 0.12, cy - cellSize * 0.1); ctx.lineTo(cx + cellSize * 0.12, cy - cellSize * 0.1);
                    ctx.moveTo(cx - cellSize * 0.12, cy + cellSize * 0.1); ctx.lineTo(cx + cellSize * 0.12, cy + cellSize * 0.1);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            竹藪碁: 孤立して置いた竹は自分の手番に周囲8方向へ筍を1本出す (各竹1本)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方と隣接しない場所に置いた石は「竹」になり、自分の手番ごとに周囲8方向の空点へ筍 (自分の石) を1本出す。',
            '筍は斜めにも出る — 藪は疎に広がる。各竹1本まで。',
            '竹を取れば地下茎は枯れる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { bamboo: {} };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 孤立 → 竹
        assert('孤立石は竹になる', st.bamboo[I(4, 4)] !== undefined);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        const before = board.filter(v => v === 1).length;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒の手番 → 筍
        assert('筍が出る', board.filter(v => v === 1).length === before + 2);
        assert('竹は1本しか出さない', st.bamboo[I(4, 4)].shot === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
