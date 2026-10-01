// DELAYGO — 遅延碁: 着手は予約となり、2手後に盤面へ実体化する
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
    file: 'delaygo.html',
    en: 'DELAYGO',
    jp: '遅延碁',
    prefix: 'delaygo',
    desc: '着手は予約となり2手後に実体化する。先に埋まった場所の予約は消える。',
    kind: 'clock',
    icon: 'delaygo',
    spec: [
        ...K.rb('DELAYGO', '遅延碁', 'delaygo'),
        K.params([
            { key: 'delay_turns', label: '着弾までの遅延', min: 1, max: 5, def: 2, unit: '手' },
            { key: 'cap_pct', label: '打ち切り手数', min: 80, max: 150, def: 110, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...PERSIST('{ queue: [] }'),
        // 着手は盤に置かず予約キューへ (実体化は2手後)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            st.queue.push({ cells: move.cells.map(p => ({ x: p.x, y: p.y })), player, due: history.length + (P('delay_turns') || 2) });
            fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '予約', '#a5b4fc', 900);`],
        // 予約手は即座の捕獲を起こさない
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
            // 予約の実体化: 期日が来た予約を盤へ書き込み、衝突した予約は消える
            {
                const due = st.queue.filter(q => q.due <= history.length);
                st.queue = st.queue.filter(q => q.due > history.length);
                for (const q of due) {
                    let placed = false;
                    for (const c of q.cells) {
                        const i = c.y * BOARD_SIZE + c.x;
                        if (board[i] === 0) { board[i] = q.player; placed = true; fxGlow(i, '#a5b4fc', 600); }
                    }
                    if (placed) {
                        const foe = q.player === 1 ? 2 : 1;
                        const cap2 = getCapturedStones(board, foe);
                        // 全滅はさせない
                        if (cap2.length > 0 && cap2.length < board.filter(v => v === 1 || v === 2).length) {
                            cap2.forEach(idx => board[idx] = 0);
                            captures[q.player] += cap2.length;
                            soundManager.playCapture();
                        }
                        // 実体化時に呼吸点0なら未熟な予約として消える (全滅はさせない)
                        const self = getCapturedStones(board, q.player);
                        if (self.length > 0 && self.length < board.filter(v => v === 1 || v === 2).length) {
                            self.forEach(idx => board[idx] = 0);
                        }
                        cleanUpPieces();
                    }
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 110) / 100))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 予約マーカー: 未実体化の予約を菱形の影で表示
            st.queue.forEach(q => {
                q.cells.forEach(c => {
                    const i = c.y * BOARD_SIZE + c.x;
                    const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                    const r = cellSize * 0.22;
                    ctx.save();
                    ctx.strokeStyle = q.player === 1 ? 'rgba(96,165,250,0.9)' : 'rgba(244,114,182,0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                });
            });`),
        ...K.EVENT_CHIP_SPEC(`st.queue.length > 0 ? '予約 ' + st.queue.length + '件' : ''`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は「予約」となり盤には即座に現れない。2手後に実体化する (菱形の影が予約)。',
            '実体化の時点で埋まっている座標は消える。捕獲は実体化のタイミングで起こる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.queue = [];
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('予約は即座に置かれない', board[I(4, 4)] === 0);
        assert('予約がキューに入る', st.queue.length === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('2手後に実体化', board[I(4, 4)] === 1);
        assert('白の予約はまだ', board[I(5, 5)] === 0);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('白の予約も実体化', board[I(5, 5)] === 2);
    `,
};
