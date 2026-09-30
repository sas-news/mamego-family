// SEQUENCEGO — 数列碁: 自分の盤上石数が新しいフィボナッチ数に達すると+2目の数列ボーナス
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sequencego.html',
    en: 'SEQUENCEGO',
    jp: '数列碁',
    prefix: 'sequencego',
    desc: '盤上の自分の石数がフィボナッチ数 (1,2,3,5,8,13…) に達するたび+2目。',
    kind: 'stone',
    icon: 'sequencego',
    spec: [
        ...K.rb('SEQUENCEGO', '数列碁', 'sequencego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } }; // 数列ボーナス・達成済みのフィボナッチ数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 数列ボーナス: 着手後の自分の石数が未達成のフィボナッチ数なら+2目
            {
                const FIB = { 1: 1, 2: 1, 3: 1, 5: 1, 8: 1, 13: 1, 21: 1, 34: 1, 55: 1, 89: 1, 144: 1, 233: 1, 377: 1 };
                let cnt = 0;
                for (let i = 0; i < board.length; i++) if (board[i] === player) cnt++;
                if (FIB[cnt] && !st.fib[player][cnt]) {
                    st.fib[player][cnt] = true;
                    st.bonus[player] += 2;
                    const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxGlow(ci, '#f59e0b', 750);
                    fxText(ci, cnt + '石 数列+2目', '#f59e0b', 1200);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の数列ボーナス:</span> <strong>\${st.bonus[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の数列ボーナス:</span> <strong>\${st.bonus[2]}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'ボーナス +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            数列碁: 盤上の自分の石数が新しいフィボナッチ数になるたび+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手後、盤上の自分の石数が 1,2,3,5,8,13,21,34,55,89… のフィボナッチ数になったら+2目。',
            '各数値は1人につき1回のみ有効。石を取られて数が減ると次の数が遠のく — 数を刻む立回りが重要。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, fib: { 1: {}, 2: {} } };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 1石 → フィボナッチ
        assert('1石でボーナス+2', st.bonus[1] === 2);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 2);
        assert('白も同様に+2', st.bonus[2] === 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // 2石 → フィボナッチ
        assert('2石でも+2 (計4)', st.bonus[1] === 4);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1); // 3石 → フィボナッチ
        assert('3石でも+2 (計6)', st.bonus[1] === 6);
        assert('達成済み数は記録', st.fib[1][1] === true && st.fib[1][2] === true && st.fib[1][3] === true);
        assert('通常着手は合法', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
