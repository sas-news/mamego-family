// BLASTGO — 爆撃碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'blastgo.html',
    en: 'BLASTGO',
    jp: '爆撃碁',
    prefix: 'blastgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('BLASTGO', '爆撃碁', 'blastgo'),
    [ONE, RV_BASE, rv([
        '爆撃ルール: 置いた石に隣接する敵石の「連」は呼吸点に関係なくすべて破壊・取られる。',
        '通常の取り判定も有効。爆撃で取った石もアゲハマに数えられる。',
        '爆撃で盤面が埋まり切らないため、盤面マス数と同じ手数で自動終了して地集計に入る。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 爆撃ルール<br>
            ※置いた石に隣接する敵石の連をすべて破壊する`],
    [ONE, PIECES_PUSH,
`${PIECES_PUSH}

            // 爆撃ルール: 置いた石に隣接する敵の連を呼吸点に関係なく破壊
            {
                const opp2 = player === 1 ? 2 : 1;
                const blasted = new Set();
                move.cells.forEach(p => {
                    getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                        if (board[n] === opp2) {
                            getConnectedGroup(n, opp2).forEach(i => blasted.add(i));
                        }
                    });
                });
                if (blasted.size > 0) {
                    // 爆撃演出: 着点の衝撃波 + 破壊された連ごとの火花 + 画面揺れ
                    const bi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxGlow(bi, '#fbbf24', 750);
                    fxText(bi, '爆撃!', '#fb923c', 1000);
                    fxShake(6, 340);
                    blasted.forEach(i => {
                        board[i] = 0;
                        fxBurst(i, '#f97316', 9, 1.6);
                        fxBurst(i, '#fbbf24', 4, 1.1);
                    });
                    captures[player] += blasted.size;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
    // 手数制限: 爆撃で盤面が飽和しないため盤面マス数の手数で自動終了
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            if (history.length >= BOARD_SIZE * BOARD_SIZE) endGameByScore();`],
    ...STONE_SPEC,
],
};
