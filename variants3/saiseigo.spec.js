// SAISEIGO — 再生碁: 2個以上の連が切られても、呼吸のあれば断片1個が別個体として再生する
const K = require('../gen_kit.js');
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
    file: 'saiseigo.html',
    en: 'SAISEIGO',
    jp: '再生碁',
    prefix: 'saiseigo',
    desc: '2個以上の連が取られても、呼吸のあれば断片1個が別個体として再生する (アゲハマは取った分)。',
    kind: 'stone',
    icon: 'saiseigo',
    spec: [
        ...K.rb('SAISEIGO', '再生碁', 'saiseigo'),
        K.params([
            { key: 'regen_min', label: '再生が起きる最小の取り数', min: 1, max: 6, def: 2, unit: '石' },
        ]),
        // 再生: 2個以上取った連は断片1個が蘇る (取った数はアゲハマのまま)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 再生碁: 2個以上切られた連は断片が再生する
            if (captured.length >= Math.max(1, P('regen_min') || 2)) {
                const frag = captured[0];
                if (board[frag] === 0) {
                    board[frag] = opponent; // 取られた側の色で仮に再生
                    if (getLiberties(board, frag) === 0) board[frag] = 0; // 呼吸が無ければ再生できない
                    else {
                        fxBurst(frag, '#86efac', 10, 1.6);
                        fxText(frag, '再生!', '#bbf7d0', 1100);
                    }
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            再生碁: 2個以上の連が取られても、呼吸のあれば断片1個が再生する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '再生: 2個以上の連が取られたとき、切られた先頭の1個は呼吸があれば元の色で盤上に再生する (アゲハマは取った数のまま)。',
            '再生された断片は取り返さねばならない — 大きな連は死ににくい。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 白2連 (4,4)-(5,4) を黒で囲む — 呼吸0で取られる
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[3 * BOARD_SIZE + 5] = 1;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 6] = 1;
        board[5 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 2連取り
        assert('2連は取られる', captures[1] === 2);
        assert('断片1個が再生する', board[4 * BOARD_SIZE + 4] === 2 || board[4 * BOARD_SIZE + 5] === 2);
        const reborn = (board[4 * BOARD_SIZE + 4] === 2 ? 4 : 5);
        assert('再生は元の色のまま', board[4 * BOARD_SIZE + reborn] === 2);
        // 1個取りは再生しない
        board.fill(0); pieces = [];
        board[8 * BOARD_SIZE + 8] = 2;
        board[7 * BOARD_SIZE + 8] = 1; board[8 * BOARD_SIZE + 7] = 1; board[9 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 9, y: 8 }] }, 1); // 東面を塞いで1個取り
        assert('1個取りは再生しない', board[8 * BOARD_SIZE + 8] === 0);
    `,
};
