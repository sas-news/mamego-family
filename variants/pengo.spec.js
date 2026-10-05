// PENGO — ペン碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const PENTO_MOLS = `        // 12種のペントミノを分子として扱う (5連結マス)。窒息領域は5マス未満。
        const MOLECULES = {
            F: { name: 'Fペントミノ', iupac: 'F', formula: 'ペントミノ (5マス)', atoms: [[1,0],[2,0],[0,1],[1,1],[1,2]] },
            I: { name: 'Iペントミノ', iupac: 'I', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
            L: { name: 'Lペントミノ', iupac: 'L', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[0,2],[0,3],[1,3]] },
            P: { name: 'Pペントミノ', iupac: 'P', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[0,1],[1,1],[0,2]] },
            N: { name: 'Nペントミノ', iupac: 'N', formula: 'ペントミノ (5マス)', atoms: [[1,0],[1,1],[0,2],[1,2],[0,3]] },
            T: { name: 'Tペントミノ', iupac: 'T', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[2,0],[1,1],[1,2]] },
            U: { name: 'Uペントミノ', iupac: 'U', formula: 'ペントミノ (5マス)', atoms: [[0,0],[2,0],[0,1],[1,1],[2,1]] },
            V: { name: 'Vペントミノ', iupac: 'V', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[0,2],[1,2],[2,2]] },
            W: { name: 'Wペントミノ', iupac: 'W', formula: 'ペントミノ (5マス)', atoms: [[0,0],[0,1],[1,1],[1,2],[2,2]] },
            X: { name: 'Xペントミノ', iupac: 'X', formula: 'ペントミノ (5マス)', atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
            Y: { name: 'Yペントミノ', iupac: 'Y', formula: 'ペントミノ (5マス)', atoms: [[1,0],[0,1],[1,1],[1,2],[1,3]] },
            Z: { name: 'Zペントミノ', iupac: 'Z', formula: 'ペントミノ (5マス)', atoms: [[0,0],[1,0],[1,1],[1,2],[2,2]] }
        };`;
module.exports = {
    file: 'pengo.html',
    en: 'PENGO',
    jp: 'ペン碁',
    prefix: 'pengo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('PENGO', 'ペン碁', 'pengo'),
    ...ALGO_RULES_SPEC,
    ...ALGO_SIZE_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁ペンはペントミノ12種 (5マスの連結形)。',
        '窒息領域: 5マス未満の空領域は呼吸点にも地にもならない。',
        '回転のみ可能 (鏡像は別の向きとしては出ない)。',
        '供給モード: 「自由選択」は毎手好きな碁ペンを選べる。「ネクスト」は12種1巡のランダム供給 (ホールド可)。',
    ])],
    [ONE, INFO_BASE,
`            ペントミノ「碁ペン」を配置し合う変則囲碁<br>
            ※窒息領域は5マス未満 (ペントミノが入らない空領域)`],
    [ONE, MOLECULES_BASE, PENTO_MOLS],
    [ONE, OCNT_BASE, '// 回転のみ (鏡像なし): F4/I2/L4/P4/N4/T4/U4/V4/W4/X1/Y4/Z4 = 計45パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'F';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'F'`],
    [ONE, '登場アルカン', '登場ペントミノ'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`ペントミノは碁石5個が連結した形 (12種)。5マス未満の窒息領域にはどの碁ペンも入りません。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. ペントミノ分子 (ピース) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // ペントミノ (5連結マス) を分子として描画する。原子=碁石、結合=連結。
        // すべて5マスなので「5マス未満の窒息領域」ルールが機能する。`],
    // 碁ペンの顔: 原子球を角丸正方形ブロックに差し替え
    [ONE, `                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.fill();`,
`                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - R, cy - R, R * 2, R * 2, R * 0.22); else ctx.rect(cx - R, cy - R, R * 2, R * 2);
                ctx.fill();`],
    [ALL, '碁カン', '碁ペン'],
    [ALL, '全7種1巡', '全12種1巡'],
    [ALL, '7種1巡', '12種1巡'],
],
};
