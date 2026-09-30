// ARCHGO — 拱碁: 石の上に橋を架ける3連ピース。自石を橋桁にして渡る。
const K = require('../gen_kit.js');
module.exports = {
    file: 'archgo.html',
    en: 'ARCHGO',
    jp: '拱碁',
    prefix: 'archgo',
    desc: '石の上に橋を架ける3連ピース。自石を橋桁にして渡る。',
    kind: 'stone',
    spec: [
        ...K.rb('ARCHGO', '拱碁', 'archgo'),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]]];`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 3;`],
        [K.ONE, `        function isValidPlacement(cells, player) {
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 仮配置
            const tempBoard = [...board];
            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });

            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;

            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;
        }`, `        function isValidPlacement(cells, player) {
            // 拱碁: 1x3の橋ピース。両端は空点、中点は空点か自分の石 (自分の石を橋桁にする)
            if (cells.length !== 3) return false;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
            }
            // 形状: 3連直線のみ
            {
                const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
                const isH = ys.every(y => y === ys[0]) && (Math.max(...xs) - Math.min(...xs) === 2);
                const isV = xs.every(x => x === xs[0]) && (Math.max(...ys) - Math.min(...ys) === 2);
                if (!isH && !isV) return false;
            }
            const mid = cells[1];
            for (const p of [cells[0], cells[2]]) {
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }
            {
                const mv = board[mid.y * BOARD_SIZE + mid.x];
                if (mv !== 0 && mv !== player) return false;
            }

            // 仮配置 (中点が自分の石なら同色の上書き=問題なし)
            const tempBoard = [...board];
            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });

            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;

            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;
        }`],
        ...K.STONE_MARKS_SPEC(`            // 橋: 各ピースの3セルを繋ぐ帯を薄く描く
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.12);
                ctx.lineCap = 'round';
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(padding + alive[0].x * cellSize, padding + alive[0].y * cellSize);
                    ctx.lineTo(padding + alive[alive.length - 1].x * cellSize, padding + alive[alive.length - 1].y * cellSize);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv(['着手は1x3の橋ピース (回転=Rキー・右クリック・ホイール)。両端が空点なら、中点が自分の石でも上に架けられる。','自分の石を橋桁にして連を伸ばす。中点が敵石なら架けられない。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        const arch = [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }];
        assert('空の橋は架けられる', isValidPlacement(arch, 1) === true);
        board[3 * BOARD_SIZE + 4] = 1; // 中点に自石
        assert('自石上の橋は架けられる', isValidPlacement(arch, 1) === true);
        executeMove({ cells: arch }, 1);
        assert('両端に石が置かれた', board[3 * BOARD_SIZE + 3] === 1 && board[3 * BOARD_SIZE + 5] === 1);
        board.fill(0);
        board[3 * BOARD_SIZE + 4] = 2; // 中点に敵石
        assert('敵石上には架けられない', isValidPlacement(arch, 1) === false);
        
    `,
};
