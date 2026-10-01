// ACCELGO — 加速碁: 連続して石を置き続けると3手ごとに追加の着手権 (連打ボーナス)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ streak: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'accelgo.html',
    en: 'ACCELGO',
    jp: '加速碁',
    prefix: 'accelgo',
    desc: '自分の番で石を置き続けると3連続ごとに+1手の連打ボーナス。パスでリセット。',
    kind: 'stone',
    icon: 'accelgo',
    spec: [
        ...K.rb('ACCELGO', '加速碁', 'accelgo'),
        K.params([
            { key: 'streak_len', label: '連打ボーナス間隔', min: 2, max: 6, def: 3, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 加速: 連続着手3回ごとに手番を維持 (追加の1手)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 加速: 連続して石を置き続けると3手ごとに追加着手権
            st.streak[player] = (st.streak[player] || 0) + 1;
            if (st.streak[player] >= (P('streak_len') || 3)) {
                st.streak[player] = 0;
                const ai2 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(ai2, '#f97316', 800);
                fxText(ai2, '加速!', '#f97316', 1100);
                updateUI();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                if (!gameOver && gameMode === 'ai' && turn === aiPlayer) triggerAiMove();
                return; // turn を渡さず手番継続
            }

            turn = opponent;`],
        // パスで加速カウンタをリセット
        [K.ONE, K.PASS_INC, `            prevBoard = null; // パスでコウ制限は解除
            consecutivePasses++;
            st.streak[turn] = 0; // パスで加速リセット`],
        ...K.EVENT_CHIP_SPEC(`'加速 ' + (st.streak[turn] || 0) + '/' + (P('streak_len') || 3)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            加速碁: 連続して石を置くと3連続ごとに追加の1手 (パスでリセット)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の手番で石を置き続けると、3連続ごとにもう1手打てる (連打ボーナス)。',
            'パスを挟むと連続カウントがリセットされる。両者に同じ加速条件。',
            '連打で一気に地を固めるか、温存するか。攻め時の加速が効く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 }; st.streak = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // streak 1
        executeMove({ cells: [{ x: 0, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // streak 2
        executeMove({ cells: [{ x: 1, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1); // streak 3 → 加速
        assert('3連続で手番継続', turn === 1);
        assert('カウンタはリセット', st.streak[1] === 0);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1); // 加速の追加手 → streak 1
        assert('追着手は打てる', board[3] === 1 && turn === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
