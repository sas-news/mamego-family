// MONOGO — 単石碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'monogo.html',
    en: 'MONOGO',
    jp: '単石碁',
    prefix: 'monogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MONOGO', '単石碁', 'monogo'),
    K.params([
        { key: 'max_group', label: '取れる連の最大サイズ', min: 1, max: 4, def: 1, unit: '石' },
    ]),
    [ONE, RV_BASE, rv([
        '単石ルール: 呼吸点が0になっても、2石以上の連は取られない (不死)。',
        '取れるのは孤立した単石だけ — 早期に連を作ると安全だが隙もできる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 単石ルール<br>
            ※2石以上の連は不死。取れるのは孤立した単石のみ`],
    [ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 単石ルール: 上限より大きな連は取られない (上限は設定で調整)
                    if (!hasLiberty && group.length <= (P('max_group') || 1)) {
                        captured.push(...group);
                    }`],
    ...STONE_MARKS_SPEC(`            // 取れるのは孤立単石のみ — 孤立石に小さな角□を刻む
            {
                const seen = new Set();
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2 || seen.has(i)) continue;
                    const g = getConnectedGroup(i, v);
                    g.forEach(j => seen.add(j));
                    if (g.length > (P('max_group') || 1)) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize, s = cellSize * 0.09;
                    ctx.strokeStyle = v === 1 ? 'rgba(240,235,220,0.85)' : 'rgba(50,40,25,0.8)';
                    ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
                }
                ctx.restore();
            }`),
    // 単石の危険度: 呼吸点1以下の孤立石 (次に取られる) を赤く点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 単石の危険度: 呼吸点1以下の孤立石を赤く点滅
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set();
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                const v = board[i];
                if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, v);
                g.forEach(j => seen.add(j));
                if (g.length > (P('max_group') || 1)) continue;
                if (getLiberties(board, i) > 1) continue;
                const cx = pad + (i % n) * cs, cy = pad + ((i / n) | 0) * cs;
                const pulse = 0.5 + 0.5 * Math.sin(now / 200);
                ctx2.globalAlpha = 0.45 + 0.45 * pulse;
                ctx2.strokeStyle = '#ef4444';
                ctx2.lineWidth = Math.max(1.6, cs * 0.08);
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.58, 0, Math.PI * 2); ctx2.stroke();
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
