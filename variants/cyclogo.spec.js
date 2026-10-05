// CYCLOGO — シクロ碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const CYCLO_MOLECULES = `        const MOLECULES = {
            CYCLOBUTANE:       { name: 'シクロブタン',       iupac: 'シクロブタン',        formula: 'C₄H₈',  atoms: [[0,0],[1,0],[0,1],[1,1]] },
            METHYLCYCLOBUTANE: { name: 'メチルシクロブタン', iupac: 'メチルシクロブタン',  formula: 'C₅H₁₀', atoms: [[0,0],[1,0],[0,1],[1,1],[2,1]] },
            CYCLOHEXANE:       { name: 'シクロヘキサン',     iupac: 'シクロヘキサン',      formula: 'C₆H₁₂', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]] },
            ETHYLCYCLOBUTANE:  { name: 'エチルシクロブタン', iupac: 'エチルシクロブタン',  formula: 'C₆H₁₂', atoms: [[0,0],[1,0],[0,1],[1,1],[2,1],[3,1]] },
            CYCLOOCTANE:       { name: 'シクロオクタン',     iupac: 'シクロオクタン',      formula: 'C₈H₁₆', atoms: [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]] },
            NAPHTHALENE:       { name: 'ナフタレン',         iupac: 'ナフタレン (縮合環)', formula: 'C₁₀H₈', atoms: [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]] },
            ADAMANTANE:        { name: 'アダマンタン',       iupac: 'アダマンタン',        formula: 'C₁₀H₁₆', atoms: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]] }
        };`;
module.exports = {
    file: 'cyclogo.html',
    en: 'CYCLOGO',
    jp: 'シクロ碁',
    prefix: 'cyclogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('CYCLOGO', 'シクロ碁', 'cyclogo'),
    ...ALGO_RULES_SPEC,
    ...ALGO_SIZE_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁クロはシクロアルカン7種 (環状分子)。',
        'リング状の碁クロは内側に空点を残すことがある。窒息領域は4マス未満。',
    ])],
    [ONE, MOLECULES_BASE, CYCLO_MOLECULES],
    [ONE, OCNT_BASE, '// シクロブタン:1 / メチルシクロブタン:4 / シクロヘキサン:2 / エチルシクロブタン:4 / シクロオクタン:1 / ナフタレン:2 / アダマンタン:1 = 計15パターン'],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'CYCLOBUTANE';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'CYCLOBUTANE'`],
    [ONE, '登場アルカン', '登場シクロアルカン'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`シクロアルカンは炭素骨格が環を含む。リング状の碁クロは内側に穴を残すことがある。CYCLOGO では全7種が登場します。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. シクロアルカン分子 (ピース) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // シクロアルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // リング状分子は内側に空点を残すが、そこは窒息領域なら呼吸点にならない。`],
    [ONE, INFO_BASE,
`            シクロアルカン「碁クロ」を配置し合う変則囲碁<br>
            PC: クリックで配置 / 回転=⟳ボタン・Rキー・右クリック・ホイール / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転・ホールドはボタン)`],
    // 碁クロ: 盤の四隅に環状分子 (ベンゼン環) の薄いモチーフを常時表示
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const pts = [[pad * 0.5, pad * 0.5], [w - pad * 0.5, pad * 0.5],
                [pad * 0.5, w - pad * 0.5], [w - pad * 0.5, w - pad * 0.5]];
            const pulse = 0.28 + Math.sin(now / 1400) * 0.10;
            ctx2.save();
            ctx2.strokeStyle = alphaColor(currentTheme.lineColor, pulse);
            ctx2.lineWidth = Math.max(0.8, cs * 0.035);
            const r = cs * 0.2;
            for (const [hx, hy] of pts) {
                ctx2.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = Math.PI / 6 + k * Math.PI / 3;
                    const px = hx + Math.cos(a) * r, py = hy + Math.sin(a) * r;
                    if (k === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
                }
                ctx2.closePath();
                ctx2.stroke();
                ctx2.beginPath();
                ctx2.arc(hx, hy, r * 0.52, 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
    [ALL, '碁カン', '碁クロ'],
],
};
