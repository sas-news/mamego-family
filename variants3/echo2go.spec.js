// ECHO2GO — 残響碁: 自分の前回の手の座標は残響となり、次の自分の番では着手不可
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
    file: 'echo2go.html',
    en: 'ECHOGO',
    jp: '残響碁',
    prefix: 'echo2go',
    desc: '自分の直前の手の座標が残響になり、次の自分の番では着手できない。',
    kind: 'weather',
    icon: 'echo2go',
    spec: [
        ...K.rb('ECHOGO', '残響碁', 'echo2go'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 4, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...PERSIST('{ echo: { 1: null, 2: null } }'),
        // 残響座標は自分の番では着手不可 (取った後の空点にも残響は残る)
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (st.echo[player] === p.y * BOARD_SIZE + p.x) return false; // 残響座標は不可
            }`],
        // 着手記録: そのプレイヤーの残響座標を更新
        [K.ONE, K.PIECES_PUSH, `            st.echo[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 残響: 各プレイヤーの直前着手座標に音波リングを表示
            [1, 2].forEach(pl => {
                const e = st.echo[pl];
                if (e == null || board[e] !== 0) return; // 石がある座標は対象外 (次回解禁済み)
                const x = e % BOARD_SIZE, y = Math.floor(e / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                const col = pl === 1 ? 'rgba(56,189,248,' : 'rgba(244,114,182,';
                const cur = turn === pl;
                ctx.save();
                ctx.strokeStyle = col + (cur ? '0.8)' : '0.35)');
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                [0.18, 0.30].forEach(rr => {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * rr, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`st.echo[turn] != null && board[st.echo[turn]] === 0 ? '残響あり' : ''`),
        [K.ONE, K.RV_ALGO, K.rv([
            '残響: 自分が直前に置いた座標は残響となり、次の自分の番ではそこに着手できない。',
            '残響は空点にだけ表示される。同じ場所を連続で使えないので、布石を散らそう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.echo = { 1: null, 2: null };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('着手座標が残響に記録される', st.echo[1] === I(4, 4));
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        // 石を置いた座標自体にはそもそも置けないので、取られた後をシミュレート
        board[I(4, 4)] = 0;
        assert('残響座標は黒番で着手不可', isValidPlacement([{ x: 4, y: 4 }], 1) === false);
        assert('残響は白には効かない', isValidPlacement([{ x: 4, y: 4 }], 2) === true);
        assert('他の場所は普通に置ける', isValidPlacement([{ x: 7, y: 7 }], 1) === true);
    `,
};
