// STAIRGO — 階段碁: 段差のある階段状の盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'stairgo.html',
    en: 'STAIRGO',
    jp: '階段碁',
    prefix: 'stairgo',
    desc: '右へ行くほど高くなる階段盤。低い段からしか上へ登れない地形。',
    kind: 'stone',
    spec: [
        ...K.rb('STAIRGO', '階段碁', 'stairgo'),
        K.params([
            { key: 'step_w', label: '段の横幅', min: 1, max: 5, def: 2, unit: '列' },
            { key: 'step_h', label: '段の高さ', min: 1, max: 4, def: 2, unit: '段', hint: '新しい対局で反映' },
        ]),
        // 階段形状: 列ごとに2段ずつせり上がる (右端が最も高い)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const top = Math.max(0, (BOARD_SIZE - 1) - Math.floor(x / (P('step_w') || 2)) * (P('step_h') || 2));
                if (y < top) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 階段の質感: 石段ブロック (段の小口を明るい踏面で示す)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 壁セル: 石段の質感 (グレー石 + 目地 + 最上段は踏面ハイライト)
            {
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const px = padding + (x - 0.5) * cellSize, py = padding + (y - 0.5) * cellSize;
                    const g = ctx.createLinearGradient(px, py, px, py + cellSize);
                    g.addColorStop(0, '#6d6a63'); g.addColorStop(0.25, '#55534d'); g.addColorStop(1, '#3c3a36');
                    ctx.fillStyle = g;
                    ctx.fillRect(px, py, cellSize, cellSize);
                    // 石の目地
                    ctx.strokeStyle = 'rgba(30,28,25,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
                    ctx.beginPath();
                    ctx.moveTo(px, py + cellSize * 0.55);
                    ctx.lineTo(px + cellSize, py + cellSize * 0.55);
                    ctx.stroke();
                    // 段の小口 (直下が有効面なら明るい踏面)
                    if (y + 1 < BOARD_SIZE && !isV(x, y + 1)) {
                        ctx.fillStyle = 'rgba(200,196,185,0.85)';
                        ctx.fillRect(px, py + cellSize * 0.72, cellSize, cellSize * 0.28);
                    }
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は右へ2列ごとに1段高くなる階段状。削れた部分には置けない。',
            '低い段から高い段へ石を進めていく立体的な攻防。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('最下段の上は壁', board[0] === 3);
        assert('壁には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('最下段の裾は置ける', isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === true);
        assert('最高段の頂点は置ける', isValidPlacement([{ x: BOARD_SIZE - 1, y: 0 }], 1) === true);
        let walls = 0;
        for (const v of board) if (v === 3) walls++;
        assert('階段状に削れている', walls > 30);
    `,
};
