// ESCAPEGO — 脱出碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'escapego.html',
    en: 'ESCAPEGO',
    jp: '脱出碁',
    prefix: 'escapego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('ESCAPEGO', '脱出碁', 'escapego'),
    [ONE, RV_BASE, rv([
        '脱出ルール: 盤の辺 (最外周) に接している連は不死 — 呼吸点が0でも取られない。',
        '辺まで伸ばした連は安全。ただし辺に届く前の石は通常通り取られる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 脱出ルール<br>
            ※辺に接する連は不死。辺への接続が死活を左右する`],
    [ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 脱出ルール: 辺に接する連は取られない
                    const onEdge = group.some(i => {
                        const gx = i % BOARD_SIZE, gy = (i / BOARD_SIZE) | 0;
                        return gx === 0 || gy === 0 || gx === BOARD_SIZE - 1 || gy === BOARD_SIZE - 1;
                    });
                    if (!hasLiberty && !onEdge) {
                        captured.push(...group);
                    }`],
    // 辺に接する不死連の全石に小さな菱形マーク
    ...STONE_MARKS_SPEC(`            // 辺に接する連は不死 — その連の全石に小さな菱形を刻む
            {
                const seen = new Set();
                const immortal = new Set();
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                    const g = getConnectedGroup(i, c);
                    g.forEach(v => seen.add(v));
                    if (g.some(v => {
                        const gx = v % BOARD_SIZE, gy = (v / BOARD_SIZE) | 0;
                        return gx === 0 || gy === 0 || gx === BOARD_SIZE - 1 || gy === BOARD_SIZE - 1;
                    })) g.forEach(v => immortal.add(v));
                }
                ctx.save();
                ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                immortal.forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    const s = cellSize * 0.10;
                    ctx.strokeStyle = board[i] === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - s);
                    ctx.lineTo(cx + s, cy);
                    ctx.lineTo(cx, cy + s);
                    ctx.lineTo(cx - s, cy);
                    ctx.closePath();
                    ctx.stroke();
                });
                ctx.restore();
            }`),
    // 不死の輝き: 辺に接する連に金色の脈動 (脱出=不死の可視化)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 脱出: 辺に接する不死連に金色の脈動
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set(), imm = new Set();
            for (let i = 0; i < n * n; i++) {
                const c = board[i];
                if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, c);
                g.forEach(v => seen.add(v));
                if (g.some(v => {
                    const gx = v % n, gy = (v / n) | 0;
                    return gx === 0 || gy === 0 || gx === n - 1 || gy === n - 1;
                })) g.forEach(v => imm.add(v));
            }
            ctx2.save();
            const pulse = 0.5 + 0.5 * Math.sin(now / 900);
            imm.forEach(i => {
                const cx = pad + (i % n) * cs, cy = pad + ((i / n) | 0) * cs;
                ctx2.globalAlpha = 0.10 + 0.08 * pulse;
                ctx2.fillStyle = '#fbbf24';
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.64, 0, Math.PI * 2); ctx2.fill();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
