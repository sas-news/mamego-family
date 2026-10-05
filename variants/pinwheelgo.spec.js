// PINWHEELGO — 風車碁: 四隅を回転対称に削った風車形盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'pinwheelgo.html',
    en: 'PINWHEELGO',
    jp: '風車碁',
    prefix: 'pinwheelgo',
    desc: '四隅を回転対称に削った風車形。非対称な地形が生む癖のある碁。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('PINWHEELGO', '風車碁', 'pinwheelgo'),
        K.params([{ key: 'notch_len', label: '切れ込みの長さ', min: 2, max: 8, def: 5, unit: 'マス' }, { key: 'notch_wid', label: '切れ込みの幅', min: 1, max: 4, def: 2, unit: 'マス' }]),
        // 各隅を90°回転対称にノッチ状に削る
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const m = BOARD_SIZE - 1;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const _nw = Math.max(1, P('notch_wid') || 2), _nl = Math.max(2, P('notch_len') || 5);
                    const notch = (x < _nw && y < _nl) || (x > m - _nl && y < _nw)
                        || (x > m - _nw && y > m - _nl) || (x < _nl && y > m - _nw);
                    if (notch) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 風車: 削れた隅は「風に切られた斜面」— 暗い彫り込み + 渦方向の風筋
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 風車の切れ込み: 暗い彫り込み面 + 中心を軸にした接線方向の風筋 + 境界線
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                const bcx = padding + cc * cellSize, bcy = padding + cc * cellSize;
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    ctx.fillStyle = shiftColor(currentTheme.boardBg, -0.52);
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 風筋: 中心回りの接線方向へ流れる短い弧 (風車の回転方向を示唆)
                    const a = Math.atan2(y - cc, x - cc);
                    const r0 = Math.hypot(x - cc, y - cc) * cellSize;
                    ctx.strokeStyle = 'rgba(190,205,225,0.26)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.arc(bcx, bcy, Math.max(cellSize * 0.3, r0), a - 0.15, a + 0.15);
                    ctx.stroke();
                }
                ctx.strokeStyle = currentTheme.lineColor;
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
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
            '四隅を回転対称に削った風車形の盤。',
            '欠けた隅で呼吸点が偏り、辺ごとに異なる戦い方を強いられる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        const m = BOARD_SIZE - 1;
        assert('左上のノッチは壁', board[0] === 3 && isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('回転対称に削れている', board[m] === 3 && board[m * BOARD_SIZE] === 3 && board[m * BOARD_SIZE + m] === 3);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('4つのノッチ分の壁', w >= 30);
        assert('羽根の部分は置ける', isValidPlacement([{ x: 0, y: 6 }], 1) === true);
        assert('中央は普通に置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
