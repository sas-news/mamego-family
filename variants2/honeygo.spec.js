// HONEYGO — 蜂巣碁: 斜交する壁がハニカム状に盤を分断
const K = require('../gen_kit.js');
module.exports = {
    file: 'honeygo.html',
    en: 'HONEYGO',
    jp: '蜂巣碁',
    prefix: 'honeygo',
    desc: '斜交する壁が六角の巣房を刻む。小部屋ごとの局地戦。',
    kind: 'stone',
    spec: [
        ...K.rb('HONEYGO', '蜂巣碁', 'honeygo'),
        K.params([
            { key: 'wall_gap', label: '隔壁の間隔', min: 3, max: 9, def: 5, hint: '大きいほど巣房が広く壁が疎になる' },
        ]),
        // 2方向の斜め壁が交差して菱形〜六角の巣房を作る
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if ((x + y) % Math.max(2, P('wall_gap') || 5) === 0 || (x - y + 2 * BOARD_SIZE) % Math.max(2, P('wall_gap') || 5) === 0) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 巣房っぽく蜂蜜色の壁: 蜂の巣の六角巣房として描く
        [K.ONE, '            const covered = new Set(); // ピース描画でカバー済みのマス',
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 蜂の巣: 壁セルを琥珀色の六角巣房として描く
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== 3) continue;
                    const i = y * BOARD_SIZE + x;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, r = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.1);
                    g.addColorStop(0, '#d9a832'); g.addColorStop(1, '#7a5210');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const a = k * Math.PI / 3 - Math.PI / 2;
                        const hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r;
                        if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(60,40,5,0.7)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.045);
                    ctx.stroke();
                    // 蜜の煌めき
                    if (Math.sin(now / 700 + i * 2.3) > 0.86) {
                        ctx.fillStyle = 'rgba(255,240,160,0.75)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.09, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        // 蜂の巣の雰囲気: 盤上を漂う金色の微粒子
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            for (let k = 0; k < 14; k++) {
                const t = (now / 2600 + k * 0.77) % 1;
                const px = (k * 139.7 + now * 0.008) % w;
                const py = (k * 61.3) % w;
                ctx2.globalAlpha = 0.28 * Math.sin(t * Math.PI);
                ctx2.fillStyle = '#ffd668';
                ctx2.beginPath();
                ctx2.arc(px, py, cs * 0.05, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.RV_ALGO, K.rv([
            '斜めに交差する壁がハニカム状の巣房を作る。',
            '巣房を隔てる薄い隔壁をめぐって小さな殺し合いが連続する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        let walls = 0;
        for (const v of board) if (v === 3) walls++;
        assert('蜂巣状の壁がある', walls > 20);
        let playable = -1;
        for (let i = 0; i < board.length; i++) if (board[i] === 0) { playable = i; break; }
        assert('巣房の内側は置ける', playable >= 0 && isValidPlacement([{ x: playable % BOARD_SIZE, y: Math.floor(playable / BOARD_SIZE) }], 1) === true);
        assert('壁には置けない', (() => {
            for (let i = 0; i < board.length; i++) if (board[i] === 3) return !isValidPlacement([{ x: i % BOARD_SIZE, y: Math.floor(i / BOARD_SIZE) }], 1);
            return false;
        })());
        executeMove({ cells: [{ x: playable % BOARD_SIZE, y: Math.floor(playable / BOARD_SIZE) }] }, 1);
        assert('交互着手が機能', turn === 2);
    `,
};
