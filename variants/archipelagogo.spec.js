// ARCHIPELAGOGO — 群島碁: 盤は散在する小島群。港同士は「船」で直接繋がる
const K = require('../gen_kit.js');
module.exports = {
    file: 'archipelagogo.html',
    en: 'ARCHIPELAGOGO',
    jp: '群島碁',
    prefix: 'archipelagogo',
    desc: '散在する5つの小島。各島の港は他島の港と直接近傍する (船渡し)。',
    kind: 'stone',
    icon: 'archipelagogo',
    spec: [
        ...K.rb('ARCHIPELAGOGO', '群島碁', 'archipelagogo'),
        K.params([
            { key: 'isle_radius', label: '島の半径', min: 0.05, max: 0.35, def: 0.155, step: 0.005, hint: '盤サイズ×係数' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 群島: 5つの島。島の中心に近いマスが陸、他は海
        const ISLE_F = [
            [0.24, 0.24], [0.76, 0.24], [0.24, 0.76], [0.76, 0.76], [0.5, 0.5],
        ];
        const ISLE_R = () => BOARD_SIZE * (P('isle_radius') || 0.155);
        function isIsle(x, y) {
            return ISLE_F.some(([fx, fy]) =>
                Math.hypot(x - fx * (BOARD_SIZE - 1), y - fy * (BOARD_SIZE - 1)) <= ISLE_R());
        }
        // 各島で盤中心に最も近いマスが「港」— 港同士は全て互いに近傍する
        let ISLE_PORTS = [];
        let PORT_SET = new Set();
        // 島の半径は設定で調整可能 (変更時に港を即時再構成)
        function rebuildPorts() {
            ISLE_PORTS = [];
            ISLE_F.forEach(([fx, fy]) => {
                let best = -1, bd = 1e9;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.hypot(x - fx * (BOARD_SIZE - 1), y - fy * (BOARD_SIZE - 1)) > ISLE_R()) continue;
                    const dc = Math.hypot(x - (BOARD_SIZE - 1) / 2, y - (BOARD_SIZE - 1) / 2);
                    if (dc < bd) { bd = dc; best = y * BOARD_SIZE + x; }
                }
                if (best >= 0) ISLE_PORTS.push(best);
            });
            PORT_SET = new Set(ISLE_PORTS);
        }
        rebuildPorts();
        function onVariantParam(p) {
            if (p.key === 'isle_radius') rebuildPorts();
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isIsle(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 近傍: 通常の4近傍 + 港は全港と相互接続 (船)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 港は他島の港と直接繋がる (船渡し)
            if (PORT_SET.has(idx)) {
                ISLE_PORTS.forEach(p => { if (p !== idx) neighbors.push(p); });
            }

            return neighbors;
        }`],
        // 海の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        // 海を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        // 港と航路の描画 (石の下層: 格子の直前)
        K.CUE_GRID(`            // 群島: 港と航路の描画
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(125,211,252,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.22, cellSize * 0.22]);
                for (let a = 0; a < ISLE_PORTS.length; a++) {
                    for (let b = a + 1; b < ISLE_PORTS.length; b++) {
                        const pa = ISLE_PORTS[a], pb = ISLE_PORTS[b];
                        ctx.beginPath();
                        ctx.moveTo(padding + (pa % BOARD_SIZE) * cellSize, padding + Math.floor(pa / BOARD_SIZE) * cellSize);
                        ctx.lineTo(padding + (pb % BOARD_SIZE) * cellSize, padding + Math.floor(pb / BOARD_SIZE) * cellSize);
                        ctx.stroke();
                    }
                }
                ctx.setLineDash([]);
                ctx.strokeStyle = 'rgba(125,211,252,0.8)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.08);
                ISLE_PORTS.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(padding + (p % BOARD_SIZE) * cellSize, padding + Math.floor(p / BOARD_SIZE) * cellSize, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            群島碁: 5つの小島。島の港は他島の港と直接近傍する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は5つの小島の群島 — 島の外は海 (着手不可・呼吸なし)。',
            '各島の港 (白丸) は他島の港と直接近傍する。港を押さえると島間の連が成立する。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('島の数だけ港がある', ISLE_PORTS.length === ISLE_F.length);
        assert('港同士は近傍', getNeighbors(ISLE_PORTS[0]).includes(ISLE_PORTS[1]));
        assert('海は壁', board[I(0, Math.floor(BOARD_SIZE / 2))] === 3);
        const pi = ISLE_PORTS[0];
        assert('港には置ける', board[pi] === 0 && isValidPlacement([{ x: pi % BOARD_SIZE, y: Math.floor(pi / BOARD_SIZE) }], 1) === true);
    `,
};
