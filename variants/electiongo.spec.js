// ELECTIONGO — 選挙碁: 盤は9つの選挙区。各区で石が多い側が制して+4目
const K = require('../gen_kit.js');
module.exports = {
    file: 'electiongo.html',
    en: 'ELECTIONGO',
    jp: '選挙碁',
    prefix: 'electiongo',
    desc: '石は有権者。9つの選挙区で石の多い側が区を制して+4目。',
    kind: 'stone',
    icon: 'electiongo',
    spec: [
        ...K.rb('ELECTIONGO', '選挙碁', 'electiongo'),
        K.params([
            { key: 'districts', label: '選挙区の分割', options: [{ v: 2, l: '2x2 (4区)' }, { v: 3, l: '3x3 (9区)' }, { v: 4, l: '4x4 (16区)' }], def: 3 },
            { key: 'district_pts', label: '選挙区ボーナス', min: 0, max: 12, def: 4, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let electionDetail = { 1: 0, 2: 0 }; // 直近終局で制した選挙区の数`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 選挙ルール: 9つの選挙区で石が多い側が区を制して+4目
            const g = Math.max(1, P('districts') || 3);
            const distB = new Array(g * g).fill(0), distW = new Array(g * g).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const d = Math.min(g - 1, Math.floor(x * g / BOARD_SIZE)) * g +
                          Math.min(g - 1, Math.floor(y * g / BOARD_SIZE));
                if (v === 1) distB[d]++; else distW[d]++;
            }
            let wB = 0, wW = 0;
            for (let d = 0; d < g * g; d++) {
                if (distB[d] > distW[d]) wB++;
                else if (distW[d] > distB[d]) wW++;
            }
            electionDetail = { 1: wB, 2: wW };
            territory.black += wB * (P('district_pts') || 4);
            territory.white += wW * (P('district_pts') || 4);`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        K.CUE_GRID(`            // 選挙区の区画線 (3x3の9区)
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.5);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.045);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.14]);
                for (let k = 1; k < (P('districts') || 3); k++) {
                    const pos = padding + Math.round(BOARD_SIZE * k / (P('districts') || 3) - 0.5) * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(pos, padding); ctx.lineTo(pos, padding + (BOARD_SIZE - 1) * cellSize);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(padding, pos); ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, pos);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は有権者。盤は3x3の9つの選挙区に分かれ、各区で石の多い側が区を制する。',
            '制した区1つにつき+4目 (通常の地とアゲハマも有効)。区内の数を競え — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 左上区で黒2
        executeMove({ cells: [{ x: 12, y: 12 }] }, 2); // 右下区で白1
        endGameByScore();
        assert('左上区を黒が制す', electionDetail[1] === 1);
        assert('右下区を白が制す', electionDetail[2] === 1);
        assert('終局する', gameOver === true);
    `,
};
