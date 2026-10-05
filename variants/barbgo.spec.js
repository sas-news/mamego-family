// BARBGO — 槍碁: 1x5の槍ピースだけを置く碁。長い槍で盤を貫く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'barbgo.html',
    en: 'BARBGO',
    jp: '槍碁',
    prefix: 'barbgo',
    desc: '1x5の槍ピースだけを置く碁。長い槍で盤を貫く。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('BARBGO', '槍碁', 'barbgo'),
        K.params([
            { key: 'spear_len', label: '槍の長さ', options: [{ v: 3, l: '1x3' }, { v: 4, l: '1x4' }, { v: 5, l: '1x5' }], def: 5 },
            { key: 'suff_min', label: '窒息領域の閾値', min: 2, max: 8, def: 5, unit: 'マス', hint: 'このマス数未満の連結空領域は死に領域' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, `            ORIENTATIONS[type] = list;
        });`, `            ORIENTATIONS[type] = list;
        });

        // このバリアントの専用ピース形 (回転=⟳ボタン・Rキー・右クリック・ホイール)
        ORIENTATIONS.STONE = [[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[0,1],[0,2],[0,3],[0,4]]];
        // 槍の長さは設定で調整可能 (変更時にピース形を即時再構成)
        function onVariantParam(p) {
            if (p.key === 'spear_len') {
                const n = Math.max(3, p.val || 5);
                ORIENTATIONS.STONE = [Array.from({ length: n }, (_, i) => [i, 0]), Array.from({ length: n }, (_, i) => [0, i])];
            }
        }`],
        [K.ONE, `        const PIECE_SIZE = Math.min(...PIECE_TYPES.map(t => PIECE_DEFS[t].length));`, `        const PIECE_SIZE = 5;`],
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
        // 窒息領域の閾値は設定で調整可能
        [K.ONE, `                if (region.length < PIECE_SIZE) {`, `                if (region.length < (P('suff_min') || PIECE_SIZE)) {`],
        [K.ONE, K.RV_BASE, K.rv(['着手は1x5の槍ピースのみ (回転=⟳ボタン・Rキー・右クリック・ホイール)。','ピースが入らない5マス未満の連結空領域は窒息領域。'])],
        // 槍の質感: 5連セルに柄と穂先を重ねる (黒→右/下、白→左/上で対向)
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                pieces.forEach(pc => {
                    const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);
                    if (alive.length < 2) return;
                    const xs = alive.map(p => p.x), ys = alive.map(p => p.y);
                    const horiz = ys.every(y => y === ys[0]);
                    let a, b;
                    if (horiz) {
                        a = alive.find(p => p.x === Math.min(...xs));
                        b = alive.find(p => p.x === Math.max(...xs));
                    } else {
                        a = alive.find(p => p.y === Math.min(...ys));
                        b = alive.find(p => p.y === Math.max(...ys));
                    }
                    const ax = padding + a.x * cellSize, ay = padding + a.y * cellSize;
                    const bx = padding + b.x * cellSize, by = padding + b.y * cellSize;
                    ctx.strokeStyle = pc.player === 1 ? 'rgba(166,124,74,0.95)' : 'rgba(92,74,54,0.9)';
                    ctx.lineWidth = cellSize * 0.16;
                    ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
                    const tip = pc.player === 1 ? b : a;
                    const base = pc.player === 1 ? a : b;
                    const dx = tip.x - base.x, dy = tip.y - base.y;
                    const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
                    const tx = padding + tip.x * cellSize, ty = padding + tip.y * cellSize;
                    const g = ctx.createLinearGradient(tx, ty, tx + ux * cellSize, ty + uy * cellSize);
                    g.addColorStop(0, '#e2e8f0'); g.addColorStop(1, '#64748b');
                    ctx.fillStyle = g;
                    const bw = cellSize * 0.20;
                    ctx.beginPath();
                    ctx.moveTo(tx - uy * bw, ty + ux * bw);
                    ctx.lineTo(tx + ux * cellSize * 0.95, ty + uy * cellSize * 0.95);
                    ctx.lineTo(tx + uy * bw, ty - ux * bw);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = 'rgba(30,30,30,0.5)'; ctx.lineWidth = 1; ctx.stroke();
                });
                ctx.restore();
            }`),
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
        const sp = [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }];
        assert('槍は置ける', isValidPlacement(sp, 1) === true);
        executeMove({ cells: sp }, 1);
        assert('5石置かれた', [2,3,4,5,6].every(x => board[5 * BOARD_SIZE + x] === 1));
        assert('直三は形違いで不可', isValidPlacement([{ x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }], 1) === false);
    
    `,
};
