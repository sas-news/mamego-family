// ASSAULTGO — 突撃碁2: 敵連に隣接した連は突撃状態になり、毎手番の終わりに先鋒の石が1個ずつ削れる (両軍同時)
const K = require('../gen_kit.js');
module.exports = {
    file: 'assaultgo.html',
    en: 'ASSAULTGO',
    jp: '突撃碁2',
    prefix: 'assaultgo',
    desc: '敵連に接した連は突撃状態。毎手、両軍の先鋒が1個ずつ削れて相手のアゲハマになる。',
    kind: 'stone',
    icon: 'assaultgo',
    spec: [
        ...K.rb('ASSAULTGO', '突撃碁2', 'assaultgo'),
        // 突撃解決: 着手後、敵連に隣接する全ての連の先鋒を1個削る (黒白同時・対称)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 突撃: 敵の連に隣接している連は先鋒の石を1個失う (両軍同時に解決)
            {
                const rem = new Set();
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if (c !== 1 && c !== 2 || seen.has(i)) continue;
                    const grp = [];
                    const stack = [i];
                    seen.add(i);
                    while (stack.length) {
                        const u = stack.pop();
                        grp.push(u);
                        getNeighbors(u).forEach(n => {
                            if (board[n] === c && !seen.has(n)) { seen.add(n); stack.push(n); }
                        });
                    }
                    for (const u of grp) {
                        if (getNeighbors(u).some(n => board[n] === (c === 1 ? 2 : 1))) { rem.add(u); break; }
                    }
                }
                if (rem.size) {
                    rem.forEach(i => {
                        const o = board[i] === 1 ? 2 : 1;
                        captures[o]++;
                        board[i] = 0;
                        fxBurst(i, '#ef4444', 6, 1.4);
                    });
                    cleanUpPieces();
                    fxShake(3, 220);
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.INFO_ALGO, `            突撃碁2: 敵連に接した連は突撃状態。毎手、両軍の先鋒が削れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵の連に隣接している連は「突撃状態」— 毎手番の終わりに両軍の先鋒 (接している石) が1個ずつ削れて相手のアゲハマになる。',
            '接触線は常に出血する。大きな連も少しずつ削られるので、離れて地を固める戦略も有効。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 2; // 黒連と白連が接触
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('黒先鋒が削れた', board[4 * BOARD_SIZE + 4] === 0);
        assert('白先鋒も削れた (対称)', board[5 * BOARD_SIZE + 4] === 0);
        assert('双方にアゲハマ', captures[1] === 1 && captures[2] === 1);
    `,
};
