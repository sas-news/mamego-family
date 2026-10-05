// ARCHGO — 拱碁: 石の上に橋を架ける3連ピース。自石を橋桁にして渡る。
const K = require('../gen_kit.js');
module.exports = {
    file: 'archgo.html',
    en: 'ARCHGO',
    jp: '拱碁',
    prefix: 'archgo',
    desc: '石の上に橋を架ける3連ピース。自石を橋桁にして渡る。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('ARCHGO', '拱碁', 'archgo'),
        K.params([
            { key: 'suff_min', label: '窒息領域の閾値', min: 2, max: 6, def: 3, unit: 'マス', hint: 'このマス数未満の連結空領域は死に領域' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
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
        ...K.STONE_MARKS_SPEC(`            // 橋: 3セルを繋ぐ反ったアーチ + 中点が自石なら橋桁を下ろす
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.6);
                ctx.lineCap = 'round';
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length < 2) return;
                    const ax = padding + alive[0].x * cellSize, ay = padding + alive[0].y * cellSize;
                    const bx = padding + alive[alive.length - 1].x * cellSize, by = padding + alive[alive.length - 1].y * cellSize;
                    const mx = (ax + bx) / 2, my = (ay + by) / 2;
                    const horiz = alive[0].y === alive[alive.length - 1].y;
                    const lift = cellSize * 0.55;
                    // アーチ本体: 弦から持ち上げた2次曲線
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.12);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.quadraticCurveTo(horiz ? mx : mx - lift, horiz ? my - lift : my, bx, by);
                    ctx.stroke();
                    // 橋桁: 中点の自石からアーチへ下ろす支柱
                    const mid = alive[1];
                    if (mid) {
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.moveTo(mx, my);
                        ctx.lineTo(horiz ? mx : mx - lift * 0.72, horiz ? my - lift * 0.72 : my);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        // 窒息領域の閾値は設定で調整可能
        [K.ONE, `                if (region.length < PIECE_SIZE) {`, `                if (region.length < (P('suff_min') || PIECE_SIZE)) {`],
        [K.ONE, K.RV_BASE, K.rv(['着手は1x3の橋ピース (回転=⟳ボタン・Rキー・右クリック・ホイール)。両端が空点なら、中点が自分の石でも上に架けられる。','自分の石を橋桁にして連を伸ばす。中点が敵石なら架けられない。'])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
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
