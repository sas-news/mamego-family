// GRAVWELLGO — 重力井碁: 中央に「重力源」。着手ごとに全石が重力源へ1マス引き寄せられる
const K = require('../gen_kit.js');
module.exports = {
    file: 'gravwellgo.html',
    en: 'GRAVWELLGO',
    jp: '重力井碁',
    prefix: 'gravwellgo',
    desc: '中央の重力源。着手のたび全石が中心へ1マス引き寄せられる。',
    kind: 'stone',
    icon: 'gravwellgo',
    spec: [
        ...K.rb('GRAVWELLGO', '重力井碁', 'gravwellgo'),
        // 重力井: 着手後、全石が中心へ1マス引き寄せられる (中心に近い順)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 重力井: 全石が中心へ1マス引き寄せられる
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const dist = i => Math.abs(i % BOARD_SIZE - cc) + Math.abs(Math.floor(i / BOARD_SIZE) - cc);
                const order = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1 || board[i] === 2) order.push(i);
                }
                order.sort((a, b) => dist(a) - dist(b));
                order.forEach(i => {
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const dx = Math.sign(cc - x), dy = Math.sign(cc - y);
                    const cand = [];
                    if (Math.abs(cc - x) >= Math.abs(cc - y)) {
                        if (dx) cand.push([x + dx, y]);
                        if (dy) cand.push([x, y + dy]);
                    } else {
                        if (dy) cand.push([x, y + dy]);
                        if (dx) cand.push([x + dx, y]);
                    }
                    for (const [nx, ny] of cand) {
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] === 0) {
                            board[ni] = board[i];
                            board[i] = 0;
                            fxSlide(i, ni, 320);
                            break;
                        }
                    }
                });
                cleanUpPieces();
                // 引き寄せで窒息した連は落下死 (両者共通)
                for (let sweep = 0; sweep < 3; sweep++) {
                    let any = false;
                    [1, 2].forEach(p => {
                        const dead = getCapturedStones(board, p);
                        if (dead.length > 0) {
                            dead.forEach(i => { board[i] = 0; fxBurst(i, '#a78bfa', 5, 1.0); });
                            captures[p === 1 ? 2 : 1] += dead.length;
                            any = true;
                        }
                    });
                    if (!any) break;
                }
                cleanUpPieces();
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 重力源の描画 (星の直前: 渦巻く井戸)
        K.CUE_STARS(`            // 重力源: 中心の黒い井戸と吸い込みリング
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const cx = padding + cc * cellSize, cy = padding + cc * cellSize;
                const now = fxNow();
                ctx.save();
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 1.3);
                g.addColorStop(0, 'rgba(10,10,20,0.9)');
                g.addColorStop(0.55, 'rgba(60,40,120,0.35)');
                g.addColorStop(1, 'rgba(60,40,120,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 1.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(167,139,250,' + (0.5 + Math.sin(now / 500) * 0.2) + ')';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let k = 0; k < 2; k++) {
                    const rr = cellSize * (0.55 + k * 0.3 + Math.sin(now / 700 + k) * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, rr, now / 900 + k * 2, now / 900 + k * 2 + Math.PI * 1.3);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            重力井碁: 中央の重力源へ、着手のたび全石が1マス引き寄せられる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央に重力源がある。着手ごとに全ての石が中心へ1マス引き寄せられる。',
            '引き寄せは両者に同じく働く。押し込まれて窒息した連は落下死 (相手のアゲハマ)。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const cc = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 角石は着手直後に中心へ引かれる
        assert('角石が中心へ引かれる', board[I(0, 0)] === 0 && (board[I(1, 0)] === 1 || board[I(0, 1)] === 1));
        executeMove({ cells: [{ x: cc, y: cc }] }, 2); // 重力源直上は動かない
        assert('中心の石は動かない', board[I(cc, cc)] === 2);
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1);
        assert('着手できる', isValidPlacement([{ x: 3, y: 3 }], 2) === true);
        assert('盤上に石が残る', board.some(v => v === 1 || v === 2));
    `,
};
