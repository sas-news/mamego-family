// PIECECHAINGO — 鎖碁: 鎖で繋がった2石ピース。2マス内ならどんな間隔でも置ける。
const K = require('../gen_kit.js');
module.exports = {
    file: 'piecechaingo.html',
    en: 'PIECECHAINGO',
    jp: '鎖碁',
    prefix: 'piecechaingo',
    desc: '鎖で繋がった2石ピース。2マス内ならどんな間隔でも置ける。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('PIECECHAINGO', '鎖碁', 'piecechaingo'),
        K.params([{ key: 'link_len', label: '鎖の長さ', options: [{ v: 2, l: '2マス以内' }, { v: 3, l: '3マス以内' }], def: 2 }]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        function rebuildChain() {
            const L = Math.max(1, P('link_len') || 2);
            const shapes = [];
            for (let dy = 0; dy <= L; dy++) for (let dx = -L; dx <= L; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (dy === 0 && dx < 0) continue;
                shapes.push(dx < 0 ? [[0, dy], [-dx, 0]] : [[0, 0], [dx, dy]]);
            }
            ORIENTATIONS.STONE = shapes;
        }
        rebuildChain();
        function onVariantParam() { rebuildChain(); }`],
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
        ...K.STONE_MARKS_SPEC(`            // 鎖: 2石ペア同士を楕円リンクの鎖で結ぶ
            {
                ctx.save();
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length < 2) return;
                    const ax = padding + alive[0].x * cellSize, ay = padding + alive[0].y * cellSize;
                    const bx = padding + alive[1].x * cellSize, by = padding + alive[1].y * cellSize;
                    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
                    const ang = Math.atan2(dy, dx);
                    ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.85);
                    for (let k = 1; k <= 3; k++) {
                        const t = k / 4;
                        const lx = ax + dx * t, ly = ay + dy * t;
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                        ctx.beginPath();
                        ctx.ellipse(lx, ly, len * 0.11, cellSize * 0.09, ang + (k % 2 ? Math.PI / 2 : 0), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv(['着手は鎖で繋がった2石ピース。縦横斜め2マス以内ならどんな離れ方でも置ける (向き=⟳ボタン・Rキー・右クリック・ホイール)。','鎖は目印: 2石は別々の連として呼吸する (取られるのは別々)。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        assert('遠い鎖ペアは置ける', isValidPlacement([{ x: 4, y: 4 }, { x: 6, y: 5 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }, { x: 6, y: 5 }] }, 1);
        assert('2石置かれた', board[4 * BOARD_SIZE + 4] === 1 && board[5 * BOARD_SIZE + 6] === 1);
        assert('3マス先は届かない', isValidPlacement([{ x: 8, y: 8 }, { x: 11, y: 8 }], 1) === false);
    
    `,
};
