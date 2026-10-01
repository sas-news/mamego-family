// CROWN2GO — 戴冠碁: 十字5連+角1石の「王冠形(菱6連)」を作った側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'crown2go.html',
    en: 'CROWN2GO',
    jp: '戴冠碁',
    prefix: 'crown2go',
    desc: '十字5連のどれかの角にもう1石置いて王冠形(菱6連)を完成させた側が即勝ち。',
    kind: 'stone',
    icon: 'crown2go',
    spec: [
        ...K.rb('CROWN2GO', '戴冠碁', 'crown2go'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 王冠形: 中心+上下左右4石の十字 + 斜め4隅のどれか1石
        function crownFound(player) {
            for (let y = 1; y < BOARD_SIZE - 1; y++) {
                for (let x = 1; x < BOARD_SIZE - 1; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== player) continue;
                    if (board[i - 1] !== player || board[i + 1] !== player) continue;
                    if (board[i - BOARD_SIZE] !== player || board[i + BOARD_SIZE] !== player) continue;
                    const diags = [i - BOARD_SIZE - 1, i - BOARD_SIZE + 1, i + BOARD_SIZE - 1, i + BOARD_SIZE + 1];
                    if (diags.some(d => board[d] === player)) return i;
                }
            }
            return -1;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 戴冠ルール: 王冠形が完成した側が即勝ち
            {
                const ci = crownFound(player);
                if (ci >= 0) {
                    fxGlow(ci, '#fde047', 1100);
                    fxText(ci, '戴冠!', '#eab308', 1500);
                    fxShake(6, 400);
                    winByRule(player, '戴冠勝ち', '王冠形 (菱6連) を完成させました'); return;
                }
            }
            // 長期戦防止: 既定の手数経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で「十字5連+その斜め角1石」の王冠形 (菱6連) を完成させると即勝ち。',
            '完成を阻むには途中の十字を崩すしかない。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        [[5, 5], [4, 5], [6, 5], [5, 4], [5, 6]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 1));
        assert('十字だけでは続行', gameOver === false);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 角に宝珠を置いて王冠完成
        assert('王冠形で即勝ち', gameOver === true);
        assert('戴冠勝ち表示', !!gameResultData && gameResultData.title.includes('戴冠'));
    `,
};
