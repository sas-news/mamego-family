// PREDATORGO — 捕食碁: 石の強さは隣接する味方の数 (最大3)。強い石は隣の弱い敵石を食べる
const K = require('../gen_kit.js');
module.exports = {
    file: 'predatorgo.html',
    en: 'PREDATORGO',
    jp: '捕食碁',
    prefix: 'predatorgo',
    desc: '石の強さLvは1+隣接する味方の数 (最大3)。着手後、強い石は隣の弱い敵石を食べる。',
    kind: 'stone',
    icon: 'predatorgo',
    spec: [
        ...K.rb('PREDATORGO', '捕食碁', 'predatorgo'),
        K.params([{ key: 'lv_max', label: '強さLvの上限', min: 2, max: 6, def: 3 }, { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 300, def: 140, unit: '手' }]),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 石の強さLv = 1 + 直交隣接する同色の数 (最大3)
        function predLv(i, player) {
            let n = 0;
            getNeighbors(i).forEach(m => { if (board[m] === player) n++; });
            return Math.min((P('lv_max') || 3), 1 + n);
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 捕食ルール: 着手側の石が隣の弱い敵石を食べる (Lv が厳密に高い敵のみ)
            {
                const eaten = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    const my = predLv(i, player);
                    getNeighbors(i).forEach(n => {
                        if (board[n] === opponent && predLv(n, opponent) < my) eaten.push(n);
                    });
                }
                if (eaten.length) {
                    const uniq = [...new Set(eaten)];
                    uniq.forEach(i => {
                        board[i] = 0; captures[player]++;
                        fxBurst(i, '#f87171', 7, 1.5);
                    });
                    const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(pi, '捕食 x' + uniq.length, '#ef4444', 1200);
                    if (uniq.length >= 2) fxShake(4, 280);
                    cleanUpPieces();
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // Lv2以上の石に牙マーク
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const l = predLv(i, v);
                if (l < 2) continue;
                const dx = i % BOARD_SIZE, dy = Math.floor(i / BOARD_SIZE);
                const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                ctx.save();
                ctx.fillStyle = l >= 3 ? '#ef4444' : '#fb923c';
                for (let k = 0; k < l - 1; k++) {
                    ctx.beginPath();
                    ctx.arc(cx + (k - 0.5) * cellSize * 0.18, cy - cellSize * 0.34, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石の強さLvは1+隣接する味方の数 (最大3)。孤立石はLv1、味方2以上に接する石はLv3。',
            '着手後、自分の石は隣の「自分より低Lv」の敵石を食べる。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 2; // 白単体 (4,4) Lv1
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 黒 (4,5) Lv1 — 同格では食えない
        assert('同Lvでは食えない', board[4 * BOARD_SIZE + 4] === 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // (5,5) で黒同士が接続 → (4,5)はLv2へ
        assert('高Lvの石が低Lvを食べる', board[4 * BOARD_SIZE + 4] === 0 && captures[1] === 1);
        assert('強さは隣接味方数', predLv(5 * BOARD_SIZE + 4, 1) === 2);
    `,
};
