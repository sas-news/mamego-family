// SPAWNGO — 繁殖碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'spawngo.html',
    en: 'SPAWNGO',
    jp: '繁殖碁',
    prefix: 'spawngo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('SPAWNGO', '繁殖碁', 'spawngo'),
    [ONE, RV_BASE, rv([
        '繁殖ルール: 自分の石が盤にある間は、既存の自分の石に隣接する空点にしか置けない。',
        '全滅した場合のみ、盤上のどこにでも置ける。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 繁殖ルール<br>
            ※自分の石に隣接する空点にしか置けない (全滅時のみ自由)`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 繁殖ルール: 自分の石が盤にある間は既存の石に隣接する点のみ置ける
            if (board.includes(player) && !cells.some(p =>
                getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    ...LEGAL_DOTS_SPEC,
    // 繁殖の雰囲気: 自石の周りを漂う胞子
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 繁殖: 石の周りに漂う胞子
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = pad + x * cs, cy = pad + y * cs;
                for (let k = 0; k < 2; k++) {
                    const ph = now / 1400 + i * 0.37 + k * 1.9;
                    const r = cs * (0.55 + 0.25 * Math.sin(ph * 0.7));
                    const a = ph + k * Math.PI;
                    ctx2.globalAlpha = 0.20 + 0.18 * Math.sin(ph * 1.3);
                    ctx2.fillStyle = v === 1 ? 'rgba(60,60,60,0.85)' : 'rgba(255,255,255,0.95)';
                    ctx2.beginPath();
                    ctx2.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, Math.max(1, cs * 0.05), 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
