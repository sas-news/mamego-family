// REGGO — 上限碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'reggo.html',
    en: 'REGGO',
    jp: '上限碁',
    prefix: 'reggo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('REGGO', '上限碁', 'reggo'),
    K.params([
        { key: 'max_group', label: '連の最大サイズ', min: 2, max: 8, def: 3, unit: '石' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '上限ルール: 着手の結果、自分の連が4石以上になる手は禁止 (連は最大3石)。',
        '大きな連を作れないため、小規模な攻防の連続になる。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 上限ルール<br>
            ※自分の連は最大3石まで (4連以上になる着手は禁止)`],
    [ONE, `            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;`,
`            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }

            // 上限ルール: 着手後に4石以上の連ができる手は禁止
            for (const p of cells) {
                const grp = new Set([p.y * BOARD_SIZE + p.x]);
                const q = [...grp];
                while (q.length) {
                    const cur = q.pop();
                    getNeighbors(cur).forEach(n => {
                        if (after[n] === player && !grp.has(n)) { grp.add(n); q.push(n); }
                    });
                }
                if (grp.size > (P('max_group') || 3)) return false;
            }
            return true;`],
    ...LEGAL_DOTS_SPEC,
    // 上限3: 各連の石数を刻む (3=上限到達で赤強調)
    ...STONE_MARKS_SPEC(`            {
                const seen = new Set();
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.34) + 'px sans-serif';
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                    const g = getConnectedGroup(i, v);
                    g.forEach(j => seen.add(j));
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    const full = g.length >= (P('max_group') || 3);
                    ctx.fillStyle = full ? '#ef4444' : (v === 1 ? 'rgba(240,235,220,0.9)' : 'rgba(50,40,25,0.85)');
                    ctx.fillText(String(g.length), cx + cellSize * 0.30, cy - cellSize * 0.30);
                }
                ctx.restore();
            }`),
    ...STONE_SPEC,
],
};
