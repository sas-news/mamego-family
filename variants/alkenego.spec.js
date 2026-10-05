// ALKENEGO — アルケン碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const ALKENE_MOLECULES = `        const MOLECULES = {
            BUTENE:      { name: '1-ブテン',       iupac: 'ブト-1-エン',               formula: 'C₄H₈',  atoms: [[0,0],[1,0],[1,1],[2,1]], db: [[0,1]] },
            BUTADIENE:   { name: '1,3-ブタジエン', iupac: 'ブタ-1,3-ジエン',           formula: 'C₄H₆',  atoms: [[0,0],[0,1],[0,2],[1,2]], db: [[0,1],[2,3]] },
            ISOBUTENE:   { name: 'イソブテン',     iupac: '2-メチルプロペン',          formula: 'C₄H₈',  atoms: [[1,0],[0,1],[1,1],[2,1]], db: [[2,3]] },
            BUTYNE:      { name: '2-ブチン',       iupac: 'ブト-2-イン',               formula: 'C₄H₆',  atoms: [[0,0],[1,0],[2,0],[3,0]], db: [[1,2]] },
            PENTENE:     { name: '1-ペンテン',     iupac: 'ペント-1-エン',             formula: 'C₅H₁₀', atoms: [[0,0],[1,0],[1,1],[2,1],[2,2]], db: [[0,1]] },
            PENTYNE:     { name: '2-ペンチン',     iupac: 'ペント-2-イン',             formula: 'C₅H₈',  atoms: [[0,0],[1,0],[2,0],[3,0],[4,0]], db: [[1,2]] },
            ISOPRENE:    { name: 'イソプレン',     iupac: '2-メチル-1,3-ブタジエン',   formula: 'C₅H₈',  atoms: [[1,0],[0,1],[1,1],[2,1],[1,2]], db: [[0,2],[2,3]] }
        };`;
module.exports = {
    file: 'alkenego.html',
    en: 'ALKENEGO',
    jp: 'アルケン碁',
    prefix: 'alkenego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [

    ...rb('ALKENEGO', 'アルケン碁', 'alkenego'),
    ...ALGO_RULES_SPEC,
    ...ALGO_SIZE_SPEC,
    [ONE, RV_BASE, rv([
        'このゲームで使う碁ケンはアルケン・アルキン7種 (二重・三重結合を含む不飽和分子)。',
        '多重結合は剛直のため碁ケンは回転できない (全分子1向き固定)。二重線が多重結合。',
    ])],
    [ONE, '登場アルカン', '登場アルケン・アルキン'],
    [ONE, `アルカンは直鎖・分枝を問わず環を含まない炭素骨格 (C<sub>n</sub>H<sub>2n+2</sub>)。ALGO では全7種が登場します。`,
`アルケン・アルキンは二重・三重結合を持つ不飽和炭化水素。結合が剛直なため盤上で回転できません。全7種が登場します。`],
    [ONE, `// 3. アルカン分子 (ピース) 定義`, `// 3. 不飽和炭化水素 (アルケン/アルキン) 定義`],
    [ONE, `        // アルカンの炭素骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // すべて4原子以上なので「4マス未満の窒息領域」ルールがそのまま機能する。`,
`        // 不飽和炭化水素の骨格を碁盤の格子に写した形。原子=碁石、結合=連結。
        // 二重/三重結合 (db) は剛直: 分子は回転できない。`],
    [ONE, MOLECULES_BASE, ALKENE_MOLECULES],
    [ONE, `        // 各分子の回転バリエーションを事前生成 (重複排除)
        ${OCNT_BASE}
        const ORIENTATIONS = {};
        PIECE_TYPES.forEach(type => {
            let cells = normalizeCells(PIECE_DEFS[type]);
            const seen = new Set();
            const list = [];
            for (let i = 0; i < 4; i++) {
                const n = normalizeCells(cells);
                const k = cellsKey(n);
                if (!seen.has(k)) {
                    seen.add(k);
                    list.push(n);
                }
                cells = rot90(cells);
            }
            ORIENTATIONS[type] = list;
        });`,
`        // 二重・三重結合は剛直: 分子は回転できず基準形のみ (各1パターン)
        const ORIENTATIONS = {};
        PIECE_TYPES.forEach(type => {
            ORIENTATIONS[type] = [normalizeCells(PIECE_DEFS[type])];
        });

        // 各分子の二重/三重結合 (原子ペア、正規化座標系)
        const DBONDS = {};
        PIECE_TYPES.forEach(type => {
            const m = MOLECULES[type];
            const minX = Math.min(...m.atoms.map(c => c[0]));
            const minY = Math.min(...m.atoms.map(c => c[1]));
            DBONDS[type] = (m.db || []).map(([a, b]) =>
                [[m.atoms[a][0] - minX, m.atoms[a][1] - minY],
                 [m.atoms[b][0] - minX, m.atoms[b][1] - minY]]);
        });`],
    [ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'BUTENE';`],
    [ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'BUTENE'`],
    [ONE, '⟳ 回転', '⟳ 回転不可'],
    [ONE, INFO_BASE,
`            アルケン・アルキン「碁ケン」を配置し合う変則囲碁 (回転不可)<br>
            PC: クリックで配置 / ホールド=Hキー<br>
            スマホ: 1タップ目プレビュー、2タップ目確定<br>
            ※剛直な多重結合のため碁ケンは向きを変えられません`],
    [ALL, '碁カン', '碁ケン'],
    // 回転ボタン無効化 (起動時)
    [ONE, `        window.onload = () => {
            buildThemeList();`,
`        window.onload = () => {
            // 不飽和分子は回転不可
            btnRotate.disabled = true;
            btnRotate.classList.add('opacity-40', 'cursor-not-allowed');
            buildThemeList();`],
    // 盤上でも多重結合を平行2本線で描く (ミニピース描画と同じ見た目)
    ...STONE_MARKS_SPEC(`            {
                ctx.save();
                pieces.forEach(pc => {
                    const pairs = DBONDS[pc.type];
                    if (!pairs || !pairs.length) return;
                    const minX = Math.min(...pc.cells.map(p => p.x));
                    const minY = Math.min(...pc.cells.map(p => p.y));
                    const at = (nx, ny) => pc.cells.find(p => p.x - minX === nx && p.y - minY === ny);
                    const fill = pc.player === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                    ctx.strokeStyle = shiftColor(fill, -0.15);
                    ctx.lineCap = 'round';
                    ctx.lineWidth = cellSize * 0.10;
                    pairs.forEach(([pa, pb]) => {
                        const a = at(pa[0], pa[1]), b = at(pb[0], pb[1]);
                        if (!a || !b) return;
                        if (board[a.y * BOARD_SIZE + a.x] !== pc.player || board[b.y * BOARD_SIZE + b.x] !== pc.player) return;
                        const ax = padding + a.x * cellSize, ay = padding + a.y * cellSize;
                        const bx = padding + b.x * cellSize, by = padding + b.y * cellSize;
                        const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
                        const ux = dx / L, uy = dy / L;
                        const ox = -uy * cellSize * 0.12, oy = ux * cellSize * 0.12;
                        const r0 = cellSize * 0.30;
                        ctx.beginPath();
                        ctx.moveTo(ax + ux * r0 + ox, ay + uy * r0 + oy);
                        ctx.lineTo(bx - ux * r0 + ox, by - uy * r0 + oy);
                        ctx.moveTo(ax + ux * r0 - ox, ay + uy * r0 - oy);
                        ctx.lineTo(bx - ux * r0 - ox, by - uy * r0 - oy);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
,

    [ONE, `            // C-C 結合
            c.strokeStyle = shiftColor(fill, -0.15);
            c.lineWidth = s * 0.28;
            c.lineCap = 'round';
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy))) {
                        c.moveTo(ox + px * s, oy + py * s);
                        c.lineTo(ox + (px + dx) * s, oy + (py + dy) * s);
                    }
                });
            });
            c.stroke();`,
`            // 結合 (二重・三重結合は2本線で描画)
            const dbPairs = DBONDS[type] || [];
            const isDb = (x1, y1, x2, y2) => dbPairs.some(p =>
                (p[0][0] === x1 && p[0][1] === y1 && p[1][0] === x2 && p[1][1] === y2) ||
                (p[0][0] === x2 && p[0][1] === y2 && p[1][0] === x1 && p[1][1] === y1));
            c.strokeStyle = shiftColor(fill, -0.15);
            c.lineCap = 'round';
            // 単結合
            c.lineWidth = s * 0.28;
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy)) && !isDb(px, py, px + dx, py + dy)) {
                        c.moveTo(ox + px * s, oy + py * s);
                        c.lineTo(ox + (px + dx) * s, oy + (py + dy) * s);
                    }
                });
            });
            c.stroke();
            // 多重結合 (平行2本線)
            c.lineWidth = s * 0.12;
            c.beginPath();
            shape.forEach(([px, py]) => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((px + dx) + ',' + (py + dy)) && isDb(px, py, px + dx, py + dy)) {
                        const off = s * 0.11;
                        const ox2 = dx === 0 ? off : 0, oy2 = dy === 0 ? off : 0;
                        c.moveTo(ox + px * s - ox2, oy + py * s - oy2);
                        c.lineTo(ox + (px + dx) * s - ox2, oy + (py + dy) * s - oy2);
                        c.moveTo(ox + px * s + ox2, oy + py * s + oy2);
                        c.lineTo(ox + (px + dx) * s + ox2, oy + (py + dy) * s + oy2);
                    }
                });
            });
            c.stroke();`],

    ],
};
