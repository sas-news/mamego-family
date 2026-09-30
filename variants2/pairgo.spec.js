// PAIRGO — 対碁: 桂馬の位置に離れた2石のペアを置く碁。
const K = require('../gen_kit.js');
module.exports = {
    file: 'pairgo.html',
    en: 'PAIRGO',
    jp: '対碁',
    prefix: 'pairgo',
    desc: '桂馬の位置に離れた2石のペアを置く碁。',
    kind: 'stone',
    spec: [
        ...K.rb('PAIRGO', '対碁', 'pairgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,2]],[[0,0],[2,1]],[[0,1],[2,0]],[[1,0],[0,2]]];`],
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
        [K.ONE, K.RV_ALGO, K.rv(['着手は桂馬飛びの位置にある2石ペア (向き=⟳ボタン・Rキー・右クリック・ホイール)。','2石は離れているので別々の連。桂馬の跳び先で制圧する。'])],
        // 桂馬ペア: 生きている2石同士を淡い連携線で結ぶ
        ...K.STONE_MARKS_SPEC(`            // 桂馬ペアの連携線
            {
                ctx.save();
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.10]);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length !== 2) return;
                    const a = alive[0], b = alive[1];
                    ctx.strokeStyle = pc.player === 1 ? 'rgba(30,30,30,0.55)' : 'rgba(255,255,255,0.75)';
                    ctx.beginPath();
                    ctx.moveTo(padding + a.x * cellSize, padding + a.y * cellSize);
                    ctx.lineTo(padding + b.x * cellSize, padding + b.y * cellSize);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const kn = [{ x: 4, y: 4 }, { x: 5, y: 6 }];
        assert('桂馬ペアは置ける', isValidPlacement(kn, 1) === true);
        executeMove({ cells: kn }, 1);
        assert('2石置かれた', board[4 * BOARD_SIZE + 4] === 1 && board[6 * BOARD_SIZE + 5] === 1);
        assert('隣接ドミノは形違いで不可', isValidPlacement([{ x: 8, y: 8 }, { x: 9, y: 8 }], 1) === false);
        assert('ペア石は非連結', getNeighbors(4 * BOARD_SIZE + 4).includes(6 * BOARD_SIZE + 5) === false);
    
    `,
};
