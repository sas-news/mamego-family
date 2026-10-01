// CRUMBGO — 崩落碁: 3手ごとに全ての連 (2石以上) が端から1石ずつ崩れていく
const K = require('../gen_kit.js');
module.exports = {
    file: 'crumbgo.html',
    en: 'CRUMBGO',
    jp: '崩落碁',
    prefix: 'crumbgo',
    desc: '全ての連は3手ごとに端から1石ずつ崩れていく。240手で自動終局。',
    kind: 'stone',
    spec: [
        ...K.rb('CRUMBGO', '崩落碁', 'crumbgo'),
        K.params([
            { key: 'crumb_interval', label: '崩落の間隔', min: 1, max: 10, def: 3, unit: '手' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 480, def: 240, unit: '手' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 崩落: 3手ごとに全ての連 (2石以上) が最も露出した端から1石ずつ崩れる。
            //       (着手より崩れの方が遅いので盤は少しずつ埋まり終盤へ進む)
            if (history.length % Math.max(1, P('crumb_interval') || 3) === 0) {
                const snapB = [...board];
                const seen = new Set();
                const groups = [];
                for (let i = 0; i < snapB.length; i++) {
                    const v = snapB[i];
                    if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                    const grp = [];
                    const q = [i]; seen.add(i);
                    while (q.length > 0) {
                        const c = q.shift(); grp.push(c);
                        getNeighbors(c).forEach(n => { if (snapB[n] === v && !seen.has(n)) { seen.add(n); q.push(n); } });
                    }
                    groups.push({ v, grp });
                }
                let fell = 0;
                groups.forEach(({ v, grp }) => {
                    if (grp.length < 2) return;
                    let tip = grp[0], tipN = 99;
                    grp.forEach(g => {
                        const fn = getNeighbors(g).filter(n => snapB[n] === v).length;
                        if (fn < tipN) { tipN = fn; tip = g; }
                    });
                    if (board[tip] === v) {
                        board[tip] = 0; fell++;
                        fxBurst(tip, 'rgba(140,110,80,0.85)', 9, 1.1); // 崩れ落ちる欠片
                    }
                });
                if (fell > 0) {
                    cleanUpPieces();
                    if (fell >= 3) fxShake(3.5, 240); // 多数が崩れると盤が揺れる
                }
            }

            // 崩落が盤を決して満たさないため、既定の手数で自動的に点数計算して終局 (無期限の延命を防ぐ)
            if (history.length >= (P('cap_moves') || 240) && !gameOver) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 崩れやすい端の石に亀裂マーク (※fxPrevMove 挿入後の現行アンカーを使用)
        [K.ONE, `                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }
        }

        let fxPrevMove = null;`,
`                    if (isDead) drawDeadMarker(cx, cy, r);
                }
            }

            // 特殊ルールの石マーク
            drawStoneMarks(padding, cellSize);
        }

        function drawStoneMarks(padding, cellSize) {
            // 崩れる端: 自連に1箇所しか繋がっていない石に亀裂点
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const fn = getNeighbors(i).filter(n => board[n] === v).length;
                if (fn > 1) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                ctx.save();
                ctx.strokeStyle = 'rgba(120, 90, 60, 0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                const rr = cellSize * 0.14;
                ctx.beginPath();
                ctx.moveTo(cx - rr, cy - rr); ctx.lineTo(cx, cy); ctx.lineTo(cx + rr * 0.4, cy - rr * 0.6);
                ctx.stroke();
                ctx.restore();
            }
        }

        let fxPrevMove = null;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '3手ごとに、盤上の全ての連 (2石以上) が最も露出した端から1石ずつ崩れる。',
            '崩れた石は誰の取り分にもならずただ消える。大きな連を保つには絶えず修復が要る。',
            '240手に達したら自動的に点数計算して終局。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 7] = 1;
        board[9 * BOARD_SIZE + 9] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 1手目: 崩落なし
        assert('1手目は崩れない', board.filter(v => v === 1).length === 4); // 3連 + 着手1
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2); // 2手目: 崩落なし
        assert('2手目も崩れない', board.filter(v => v === 1).length === 4);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1); // 3手目: 崩落
        assert('3手目に3連が端から崩れる', board.filter(v => v === 1).length === 4); // 3連-1 + 着手2
        assert('白単石は崩れない', board[9 * BOARD_SIZE + 9] === 2);
        assert('崩れた石は誰の取りにもならない', captures[1] === 0 && captures[2] === 0);
        // 手数上限で自動終局
        history = new Array(239).fill(null); gameOver = false;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('240手で自動終局', gameOver === true);
    `,
};
