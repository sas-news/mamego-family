// MAMEGO — 豆碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const DOMINO_MOLS = `        // 碁豆: 2連のドミノ碁石 (原作 MAMEGO のピース)
        const MOLECULES = {
            DOMINO: { name: '碁豆', iupac: 'ドミノ', formula: '2連結', atoms: [[0,0],[1,0]] }
        };`;
module.exports = {
    file: 'mamego.html',
    en: 'MAMEGO',
    jp: '豆碁',
    prefix: 'mamego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('MAMEGO', '豆碁', 'mamego'),
    ...ALGO_RULES_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁豆はドミノ (2連結) のみ。',
        '原作 MAMEGO (碁豆) の同系ルールを通常囲碁エンジン上に再実装したもの。',
    ])],
    [ONE, INFO_BASE,
`            ドミノ「碁豆」を配置し合う変則囲碁 (原作リスペクト)<br>
            PC: クリックで配置 / 回転=⟳ボタン・Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_BASE, DOMINO_MOLS],
    [ONE, OCNT_BASE, '// 碁豆: 縦/横 = 2パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'DOMINO';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'DOMINO'`],
    [ONE, '登場アルカン', '登場碁豆'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁豆は2連のドミノ形のみ。孤立した1マスの空領域は窒息領域になります。`],
    // 豆の顔: 原子球を楕円の豆に差し替え (斜め交互で並木感)
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                ctx.ellipse(cx, cy, R, R * 0.72, ((p.x + p.y) % 2 === 0 ? 1 : -1) * Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();`],
    [ALL, '碁カン', '碁豆'],
    [ALL, '全7種1巡', '補充なし'],
],
};
