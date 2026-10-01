// OUTLASTGO — 耐久碁: パスは「休養」。パスした側の連は次の相手の番だけ呼吸点+1 (取られない)
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
    file: 'outlastgo.html',
    en: 'OUTLASTGO',
    jp: '耐久碁',
    prefix: 'outlastgo',
    desc: 'パスは休養: パスした側の連は次の1手だけ呼吸点が+1され取られない。',
    kind: 'weather',
    icon: 'outlastgo',
    spec: [
        ...K.rb('OUTLASTGO', '耐久碁', 'outlastgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.5, max: 2, def: 1.1, step: 0.05 },
        ]),
        ...PERSIST('{ rest: { 1: false, 2: false } }'),
        // パス = 休養: パスした側の連は次の相手番だけ呼吸点+1
        [K.ONE, K.PASS_INC, `            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            st.rest[turn] = true; // 休養: 次の相手番で自分の連は取られない`],
        // 休養中の連は取られない (呼吸点+1の効果として、休養側への捕獲を無効化)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = st.rest[opponent] ? [] : getCapturedStones(board, opponent);
            if (st.rest[opponent]) {
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '休養', '#34d399', 900);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 休養は1手限り: この着手で休養効果は全て消える
            st.rest = { 1: false, 2: false };

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 休養中: 呼吸点+1の連に緑の盾マーク
            [1, 2].forEach(pl => {
                if (!st.rest[pl]) return;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== pl) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(52,211,153,0.85)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, -Math.PI * 0.75, -Math.PI * 0.25);
                    ctx.stroke();
                    ctx.restore();
                }
            });`),
        ...K.EVENT_CHIP_SPEC(`st.rest[turn] ? '休養中(+1呼吸)' : ''`),
        [K.ONE, K.RV_ALGO, K.rv([
            'パスは休養: パスした側の全ての連は、次の相手の番の間だけ呼吸点+1 (その番では取られない)。',
            '連続パスは通常通り終局になる。危ない連を持つ側は休養で凌げる — 両者同じ効果。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.rest = { 1: false, 2: false };
        // 白1子を3方向包囲した状態で白がパス(休養)
        board[I(4, 4)] = 2; board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        turn = 2;
        handlePass();
        assert('休養フラグON', st.rest[2] === true);
        assert('パスで黒番', turn === 1);
        // 黒が最後の呼吸点を塞いでも休養中は取れない
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('休養で取られない', board[I(4, 4)] === 2);
        assert('アゲハマなし', captures[1] === 0);
        assert('休養は1手で消える', st.rest[2] === false);
    `,
};
