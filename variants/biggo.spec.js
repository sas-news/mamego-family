// BIGGO — 巨大碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const BIG_MOLS = `        // 碁オオ: 3x3ブロック9連結の巨大碁石
        const MOLECULES = {
            BIG: { name: '碁オオ', iupac: '正方形9', formula: '9連結', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]] }
        };`;
module.exports = {
    file: 'biggo.html',
    en: 'BIGGO',
    jp: '巨大碁',
    prefix: 'biggo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('BIGGO', '巨大碁', 'biggo'),
    ...ALGO_RULES_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁オオは3×3ブロック (9連結) のみ。',
        '窒息領域は9マス未満 — 小さな囲みは全て死に領域。盤面はすぐ埋まる超高速碁。',
    ])],
    [ONE, INFO_BASE,
`            3×3ブロック「碁オオ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_BASE, BIG_MOLS],
    [ONE, OCNT_BASE, '// 碁オオ: 正方形は回転不変 = 1パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'BIG';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'BIG'`],
    [ONE, '登場アルカン', '登場碁オオ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁オオは3×3の正方形のみ (9連結)。9マス未満の空領域は全て窒息領域です。`],
    // 巨大碁の顔: 原子球を巨石の角柱に差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                ctx.rect(cx - R * 1.0, cy - R * 1.0, R * 2, R * 2);
                ctx.fill();`],
    [ALL, '碁カン', '碁オオ'],
    [ALL, '全7種1巡', '補充なし'],
],
};
