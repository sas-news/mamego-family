// MIRRORCRAFTGO — 鏡磨碁: 石は鏡。隣接する敵石の色を映す — 敵石と接する鏡は敵と同じ呼吸を持つ
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mirrorcraftgo.html',
    en: 'MIRRORCRAFTGO',
    jp: '鏡磨碁',
    prefix: 'mirrorcraftgo',
    desc: '石は鏡。敵石と接した鏡は敵の色を映し、敵連に取り込まれず取られにくくなる。',
    kind: 'stone',
    icon: 'mirrorcraftgo',
    spec: [
        ...K.rb('MIRRORCRAFTGO', '鏡磨碁', 'mirrorcraftgo'),
        K.params([
            { key: 'mirror_bonus', label: '写りの呼吸ボーナス', min: 0, max: 3, def: 1, hint: '敵石に接した石の連に加算される呼吸点' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 鏡の写り: 敵石に隣接する石は「写って」連の呼吸を共有する (グループ呼吸に+1)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        // 鏡: 敵石に接する自軍石は敵を写して守られる
                        if (getNeighbors(curr).some(n => boardState[n] !== 0 && boardState[n] !== player && boardState[n] !== 3)) liberties += (P('mirror_bonus') ?? 1);
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                // 鏡: 敵石に接する自軍石は敵を写して守られる
                if (getNeighbors(curr).some(n => boardState[n] !== 0 && boardState[n] !== player && boardState[n] !== 3)) liberties += (P('mirror_bonus') ?? 1);
            }
            return liberties;`],
        // 鏡の印: 敵に接した石は銀色の縁を帯びる
        ...K.STONE_MARKS_SPEC(`            // 敵に接した鏡: 銀の縁が光る
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(226,232,240,0.85)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const mirror = getNeighbors(i).some(n => board[n] !== 0 && board[n] !== v && board[n] !== 3);
                    if (!mirror) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            鏡磨碁: 石は鏡。敵石と接する石は敵を写して磨かれ、その連の呼吸+1 (銀の縁)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は鏡。敵石に直接接した自軍の石は敵の色を写して磨かれ、連の呼吸点+1。',
            '敵に触れるほど磨かれて取られにくい — 接触線を増やすと連が硬くなる。',
            '双方同じ写り条件。相手に触れすぎると連が絡まり逃げにくくもなる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(5, 5)] = 1; // 黒
        board[I(5, 6)] = 2; // 白が接する
        assert('敵に接した黒は呼吸+1', getLiberties(board, I(5, 5)) === 4);
        assert('敵に接した白も呼吸+1', getLiberties(board, I(5, 6)) === 4);
        board[I(8, 8)] = 1; // 接しない黒
        assert('接しない黒は普通', getLiberties(board, I(8, 8)) === 4);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
