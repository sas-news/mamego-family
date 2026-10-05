// BRAWLGO — 乱闘碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'brawlgo.html',
    en: 'BRAWLGO',
    jp: '乱闘碁',
    prefix: 'brawlgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('BRAWLGO', '乱闘碁', 'brawlgo'),
    K.params([
        { key: 'brawl_min', label: '撃破に必要な敵方向数', min: 2, max: 4, def: 3 },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, TURN_FLIP,
`${TURN_FLIP}
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    [ONE, RV_BASE, rv([
        '乱闘ルール: 通常の取りに加え、周囲の3方向以上が敵石の石は個別に取られる (連の呼吸点不要)。',
        '密集地帯では個別撃破が起きる乱戦碁。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 乱闘ルール<br>
            ※周囲3方向以上が敵石の石は単独でも取られる`],
    [ONE, CAPTURE_BLOCK,
`            let captured = getCapturedStones(board, opponent);
            // 乱闘: 周囲3方向以上が自分の石の敵石も取る
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== opponent || captured.includes(i)) continue;
                if (getNeighbors(i).filter(n => board[n] === player).length >= (P('brawl_min') || 3)) captured.push(i);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                fxText(captured[0], '撃破!', '#ef4444', 900);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    // 乱闘: 周囲3方向以上が敵石の石 (個別撃破候補) を赤く点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 乱闘: 個別撃破候補 (敵に3方向以上囲まれた石) を点滅
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const pulse = 0.5 + 0.5 * Math.sin(now / 180);
            ctx2.globalAlpha = 0.5 + 0.4 * pulse;
            ctx2.lineWidth = Math.max(1.5, cs * 0.07);
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const foes = getNeighbors(i).filter(n => board[n] !== 0 && board[n] !== v).length;
                if (foes < (P('brawl_min') || 3)) continue;
                const cx = pad + (i % BOARD_SIZE) * cs, cy = pad + ((i / BOARD_SIZE) | 0) * cs;
                ctx2.strokeStyle = '#ef4444';
                ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.60, 0, Math.PI * 2); ctx2.stroke();
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
