// BLUFFGO — 詐称碁: 取り後、直後の石が孤立していると「虚勢」として2目罰則
const K = require('../gen_kit.js');
module.exports = {
    file: 'bluffgo.html',
    en: 'BLUFFGO',
    jp: '詐称碁',
    prefix: 'bluffgo',
    desc: '石を取った手番が「虚勢」(取った石が自軍から孤立)だと見抜かれて-2目。',
    kind: 'stone',
    icon: 'bluffgo',
    spec: [
        ...K.rb('BLUFFGO', '詐称碁', 'bluffgo'),
        K.params([
            { key: 'bluff_penalty', label: '虚勢の罰則', min: 1, max: 6, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bluff: -1 }; // 虚勢判定用: 直前に取った石の位置`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bluff: -1 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bluff: -1 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bluff: -1 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bluff: -1 };`],
        // 詐称ルール: 取った直後の石が自軍と接していなければ「虚勢」-2目 (相手が見抜く)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 詐称判定: 取った手が自軍と接していない単独侵攻なら「虚勢」と見抜かれる
                {
                    const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    const linked = getNeighbors(pi).some(n => board[n] === player);
                    const pen = P('bluff_penalty') || 2;
                    if (!linked) {
                        captures[player] -= pen;
                        captures[opponent] += pen;
                        fxText(pi, '虚勢見抜き -' + pen, '#f87171', 1400);
                    }
                    st.bluff = pi;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'取りは自軍に繋げ' `),
        [K.ONE, K.INFO_ALGO, `            詐称碁: 単独侵攻で取ると「虚勢」と見抜かれ-2目。取りは自軍に繋げ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を取った着手が自軍と接していない単独侵攻なら「虚勢」として相手に見抜かれる。',
            '見抜かれると-2目の罰則 (相手+2・自分-2)。取る手は必ず自軍と繋いでおこう。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        // 孤立取り → 虚勢 -2 (ネットで3点→1点)
        board[4 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('孤立取りは実質-1', captures[1] === 1 - 2);
        assert('相手に+2', captures[2] === 2);
        // 繋がった取り → 罰則なし
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 5] = 1; // 取った石に繋がる自石
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('繋がった取りは罰則なし', captures[1] === 1);
        assert('相手増えない', captures[2] === 0);
    `,
};
