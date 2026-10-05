// SUPPLYLINEGO — 兵糧碁: 軍(連)は手番ごとに兵糧を消費。尽きると最大の連の兵士が1人脱走する
const K = require('../gen_kit.js');
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
const ST_INIT = `{ ration: { 1: (P('ration_init') || 24), 2: (P('ration_init') || 24) } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'supplylinego.html',
    en: 'SUPPLYLINEGO',
    jp: '兵糧碁',
    prefix: 'supplylinego',
    desc: '連は手番ごとに兵糧を食べる。兵糧が尽きると最大の連の兵士が脱走する。敵を取ると兵糧を鹵獲。',
    kind: 'stone',
    icon: 'supplylinego',
    spec: [
        ...K.rb('SUPPLYLINEGO', '兵糧碁', 'supplylinego'),
        K.params([
            { key: 'ration_init', label: '初期兵糧', min: 8, max: 60, def: 24, unit: '石分' },
            { key: 'ration_resupply', label: '補給船の兵糧', min: 4, max: 40, def: 12, unit: '石分' },
        ]),
        ...ST(ST_INIT),
        // 兵糧: 敵を取ると鹵獲 (取った数だけ兵糧補給)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                st.ration[player] += captured.length; // 鹵獲で兵糧補給
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 兵糧ルール: 自分の手番終わりに兵糧を「連の数」だけ消費。尽きると最大連の兵士が脱走
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 兵糧: 連の数だけ消費。尽きると最大の連から兵士が1人脱走 (アゲハマにならない)
            {
                const seenS = {};
                let biggest = null, gCount = 0;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || seenS[i]) continue;
                    const g = getConnectedGroup(i, player);
                    g.forEach(j => { seenS[j] = true; });
                    gCount++;
                    if (!biggest || g.length > biggest.length) biggest = g;
                }
                st.ration[player] -= gCount;
                if (st.ration[player] < 0 && biggest) {
                    const deserter = Math.max.apply(null, biggest);
                    board[deserter] = 0;
                    st.ration[player] = (P('ration_resupply') || 12); // 補給船が再出港
                    fxBurst(deserter, '#78716c', 10, 1.5);
                    fxText(deserter, '兵糧切れ脱走!', '#a8a29e', 1400);
                    fxShake(4, 300);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'兵糧 ' + st.ration[turn]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            兵糧碁: 連は手番ごとに兵糧を消費する。尽きると最大の連の兵士が脱走。敵を取ると兵糧を鹵獲<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の各手番の終わりに、盤上の自分の連の数だけ兵糧を消費する (初期24)。',
            '兵糧が尽きると最大の連の兵士が1人脱走 (盤から消えるがアゲハマにはならない) し、補給船が再出港する。',
            '敵石を取ると鹵獲で兵糧が増える。軍を広げすぎると兵站が続かない — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ration = { 1: 1, 2: 24 };
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; // 連A (2石)
        board[8 * BOARD_SIZE + 8] = 1; // 連B (1石) — 合計2連
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 連C追加 → 3連で兵糧-3 → 尽きる
        assert('兵糧切れで最大連から脱走', board[4 * BOARD_SIZE + 5] === 0 || board[4 * BOARD_SIZE + 4] === 0);
        assert('脱走はアゲハマにならない', captures[2] === 0);
        assert('補給船が再出港', st.ration[1] === 12);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 2) === true);
    `,
};
