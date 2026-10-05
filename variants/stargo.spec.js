// STARGO — 星碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const STAR_MOLS = `        // 碁ホシ: 十字(プラス)形5連結の碁石
        const MOLECULES = {
            PLUS: { name: '碁ホシ', iupac: '十字5', formula: '5連結', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] }
        };`;
module.exports = {
    file: 'stargo.html',
    en: 'STARGO',
    jp: '星碁',
    prefix: 'stargo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('STARGO', '星碁', 'stargo'),
    ...ALGO_RULES_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁ホシは十字(プラス)形5連結のみ。回転しても同じ形。',
        '四方向に腕を伸ばす形は接触点多く、攻防が激しい。',
    ])],
    [ONE, INFO_BASE,
`            十字形「碁ホシ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / スマホ: 1タップ目プレビュー、2タップ目確定`],
    [ONE, MOLECULES_BASE, STAR_MOLS],
    [ONE, OCNT_BASE, '// 碁ホシ: 十字は回転不変 = 1パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'PLUS';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'PLUS'`],
    [ONE, '登場アルカン', '登場碁ホシ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`碁ホシは十字形5連結のみ。四方向すべてに腕が伸びます。`],
    // 星の顔: 原子球を四隅星の輝き形に差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4 - Math.PI / 2;
                    const rr = k % 2 === 0 ? R * 1.15 : R * 0.5;
                    const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr;
                    if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.fill();`],
    [ALL, '碁カン', '碁ホシ'],
    [ALL, '全7種1巡', '補充なし'],
],
};
