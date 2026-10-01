// INDIVISIBLEGO — 素数碁: 石数が素数の連は分割不能。取られるのは最も囲まれた1石だけ
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
    file: 'indivisiblego.html',
    en: 'INDIVISIBLEGO',
    jp: '素数碁',
    prefix: 'indivisiblego',
    desc: '石数が素数の連は分割不能 — 囲まれても1石ずつしか削られない。',
    kind: 'stone',
    icon: 'indivisiblego',
    spec: [
        ...K.rb('INDIVISIBLEGO', '素数碁', 'indivisiblego'),
        K.params([
            { key: 'guard_mode', label: '分割不能の連', options: [{ v: 'prime', l: '素数連' }, { v: 'odd', l: '奇数連' }], def: 'prime' },
        ]),
        // 素数判定ヘルパー
        [K.ONE, `        function getCapturedStones(boardState, player) {`,
`        function isPrimeNum(n) {
            if (n < 2) return false;
            for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
            return true;
        }

        function getCapturedStones(boardState, player) {`],
        // 素数連は分割不能: 窒息しても全体は取られず、最も敵に囲まれた1石のみ脱落
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    if (!hasLiberty) {
                        if ((P('guard_mode') || 'prime') === 'odd' ? group.length % 2 === 1 : isPrimeNum(group.length)) {
                            let worst = group[0], worstScore = -1;
                            group.forEach(g => {
                                let s = 0;
                                getNeighbors(g).forEach(n => { if (boardState[n] !== player) s++; });
                                if (s > worstScore) { worstScore = s; worst = g; }
                            });
                            captured.push(worst); // 素数連は1石だけ脱落して生き延びる
                        } else {
                            captured.push(...group);
                        }
                    }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            素数碁: 石数が素数 (2,3,5,7,11…) の連は分割不能 — 囲まれても1石だけが脱落<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石数が素数 (2,3,5,7,11,13…) の連は「分割不能」— 呼吸が0になっても全滅せず、最も囲まれた端の1石だけが脱落する。',
            '1石や合成数 (4,6,8,9…) の連は通常通り取られる。素数に保つよう連を育てるのが強い。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白2石の素数連を黒で完全に囲む
        board[I(4, 4)] = 2; board[I(5, 4)] = 2;
        board[I(3, 4)] = 1; board[I(6, 4)] = 1;
        board[I(4, 3)] = 1; board[I(5, 3)] = 1;
        board[I(4, 5)] = 1; board[I(5, 5)] = 1;
        const cap = getCapturedStones(board, 2);
        assert('素数連は1石だけ脱落', cap.length === 1 && board[I(4, 4)] === 2);
        // 合成数4の連は全滅
        board.fill(0);
        board[I(4, 4)] = 2; board[I(5, 4)] = 2; board[I(4, 5)] = 2; board[I(5, 5)] = 2;
        board[I(3, 4)] = 1; board[I(3, 5)] = 1; board[I(6, 4)] = 1; board[I(6, 5)] = 1;
        board[I(4, 3)] = 1; board[I(5, 3)] = 1; board[I(4, 6)] = 1; board[I(5, 6)] = 1;
        assert('4石の連は全滅', getCapturedStones(board, 2).length === 4);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
        assert('素数判定', isPrimeNum(2) && isPrimeNum(7) && !isPrimeNum(1) && !isPrimeNum(9));
    `,
};
