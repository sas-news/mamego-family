// SPLITTURNGO — 分掌碁: 手番は「配置フェーズ」と「除去フェーズ」が交互に巡る
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

module.exports = {
    file: 'splitturngo.html',
    en: 'SPLITTURNGO',
    jp: '分掌碁',
    prefix: 'splitturngo',
    desc: '手番は2段構え: 配置フェーズと除去フェーズ (敵石1個除去) が交互。',
    kind: 'mirror',
    icon: 'splitturngo',
    spec: [
        ...K.rb('SPLITTURNGO', '分掌碁', 'splitturngo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2, def: 1.1, step: 0.1, hint: '交点数の倍率' },
        ]),
        ...PERSIST('{ phase: { 1: "place", 2: "place" } }'),
        // 除去フェーズ中は敵石の座標だけが合法手
        [K.ONE, K.VALID_BOUNDS, `            if (st.phase[player] === 'remove') {
                // 除去手番: 敵石の上を指して1個取り除く
                const t0 = cells[0];
                if (!t0 || cells.length !== 1) return false;
                const ti = t0.y * BOARD_SIZE + t0.x;
                if (t0.x < 0 || t0.x >= BOARD_SIZE || t0.y < 0 || t0.y >= BOARD_SIZE) return false;
                if (board[ti] !== (player === 1 ? 2 : 1)) return false;
                // 盤上最後の石は除去できない (全滅防止)
                if (board.filter(v => v === 1 || v === 2).length <= 1) return false;
                return true;
            }
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }`],
        // パスも自分のフェーズを1段進める
        [K.ONE, K.PASS_INC, `            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            st.phase[turn] = st.phase[turn] === 'place' ? 'remove' : 'place';`],
        // 除去フェーズの実行: 石を置かず敵石1個を除去して終了
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            if (st.phase[player] === 'remove') {
                const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                board[ti] = 0;
                captures[player] += 1;
                fxBurst(ti, '#f87171', 10, 1.4);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 分掌: 各プレイヤーの手番ごとに 配置→除去→配置… とフェーズが往復する
            st.phase[player] = st.phase[player] === 'place' ? 'remove' : 'place';

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 除去フェーズ: 敵石に赤い除去マークを表示
            if (st.phase[turn] === 'remove') {
                const foe = turn === 1 ? 2 : 1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== foe) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(239,68,68,0.85)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    const r = cellSize * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
                    ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`st.phase[turn] === 'place' ? '配置番' : '除去番'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '手番は交互の2段構え: 配置フェーズ (通常着手) → 除去フェーズ (敵石を1個除去)。',
            '除去番は相手の石を直接指す。通常の取り (呼吸点ゼロ) も有効 — 両方を組み合わせて攻める。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.phase = { 1: 'place', 2: 'place' };
        board[I(3, 3)] = 1; // 白番の除去番が指せる敵石 (黒)
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒の1番目は配置番
        assert('配置後は黒が除去番', st.phase[1] === 'remove');
        assert('白の1番目は配置番', st.phase[2] === 'place');
        executeMove({ cells: [{ x: 6, y: 0 }] }, 2); // 白の1番目は配置番
        assert('白の2番目は除去番', st.phase[2] === 'remove');
        assert('除去番は空点に置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        assert('除去番は敵石を指せる', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2); // 白の2番目は除去番
        assert('敵石が除去される', board[I(3, 3)] === 0);
        assert('除去はアゲハマになる', captures[2] === 1);
        assert('次は白が配置番', st.phase[2] === 'place');
    `,
};
