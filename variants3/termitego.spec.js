// TERMITAGO — 蟻塚碁: シロアリの通路 (壁) が盤を這い回り、通路上の石は食われて消える
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
    file: 'termitego.html',
    en: 'TERMITAGO',
    jp: '蟻塚碁',
    prefix: 'termitego',
    desc: 'シロアリの通路 (壁) が盤を這い回り、通路上の石は食われて消える。',
    kind: 'wall',
    icon: 'termitego',
    spec: [
        ...K.rb('TERMITAGO', '蟻塚碁', 'termitego'),
        K.params([
            { key: 'tunnel_len', label: '蟻の通路の長さ', min: 10, max: 100, def: 40, unit: 'マス' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.0, step: 0.1, def: 1.1, hint: '交点数比' },
        ]),
        ...K.WALL_SPEC,
        ...PERSIST('{ head: null, len: 0 }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蟻の通路: 着手ごとに1マス掘り進む (壁=3)。通路上の石は食われる。全長40で新たな巣へ
            {
                if (st.head == null) {
                    const edge = [];
                    for (let i = 0; i < board.length; i++) {
                        const ex = i % BOARD_SIZE, ey = Math.floor(i / BOARD_SIZE);
                        if ((ex === 0 || ey === 0 || ex === BOARD_SIZE - 1 || ey === BOARD_SIZE - 1) && board[i] === 0) edge.push(i);
                    }
                    if (edge.length > 0) st.head = edge[Math.floor(Math.random() * edge.length)];
                }
                if (st.head != null && st.len < (P('tunnel_len') || 40)) {
                    // 最後の石は食わない (全滅防止)
                    const loneStone = board.filter(v => v === 1 || v === 2).length <= 1;
                    const opts = getNeighbors(st.head).filter(n => board[n] !== 3 && !(loneStone && (board[n] === 1 || board[n] === 2)));
                    if (opts.length > 0) {
                        const nxt = opts[Math.floor(Math.random() * opts.length)];
                        if (board[nxt] === 1 || board[nxt] === 2) {
                            // 通路上の石は食われて消える (アゲハマにはならない)
                            board[nxt] = 0;
                            fxBurst(nxt, '#a16207', 8, 1.3);
                        }
                        board[nxt] = 3;
                        st.head = nxt;
                        st.len++;
                        cleanUpPieces();
                    } else {
                        st.len = (P('tunnel_len') || 40); // 行き止まり → 次は新たな通路を掘り始める
                    }
                } else {
                    st.head = null;
                    st.len = 0;
                }
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'蟻 ' + st.len + '/' + (P('tunnel_len') || 40)`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤の縁からシロアリの通路 (茶色の壁) が毎手1マスずつ掘り進まれる。通路上の石は食われて消える。',
            '通路は呼吸を遮る壁になる。全長40マスに達するか行き止まりで、新たな通路が別の縁から伸び始める。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.head = null; st.len = 0;
        board[I(0, 3)] = 2; // 通路上に食われる可能性のある石
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('通路が掘られ始める', st.head != null && st.len >= 1);
        assert('通路は壁になる', board.filter(v => v === 3).length >= 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('通路が伸びる', st.len >= 2);
        assert('起動して着手可', isValidPlacement([{ x: 6, y: 7 }], 1) === true);
    `,
};
