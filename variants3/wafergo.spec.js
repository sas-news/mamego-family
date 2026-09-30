// WAFERGO — 薄板碁: 盤は「表」と「裏」の2面。5手ごとに裏返し、別の盤が進行する
const K = require('../gen_kit.js');
module.exports = {
    file: 'wafergo.html',
    en: 'WAFERGO',
    jp: '薄板碁',
    prefix: 'wafergo',
    desc: '盤は表と裏の2面。5手ごとに裏返って別盤として進行する (裏返ると左右反転)。',
    kind: 'stone',
    icon: 'wafergo',
    spec: [
        ...K.rb('WAFERGO', '薄板碁', 'wafergo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { other: null, side: 0 }; // other=裏面の盤, side=0表/1裏
        function mirrorX(bd) {
            const nb = bd.slice();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                nb[y * BOARD_SIZE + (BOARD_SIZE - 1 - x)] = bd[y * BOARD_SIZE + x];
            }
            return nb;
        }
        function initSt() {
            st = { other: Array(BOARD_SIZE * BOARD_SIZE).fill(0), side: 0 };
        }
        function flipWafer() {
            const old = board;
            board = mirrorX(st.other);
            st.other = mirrorX(old);
            st.side ^= 1;
            fxShake(5, 400);
            fxText(((BOARD_SIZE * BOARD_SIZE) / 2) | 0, st.side ? '裏面!' : '表面!', '#f0abfc', 1100);
            cleanUpPieces();
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            initSt();`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { other: [...st.other], side: st.side },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? { other: [...snap.st.other], side: snap.st.side } : { other: Array(BOARD_SIZE * BOARD_SIZE).fill(0), side: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st: { other: [...st.other], side: st.side },
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? { other: [...s.st.other], side: s.st.side } : { other: Array(BOARD_SIZE * BOARD_SIZE).fill(0), side: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st: { other: [...st.other], side: st.side },
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? { other: [...data.st.other], side: data.st.side } : { other: Array(BOARD_SIZE * BOARD_SIZE).fill(0), side: 0 };`],
        // 5手ごとに薄板を裏返す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length % 5 === 0) flipWafer();
            turn = opponent;`],
        // 裏面の地も集計する
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 裏面の地も加算する
            const _sv = board; board = st.other;
            const t2 = calculateTerritory();
            board = _sv;
            territory.black += t2.black;
            territory.white += t2.white;`],
        // 表/裏チップ
        ...K.EVENT_CHIP_SPEC(`(st.side ? '裏面' : '表面') + ' 反転まで ' + (5 - (history.length % 5)) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            薄板碁: 盤は表と裏の2面。5手ごとに裏返って別盤として進行する (左右反転)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたびに裏面も育つ。5手ごとに薄板が裏返り、別の盤 (左右反転) が現れる。',
            '両面の地とアゲハマの合計で勝敗を決める。表で不利でも裏で捲れる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 2);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 3 }] }, 2);
        assert('4手時点は表面', st.side === 0 && board[I(3, 3)] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('5手で裏面に反転', st.side === 1);
        assert('表面の石は裏面へ退避', st.other[I(BOARD_SIZE - 1 - 3, 3)] === 1 && board[I(3, 3)] === 0);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 1 }] }, 2);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2);
        assert('10手で表面に戻る', st.side === 0);
        assert('表面は左右反転して戻る', board[I(3, 3)] === 1);
    `,
};
