// VOLTAGEGO — 電圧碁: 石は正負の電荷。置いた石と最初に接した敵石が中和して両方消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'voltagego.html',
    en: 'VOLTAGEGO',
    jp: '電圧碁',
    prefix: 'voltagego',
    desc: '置いた石と最初に接触した敵石が中和して両方消える (1手1対のみ)。',
    kind: 'stone',
    icon: 'voltagego',
    spec: [
        ...K.rb('VOLTAGEGO', '電圧碁', 'voltagego'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        // 中和: 着手石の隣の敵石とペアで消滅 (通常の取りの後)
        [K.ONE, K.TURN_FLIP, `            // 電圧: 着手石と最初に接した敵石が中和して消える
            {
                const placed = move.cells.map(p => p.y * BOARD_SIZE + p.x);
                placed.forEach(pi => {
                    if (board[pi] !== player) return; // 既に消えている
                    const enemy = getNeighbors(pi).find(n => board[n] === opponent);
                    if (enemy !== undefined) {
                        board[pi] = 0;
                        board[enemy] = 0;
                        fxBurst(pi, '#fde047', 10, 1.5);
                        fxBurst(enemy, '#fde047', 10, 1.5);
                        fxText(pi, '中和!', '#fde047', 1000);
                    }
                });
                cleanUpPieces();
                // 中和後の窒息連を処理 (両者共通)
                for (let sweep = 0; sweep < 3; sweep++) {
                    let any = false;
                    [1, 2].forEach(p => {
                        const dead = getCapturedStones(board, p);
                        if (dead.length > 0) {
                            dead.forEach(i => { board[i] = 0; fxBurst(i, '#a5f3fc', 5, 1.0); });
                            captures[p === 1 ? 2 : 1] += dead.length;
                            any = true;
                        }
                    });
                    if (!any) break;
                }
                cleanUpPieces();
            }

            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            電圧碁: 着手石と最初に接触した敵石が中和して消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石は正負の電荷を持つ。着手した石が敵石に接すると、1対が中和して両方消える。',
            '中和は着手側にしか起きない — 接触させた側が相殺される。両者に同じルール。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(3, 3)] = 2; // 白石を手配置
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 黒を隣に → 中和
        assert('着手石は中和して消える', board[I(4, 3)] === 0);
        assert('接触した敵石も消える', board[I(3, 3)] === 0);
        // 同色は中和しない
        board[I(6, 6)] = 1;
        executeMove({ cells: [{ x: 7, y: 6 }] }, 1);
        assert('同色は中和しない', board[I(6, 6)] === 1 && board[I(7, 6)] === 1);
        assert('着手できる', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
