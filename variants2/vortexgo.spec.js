// VORTEXGO — 渦模様碁: 中心から渦を巻く壁が走る盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'vortexgo.html',
    en: 'VORTEXGO',
    jp: '渦模様碁',
    prefix: 'vortexgo',
    desc: '中心から渦を巻く腕状の壁。流れに沿って戦線が歪む。',
    kind: 'stone',
    spec: [
        ...K.rb('VORTEXGO', '渦模様碁', 'vortexgo'),
        K.params([
            { key: 'wall_div', label: '渦の腕の間隔', min: 2, max: 6, def: 3, hint: '小さいほど腕の壁が密' },
            { key: 'cap_rows', label: '打ち切り手数 (盤+N行)', min: 1, max: 8, def: 2, unit: '行' },
        ]),
        // 角度+半径の螺旋判定で渦状の腕壁
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const dx = x - c, dy = y - c;
                    const d = Math.max(Math.abs(dx), Math.abs(dy));
                    if (d === 0) continue;
                    const t = Math.atan2(dy, dx);
                    const band = Math.floor(((t + Math.PI) / (Math.PI * 2)) * 12 + d) % Math.max(2, P('wall_div') || 3);
                    if (band === 0) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        // 渦: 壁は深い藍の水流 — 暗い彫り込み + 渦方向の流線
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 渦腕: 深い藍の彫り込み面 + 渦に沿う流線 + 有効領域との境界線
            {
                const cc = (BOARD_SIZE - 1) / 2;
                const isV = (x, y) => board[y * BOARD_SIZE + x] === 3;
                const bcx = padding + cc * cellSize, bcy = padding + cc * cellSize;
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isV(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, '#16233f'); g.addColorStop(1, '#0a1226');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 流線: 渦の接線方向に揺れる短い弧
                    const a = Math.atan2(y - cc, x - cc);
                    const r0 = Math.hypot(x - cc, y - cc) * cellSize;
                    const ph = Math.sin(now / 800 + r0 / cellSize * 0.9) * 0.1;
                    ctx.strokeStyle = 'rgba(110,160,230,' + (0.28 + ph) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(bcx, bcy, Math.max(cellSize * 0.3, r0), a - 0.16, a + 0.16);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(130,170,230,0.45)';
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
        // 渦: 渦の目をゆっくり回る薄い水流の弧 (アンビエント)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const cc = (BOARD_SIZE - 1) / 2;
            const bcx = pad + cc * cs, bcy = pad + cc * cs;
            const rot = now / 2800;
            ctx2.save();
            for (let k = 0; k < 3; k++) {
                const a = rot + k * (Math.PI * 2 / 3);
                ctx2.strokeStyle = 'rgba(110,160,230,0.15)';
                ctx2.lineWidth = Math.max(1, cs * 0.08);
                ctx2.beginPath();
                ctx2.arc(bcx, bcy, cs * (1.0 + k * 0.6), a, a + 1.6);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中心の渦の目から4本の腕状の壁が渦を巻いて伸びる。',
            '壁に沿って石を進めれば、流れに乗って敵地へ潜り込める。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + Math.max(1, P('cap_rows') || 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor(BOARD_SIZE / 2);
        assert('渦の目は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('渦状の壁が走る', w > 30);
        assert('壁には置けない', (() => {
            for (let i = 0; i < board.length; i++) if (board[i] === 3) return !isValidPlacement([{ x: i % BOARD_SIZE, y: Math.floor(i / BOARD_SIZE) }], 1);
            return false;
        })());
        assert('流れの上は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
