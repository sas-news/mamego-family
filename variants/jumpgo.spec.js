// JUMPGO — 跳躍碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'jumpgo.html',
    en: 'JUMPGO',
    jp: '跳躍碁',
    prefix: 'jumpgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('JUMPGO', '跳躍碁', 'jumpgo'),
    K.params([
        { key: 'jump_dist', label: '跳躍距離', min: 1, max: 4, def: 2, unit: 'マス' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '跳躍ルール: 自分の石からマンハッタン距離ちょうど2の点にしか置けない (初手のみ自由)。',
        'ただし距離2の空点が盤上に1つも無い場合は制約解除 — どこにでも置ける。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 跳躍ルール<br>
            ※自石から距離ちょうど2の点のみ (距離2の空点が無ければ自由)。200手で自動終局`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 跳躍ルール: 自石からマンハッタン距離ちょうどNのみ (自石が無い、または該当距離の空点が無ければ自由)
            {
                const jd = P('jump_dist') || 2;
                const JOFF = [];
                for (let ja = -jd; ja <= jd; ja++) {
                    const jb = jd - Math.abs(ja);
                    JOFF.push([ja, jb]);
                    if (jb) JOFF.push([ja, -jb]);
                }
                let hasOwn = false, best = Infinity, anyJump = false;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    hasOwn = true;
                    const bx = i % BOARD_SIZE, by = (i / BOARD_SIZE) | 0;
                    cells.forEach(p => {
                        best = Math.min(best, Math.abs(p.x - bx) + Math.abs(p.y - by));
                    });
                    if (!anyJump) JOFF.forEach(([dx, dy]) => {
                        const nx = bx + dx, ny = by + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny * BOARD_SIZE + nx] === 0)
                            anyJump = true;
                    });
                }
                if (hasOwn && anyJump && best !== jd) return false;
            }`],
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 跳躍の軌跡: 距離Nの自石から今の着地点へ石が跳ぶ
            if (lastMove && lastMove.cells.length > 0) {
                const jd2 = P('jump_dist') || 2;
                const JOFF2 = [];
                for (let ja = -jd2; ja <= jd2; ja++) {
                    const jb = jd2 - Math.abs(ja);
                    JOFF2.push([ja, jb]);
                    if (jb) JOFF2.push([ja, -jb]);
                }
                for (const p of lastMove.cells) {
                    for (const [dx, dy] of JOFF2) {
                        const sx2 = p.x - dx, sy2 = p.y - dy;
                        if (sx2 < 0 || sx2 >= BOARD_SIZE || sy2 < 0 || sy2 >= BOARD_SIZE) continue;
                        const si = sy2 * BOARD_SIZE + sx2;
                        if (board[si] === player) {
                            fxSlide(si, p.y * BOARD_SIZE + p.x, 400); // 跳躍の軌跡
                            break;
                        }
                    }
                }
            }
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
