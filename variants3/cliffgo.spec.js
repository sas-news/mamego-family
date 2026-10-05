// CLIFFGO — 岩壁碁: 盤の一部が崖。崖の縁に置いた石は崖下へ落ちる
const K = require('../gen_kit.js');
module.exports = {
    file: 'cliffgo.html',
    en: 'CLIFFGO',
    jp: '岩壁碁',
    prefix: 'cliffgo',
    desc: '盤を横断する崖。縁の石は崖下へ落下して結合する。',
    kind: 'stone',
    icon: 'cliffgo',
    spec: [
        ...K.rb('CLIFFGO', '岩壁碁', 'cliffgo'),
        K.params([
            { key: 'cliff_ratio', label: '崖の位置', min: 0, max: 0.9, step: 0.05, def: 0, hint: '0=自動 (盤の55%の行)' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 岩壁: cliffY() が崖下の最上段。その1つ上の行が「縁」— 縁の石は崖下へ落ちる
        const cliffY = () => Math.floor(BOARD_SIZE * (P('cliff_ratio') || 0.55));`],
        // 崖落ち: 着手ごとに縁の石が崖下へ落下 (下の列から順に処理)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 岩壁: 縁の石は崖下へ落下
            {
                const lipY = cliffY() - 1;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const li = lipY * BOARD_SIZE + x;
                    if (board[li] !== 1 && board[li] !== 2) continue;
                    // 崖下方向に空きがあるかぎり落ち続ける
                    let y = cliffY();
                    while (y + 1 < BOARD_SIZE && board[(y + 1) * BOARD_SIZE + x] === 0) y++;
                    const ti = y * BOARD_SIZE + x;
                    if (board[ti] === 0) {
                        board[ti] = board[li];
                        board[li] = 0;
                        fxSlide(li, ti, 380);
                    }
                }
                cleanUpPieces();
                // 落下で窒息した連は崖死 (両者共通)
                for (let sweep = 0; sweep < 3; sweep++) {
                    let any = false;
                    [1, 2].forEach(p => {
                        const dead = getCapturedStones(board, p);
                        if (dead.length > 0) {
                            dead.forEach(i => { board[i] = 0; fxBurst(i, '#a8a29e', 5, 1.0); });
                            captures[p === 1 ? 2 : 1] += dead.length;
                            any = true;
                        }
                    });
                    if (!any) break;
                }
                cleanUpPieces();
            }

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 崖の描画 (格子線の直前: 縁線とハッチ)
        K.CUE_GRID(`            // 岩壁: 縁線と崖面のハッチ
            {
                ctx.save();
                const ey = padding + cliffY() * cellSize - cellSize / 2;
                ctx.strokeStyle = 'rgba(87,83,78,0.8)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize / 2, ey);
                ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, ey);
                ctx.stroke();
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.2, ey);
                    ctx.lineTo(cx - cellSize * 0.2, ey + cellSize * 0.35);
                    ctx.moveTo(cx + cellSize * 0.2, ey);
                    ctx.lineTo(cx + cellSize * 0.2, ey + cellSize * 0.22);
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgba(87,83,78,0.10)';
                ctx.fillRect(padding - cellSize / 2, ey, BOARD_SIZE * cellSize, cellSize * 0.4);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            岩壁碁: 盤を横断する崖。縁に置いた石は崖下へ落下する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤を横断する崖がある。崖の縁の石は崖下方向へ、空きがあるかぎり落下する。',
            '落下で下の石に積み上がって結合する。落下で窒息した連は崖死 (相手のアゲハマ)。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const cl = Math.floor(BOARD_SIZE * 0.55);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: cl - 1 }] }, 1); // 縁に着手 → 崖下へ落下
        assert('縁の石は崖下へ落ちる', board[I(2, cl - 1)] === 0);
        assert('崖下に着地する', board[I(2, BOARD_SIZE - 1)] === 1);
        executeMove({ cells: [{ x: 2, y: cl - 1 }] }, 2); // 縁に再度 → 落下して積み上がる
        assert('積み上がる', board[I(2, BOARD_SIZE - 2)] === 2);
        assert('着手できる', isValidPlacement([{ x: 5, y: 1 }], 1) === true);
    `,
};
