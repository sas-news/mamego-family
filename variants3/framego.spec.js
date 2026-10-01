// FRAMEGO — 骨組碁: 星点の石は「柱」(+1目)、3個以上の直線連は「梁」(+1目/本)
const K = require('../gen_kit.js');
module.exports = {
    file: 'framego.html',
    en: 'FRAMEGO',
    jp: '骨組碁',
    prefix: 'framego',
    desc: '星点の石は柱、3連以上の直線は梁。建物の骨組みを作るほど得点。',
    kind: 'stone',
    icon: 'framego',
    spec: [
        ...K.rb('FRAMEGO', '骨組碁', 'framego'),
        K.params([
            { key: 'pillar_pts', label: '柱1本の得点', min: 1, max: 4, def: 1, unit: '目' },
            { key: 'beam_pts', label: '梁1本の得点', min: 1, max: 4, def: 1, unit: '目' },
            { key: 'beam_len', label: '梁になる長さ', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let frameDetail = { 1: 0, 2: 0 }; // 直近終局で計上した柱+梁ボーナス`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 骨組ルール: 星点上の自石は「柱」+1目、縦横に3個以上連なる同色の並びは「梁」+1目/本
            const _pp = P('pillar_pts') || 1, _bp = P('beam_pts') || 1, _bl = P('beam_len') || 3;
            let pB = 0, pW = 0, bB = 0, bW = 0;
            getStarPoints(BOARD_SIZE).forEach(pt => {
                const i = pt.y * BOARD_SIZE + pt.x;
                if (board[i] === 1) pB++; else if (board[i] === 2) pW++;
            });
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = 0, col = 0;
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const v = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : 0;
                    if (v === col) { run++; continue; }
                    if (run >= _bl) { if (col === 1) bB++; else if (col === 2) bW++; }
                    col = v; run = 1;
                }
            }
            for (let x = 0; x < BOARD_SIZE; x++) {
                let run = 0, col = 0;
                for (let y = 0; y <= BOARD_SIZE; y++) {
                    const v = y < BOARD_SIZE ? board[y * BOARD_SIZE + x] : 0;
                    if (v === col) { run++; continue; }
                    if (run >= _bl) { if (col === 1) bB++; else if (col === 2) bW++; }
                    col = v; run = 1;
                }
            }
            frameDetail = { 1: pB * _pp + bB * _bp, 2: pW * _pp + bW * _bp };
            territory.black += pB * _pp + bB * _bp;
            territory.white += pW * _pp + bW * _bp;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 柱: 星点上の石に金色の角柱マーク
            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(pt => {
                    const i = pt.y * BOARD_SIZE + pt.x;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    const s = cellSize * 0.42;
                    ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は建物の骨組み。星点に置いた石は「柱」、縦横に3個以上連なった並びは「梁」。',
            '柱は1つ+1目、梁は1本+1目。両者同じ条件で骨組みの強度を競う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 2 }] }, 1); // 横方向3連の梁
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 星点の柱 (13路の星)
        endGameByScore();
        assert('柱+梁が計上される', frameDetail[1] === 2);
        assert('白には骨組みなし', frameDetail[2] === 0);
        assert('終局する', gameOver === true);
    `,
};
