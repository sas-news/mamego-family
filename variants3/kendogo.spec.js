// KENDOGO — 剣道碁: 取った石の数で打突点が決まる — 1石=1点、2〜3石=2点、4石以上=3点 (終局時に加算)
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
    file: 'kendogo.html',
    en: 'KENDOGO',
    jp: '剣道碁',
    prefix: 'kendogo',
    desc: '取りの規模が打突点 — 小手(1石)=1点、胴(2〜3石)=2点、面(4石以上)=3点。',
    kind: 'stone',
    icon: 'kendogo',
    spec: [
        ...K.rb('KENDOGO', '剣道碁', 'kendogo'),
        ...ST('{ ippon: { 1: 0, 2: 0 } }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 剣道碁: 取りの規模で打突点 — 小手(1)=1、胴(2-3)=2、面(4+)=3
            {
                const n = captured.length;
                if (n > 0) {
                    const pt = n >= 4 ? 3 : n >= 2 ? 2 : 1;
                    st.ippon[player] += pt;
                    const waza = n >= 4 ? 'メン!' : n >= 2 ? 'ドウ!' : 'コテ!';
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(mi, waza, '#ef4444', 1200);
                    fxShake();
                }
            }

            turn = opponent;`],
        // 終局時: 打突点を地に加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            territory.black += st.ippon[1] || 0;
            territory.white += st.ippon[2] || 0;`],
        ...K.EVENT_CHIP_SPEC('"打突 " + (st.ippon[1] || 0) + "-" + (st.ippon[2] || 0)'),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            剣道碁: 取りの規模が打突点 — 1石=1点、2〜3石=2点、4石以上=3点 (終局時に加算)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石を取ると規模で打突点が入る: 1石=小手1点、2〜3石=胴2点、4石以上=面3点。',
            '打突点は終局時にそのまま地に加算される。',
            '大きく取るほど効く — 大連を狙う攻め合い。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st = { ippon: { 1: 0, 2: 0 } };
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 1石取り → 小手
        assert('1石取りは小手1点', st.ippon[1] === 1);
        // 2石の連を取る → 胴2点
        board[I(5, 5)] = 2; board[I(6, 5)] = 2;
        board[I(4, 5)] = 1; board[I(5, 4)] = 1; board[I(5, 6)] = 1; board[I(7, 5)] = 1; board[I(6, 4)] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 最後の呼吸を塞ぐ → 2石取り
        assert('2石取りは胴2点 (計3点)', st.ippon[1] === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
