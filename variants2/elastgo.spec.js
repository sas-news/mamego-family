// ELASTGO — 伸縮碁: 伸び縮みするピース。1〜3連の長さを選んで置く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'elastgo.html',
    en: 'ELASTGO',
    jp: '伸縮碁',
    prefix: 'elastgo',
    desc: '伸び縮みするピース。1〜3連の長さを選んで置く。',
    kind: 'stone',
    spec: [
        ...K.rb('ELASTGO', '伸縮碁', 'elastgo'),
        K.params([
            { key: 'max_len', label: 'ピースの最大の長さ', min: 1, max: 5, def: 3, unit: '連' },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        function buildElastOris() {
            const L = Math.max(1, P('max_len') || 3);
            ORIENTATIONS.STONE = [];
            for (let l = 1; l <= L; l++) {
                ORIENTATIONS.STONE.push(Array.from({ length: l }, (_, k) => [k, 0]));
                if (l > 1) ORIENTATIONS.STONE.push(Array.from({ length: l }, (_, k) => [0, k]));
            }
        }
        buildElastOris();
        // 設定変更でピース形を即時再構成
        function onVariantParam(p) { if (p.key === 'max_len') buildElastOris(); }`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 1;`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 形状チェック: 着手できるのはこのゲームの専用の形のみ
            {
                const _norm = (cs) => {
                    const _mx = Math.min(...cs.map(c => c.x));
                    const _my = Math.min(...cs.map(c => c.y));
                    return cs.map(c => (c.x - _mx) + ',' + (c.y - _my)).sort().join(';');
                };
                const _cur = _norm(cells);
                const _allow = (ORIENTATIONS[currentPieceType] || []).map(s => _norm(s.map(([x, y]) => ({ x, y }))));
                if (!_allow.includes(_cur)) return false;
            }`],
        [K.ONE, K.RV_BASE, K.rv(['着手は伸縮ピース: 1・2・3連の長さを ⟳ボタン・Rキー・右クリック・ホイールで選ぶ。','短くして隙間に置くか、伸ばして一気に地を取るか。'])],
        // 伸縮ピース: 連結セル間にバネ (コイル) を描く
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
            // ピースの各結合にバネのコイル (伸縮のイメージ)
            pieces.forEach(pc => {
                const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                if (alive.length < 2) return;
                const aset = new Set(alive.map(p => p.y * BOARD_SIZE + p.x));
                ctx.save();
                ctx.strokeStyle = 'rgba(70,70,70,0.55)';
                ctx.lineWidth = Math.max(1, cellSize * 0.055);
                alive.forEach(p => {
                    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                        if (!aset.has((p.y + dy) * BOARD_SIZE + (p.x + dx))) return;
                        const x0 = padding + p.x * cellSize, y0 = padding + p.y * cellSize;
                        const x1 = x0 + dx * cellSize, y1 = y0 + dy * cellSize;
                        const px2 = -dy, py2 = dx; // コイルの振り方向
                        ctx.beginPath();
                        ctx.moveTo(x0, y0);
                        for (let k = 1; k <= 4; k++) {
                            const t = k / 5, zig = (k % 2 === 0 ? -1 : 1) * cellSize * 0.13;
                            ctx.lineTo(x0 + (x1 - x0) * t + px2 * zig, y0 + (y1 - y0) * t + py2 * zig);
                        }
                        ctx.lineTo(x1, y1);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            });
        }

        let fxPrevMove = null;`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        assert('1連も置ける', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        assert('3連も置ける', isValidPlacement([{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }] }, 1);
        assert('3石置かれた', [4,5,6].every(x => board[6 * BOARD_SIZE + x] === 1));
        assert('4連は形違いで不可', isValidPlacement([{ x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }], 1) === false);
    
    `,
};
