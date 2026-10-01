// ITEMGO — 道具碁: 5手ごとに盤上へアイテム出現。隣接または直上に置いた側が拾ってアゲハマ+1
const K = require('../gen_kit.js');
module.exports = {
    file: 'itemgo.html',
    en: 'ITEMGO',
    jp: '道具碁',
    prefix: 'itemgo',
    desc: '5手ごとに盤上へアイテム出現。隣に置けば拾って+1目。',
    kind: 'item',
    spec: [
        ...K.rb('ITEMGO', '道具碁', 'itemgo'),
        K.params([
            { key: 'item_interval', label: 'アイテム出現間隔', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'pickup_dist', label: '拾得範囲', min: 0, max: 3, def: 1, hint: 'アイテムからの距離 (0は直上のみ)' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { item: -1 }; // 道具碁: 盤上のアイテム位置 (idx, -1=なし)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { item: -1 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { item: -1 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { item: -1 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { item: -1 };`],
        // 5手ごとに空点へアイテム出現。アイテムの1マス以内への着手で拾得 (+1アゲハマ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 道具碁: アイテムの近くに置いたら拾得 — アゲハマ+1 (範囲は設定で調整)
            if (st.item >= 0) {
                const ic = move.cells[0];
                if (Math.max(Math.abs(ic.x - st.item % BOARD_SIZE), Math.abs(ic.y - Math.floor(st.item / BOARD_SIZE))) <= (P('pickup_dist') ?? 1)) {
                    captures[player] += 1;
                    // 拾得: 金の飛沫と +1目
                    fxBurst(st.item, '#facc15', 12, 1.7);
                    fxGlow(st.item, '#fde047', 650);
                    fxText(st.item, '+1目', '#fde047', 1000);
                    st.item = -1;
                }
            }
            // 一定手数ごとに空点へ新アイテムを出現させる (間隔は設定で調整)
            if (st.item < 0 && history.length % Math.max(1, P('item_interval') || 5) === 0) {
                const seed = (history.length * 11 + 7) % (BOARD_SIZE * BOARD_SIZE);
                for (let k = 0; k < board.length; k++) {
                    const j = (seed + k) % board.length;
                    if (board[j] === 0) { st.item = j; break; }
                }
                // アイテム出現のキラリ
                if (st.item >= 0) {
                    fxGlow(st.item, '#facc15', 900);
                    fxBurst(st.item, '#fde047', 8, 1.2);
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // アイテム: 金色の★を点滅表示
            if (st.item >= 0) {
                const ix = st.item % BOARD_SIZE, iy = Math.floor(st.item / BOARD_SIZE);
                const cx = padding + ix * cellSize, cy = padding + iy * cellSize;
                ctx.save();
                ctx.fillStyle = '#facc15';
                ctx.strokeStyle = '#a16207';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                const R = cellSize * 0.34, r2 = cellSize * 0.15;
                ctx.beginPath();
                for (let k = 0; k < 10; k++) {
                    const rr = k % 2 === 0 ? R : r2;
                    const a = -Math.PI / 2 + k * Math.PI / 5;
                    const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
                    if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.item >= 0 ? 'アイテム出現中!' : 'アイテムまで ' + (history.length % Math.max(1, P('item_interval') || 5) === 0 ? Math.max(1, P('item_interval') || 5) : Math.max(1, P('item_interval') || 5) - history.length % Math.max(1, P('item_interval') || 5)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            道具碁: 5手ごとに盤上へ★アイテム出現。1マス以内に置いた側が拾って+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '5の倍数手の後、盤上の空点に★アイテムが出現する (出現位置は決まった規則)。',
            'アイテムの1マス以内に着手した側がそれを拾い、アゲハマが+1される。',
            '拾い合いの位置取りが入り乱れる — 小利を巡る読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.item = -1; captures = { 1: 0, 2: 0 };
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: 0, y: i }] }, i % 2 === 0 ? 1 : 2);
        assert('5手後にアイテム出現', st.item >= 0);
        const ix = st.item % BOARD_SIZE, iy = Math.floor(st.item / BOARD_SIZE);
        executeMove({ cells: [{ x: ix, y: iy }] }, 1); // アイテムの直上に配置 → 拾得
        assert('直上に置くと拾得', st.item === -1);
        assert('拾うとアゲハマ+1', captures[1] === 1);
    `,
};
