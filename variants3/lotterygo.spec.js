// LOTTERYGO — 宝籤碁: 着手でくじ引き。当たりなら追加石、ハズレなら次の自分の手番が飛ばされる
const K = require('../gen_kit.js');
module.exports = {
    file: 'lotterygo.html',
    en: 'LOTTERYGO',
    jp: '宝籤碁',
    prefix: 'lotterygo',
    desc: '着手でくじ引き: 大当り=追加石、ハズレ=次の自分の手番スキップ、通常は何もなし。',
    kind: 'stone',
    icon: 'lotterygo',
    spec: [
        ...K.rb('LOTTERYGO', '宝籤碁', 'lotterygo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { skipNext: { 1: false, 2: false }, lastLot: '' }; // くじ結果とスキップ`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { skipNext: { 1: false, 2: false }, lastLot: '' };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { skipNext: { 1: false, 2: false }, lastLot: '' };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { skipNext: { 1: false, 2: false }, lastLot: '' };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { skipNext: { 1: false, 2: false }, lastLot: '' };`],
        // くじ引き: 大当り→近くに追加石 / ハズレ→次の自分の手番が飛ぶ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 宝籤ルール: 手数から決定論的にくじを引く
            let lotSkip = false;
            {
                const s = Math.sin(history.length * 71.3 + 17.9) * 43758.5453;
                const r = s - Math.floor(s);
                const p0 = move.cells[0];
                const pi = p0.y * BOARD_SIZE + p0.x;
                if (r < 0.2) {
                    // 大当り: 隣接する空点に追加石
                    const emp = getNeighbors(pi).filter(q => board[q] === 0);
                    if (emp.length > 0) {
                        board[emp[0]] = player;
                        fxGlow(emp[0], '#fbbf24', 800);
                        fxText(emp[0], '大当り +1石', '#fbbf24', 1300);
                        st.lastLot = '大当り';
                    } else {
                        captures[player] += 1;
                        st.lastLot = '大当り (+1目)';
                    }
                } else if (r < 0.35) {
                    // ハズレ: 次の自分の手番が飛ばされる
                    st.skipNext[player] = true;
                    st.lastLot = 'ハズレ';
                    fxText(pi, 'ハズレ: 次番スキップ', '#94a3b8', 1300);
                } else {
                    st.lastLot = '通常';
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;
            // スキップ消化: 次の手番がスキップ予約済みならさらに1順飛ばす
            if (st.skipNext[turn]) {
                st.skipNext[turn] = false;
                turn = player;
            }`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.EVENT_CHIP_SPEC(`'くじ: ' + (st.lastLot || '-') `),
        [K.ONE, K.INFO_ALGO, `            宝籤碁: 着手でくじ引き。大当り=追加石、ハズレ=次番スキップ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたび宝籤を引く。',
            '大当り: 隣の空点に自分の石がもう1個 (なければ+1目)。ハズレ: 自分の次の手番が飛ばされる。',
            'くじは手数で決まり両者に等しく巡る。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('くじが引かれる', st.lastLot !== '');
        assert('白番へ回る', turn === 2);
        // 白にハズレを仕込む → 黒の手の後、白番が飛ばされ黒番のまま
        st.skipNext[2] = true;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        assert('白番をスキップして黒番のまま', turn === 1);
        assert('スキップは消化済み', st.skipNext[2] === false);
        assert('着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
