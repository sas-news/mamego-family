// PYRAGO — 金字塔碁: 同心の溝で分かれた3層ピラミッド盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'pyrago.html',
    en: 'PYRAGO',
    jp: '金字塔碁',
    prefix: 'pyrago',
    desc: '同心状の溝で3層に分かれたピラミッド盤。層ごとに独立した戦場。',
    kind: 'stone',
    spec: [
        ...K.rb('PYRAGO', '金字塔碁', 'pyrago'),
        K.params([
            { key: 'groove1_shift', label: '外の溝の位置補正', min: -2, max: 2, def: 0, hint: '標準は盤÷6、そこからのずれ' },
            { key: 'groove2_shift', label: '内の溝の位置補正', min: -2, max: 2, def: 0, hint: '標準は盤÷3、そこからのずれ' },
            { key: 'cap_extra', label: '打ち切り余分', min: 0, max: 8, def: 2, unit: '行分', hint: '交点数+この行数×盤サイズの手数で強制終局' },
        ]),
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_extra') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 外周からの距離で段を刻む: 2本の溝リング (頂が1点だけになる場合は内溝を省略)
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const d1 = Math.max(1, Math.floor(BOARD_SIZE / 6) + (P('groove1_shift') ?? 0));
                const d2 = Math.max(d1 + 1, Math.floor(BOARD_SIZE / 3) + (P('groove2_shift') ?? 0));
                const singleKeep = d2 + 1 === Math.floor(BOARD_SIZE / 2); // 溝が中心1点だけを囲むなら省略
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                    if (d === d1 || (d === d2 && !singleKeep)) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 層ごとに薄く段差の陰影 (高いほど暗く)
        K.CUE_GRID(`            {
                const d1 = Math.max(1, Math.floor(BOARD_SIZE / 6) + (P('groove1_shift') ?? 0));
                const d2 = Math.max(d1 + 1, Math.floor(BOARD_SIZE / 3) + (P('groove2_shift') ?? 0));
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                    if (d === d1 || d === d2) continue;
                    ctx.fillStyle = alphaColor(currentTheme.lineColor, d > d1 ? 0.12 : 0.05);
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        // 溝の専用テクスチャ: 削れた砂岩の溝 (石材層の段差が読める質感)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // ピラミッドの溝 (壁セル): 石灰岩の掘り込み — 内陰つきの石溝
            {
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#7c6a4f');
                    g.addColorStop(0.5, '#5c4f3a');
                    g.addColorStop(1, '#413729');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 石面の筋目 (掘削溝の圧縮方向に走る浅い縞)
                    ctx.strokeStyle = 'rgba(30, 24, 15, 0.35)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx - hh, cy + hh * 0.33); ctx.lineTo(cx + hh, cy + hh * 0.33);
                    ctx.moveTo(cx - hh, cy - hh * 0.33); ctx.lineTo(cx + hh, cy - hh * 0.33);
                    ctx.stroke();
                }
                // 溝の内陰: 有効セル側に落ちる影の帯で段差を出す
                ctx.strokeStyle = 'rgba(20, 16, 10, 0.5)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.09);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && isV(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && isV(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && isV(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && isV(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.RV_BASE, K.rv([
            '外郭・中段・頂の3層に溝で分かれたピラミッド盤。',
            '層の間は行き来できない。各層で独立した地取り合戦になる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        const N = BOARD_SIZE, c = Math.floor(N / 2);
        assert('頂(天元)は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        assert('層間の溝は置けない', board[2 * N + 2] === 3 && isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        assert('もう1本の溝も置けない', board[4 * N + 4] === 3);
        assert('外郭は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
