// PIECECHAINGO — 鎖碁: 鎖で繋がった2石ピース。2マス内ならどんな間隔でも置ける。
const K = require('../gen_kit.js');
module.exports = {
    file: 'piecechaingo.html',
    en: 'PIECECHAINGO',
    jp: '鎖碁',
    prefix: 'piecechaingo',
    desc: '鎖で繋がった2石ピース。2マス内ならどんな間隔でも置ける。',
    kind: 'stone',
    spec: [
        ...K.rb('PIECECHAINGO', '鎖碁', 'piecechaingo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,1]],[[0,1],[1,0]],[[0,0],[2,0]],[[0,0],[0,2]],[[0,1],[2,0]],[[0,0],[1,2]],[[0,0],[2,1]],[[0,2],[1,0]],[[0,0],[2,2]],[[0,2],[2,0]]];`],
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
        ...K.STONE_MARKS_SPEC(`            // 鎖: 2石ペア同士を細い鎖線で結ぶ
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.8);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(padding + alive[0].x * cellSize, padding + alive[0].y * cellSize);
                    ctx.lineTo(padding + alive[1].x * cellSize, padding + alive[1].y * cellSize);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv(['着手は鎖で繋がった2石ピース。縦横斜め2マス以内ならどんな離れ方でも置ける (向き=Rキー・右クリック・ホイール)。','鎖は目印: 2石は別々の連として呼吸する (取られるのは別々)。'])],
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
