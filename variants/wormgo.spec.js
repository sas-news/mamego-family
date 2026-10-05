// WORMGO — 転送碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'wormgo.html',
    en: 'WORMGO',
    jp: '転送碁',
    prefix: 'wormgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('WORMGO', '転送碁', 'wormgo'),
    K.params([
        { key: 'worm_pairs', label: 'ワームホールの組数', min: 1, max: 6, def: 2, unit: '組' },
    ]),
    [ONE, RV_BASE, rv([
        '転送ルール: 盤上にランダムなワームホールペア (◎マーク) が2組ある。',
        'ワームホール端点同士は近傍としてつながる (連・呼吸点・取りが遠隔で成立)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 転送ルール<br>
            ※盤上のワームホールペア (◎) 同士が近傍としてつながる`],
    [ONE, BOARD_DECL,
`${BOARD_DECL}
        let WORMHOLES = []; // [[idxA,idxB], ...] ワームホールペア (遠隔近傍)`],
    [ONE, NBRS_GRID,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            // ワームホール: ペア端点同士が近傍
            WORMHOLES.forEach(([a, b]) => {
                if (a === idx) neighbors.push(b);
                else if (b === idx) neighbors.push(a);
            });

            return neighbors;
        }

        // ワームホールペアをランダム生成 (組数は設定の worm_pairs、既定2組=4点)
        function buildWormholes() {
            const n = BOARD_SIZE * BOARD_SIZE;
            const cells = [...Array(n).keys()];
            const pick = () => cells.splice((Math.random() * cells.length) | 0, 1)[0];
            const pairs = Math.max(1, Math.min(6, P('worm_pairs') || 2));
            WORMHOLES = [];
            for (let k = 0; k < pairs; k++) WORMHOLES.push([pick(), pick()]);
        }`],
    // ワームホール端点の描画 (◎マーク)
    [ONE, `            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`,
`            // ワームホール端点の描画 (紫の◎ペア + ペア間の薄い破線)
            ctx.strokeStyle = '#8b5cf6';
            ctx.save();
            ctx.setLineDash([cellSize * 0.12, cellSize * 0.10]);
            ctx.globalAlpha = 0.35;
            WORMHOLES.forEach(([a, b]) => {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding + (a % BOARD_SIZE) * cellSize, padding + Math.floor(a / BOARD_SIZE) * cellSize);
                ctx.lineTo(padding + (b % BOARD_SIZE) * cellSize, padding + Math.floor(b / BOARD_SIZE) * cellSize);
                ctx.stroke();
            });
            ctx.restore();
            WORMHOLES.forEach(([a, b]) => {
                [a, b].forEach(i => {
                    const wx = padding + (i % BOARD_SIZE) * cellSize;
                    const wy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(wx, wy, cellSize * 0.30, 0, Math.PI * 2); ctx.stroke();
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(wx, wy, cellSize * 0.10, 0, Math.PI * 2); ctx.stroke();
                });
            });

            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`],
    // 生成・永続化・同期
    [ONE, RESET_BOARD,
`            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            buildWormholes();`],
    [ONE, `                    prevBoard,
                    lastMove,
                    history`,
`                    prevBoard,
                    lastMove,
                    wormholes: WORMHOLES,
                    history`],
    [ONE, `            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;`,
`            prevBoard = Array.isArray(s.prevBoard) ? s.prevBoard : null;
            lastMove = s.lastMove || null;
            WORMHOLES = Array.isArray(s.wormholes) ? s.wormholes : [];
            if (!WORMHOLES.length) buildWormholes();`],
    [ONE, `                prevBoard,
                lastMove,
                pieceMode,`,
`                prevBoard,
                lastMove,
                wormholes: WORMHOLES,
                pieceMode,`],
    [ONE, `            lastMove = data.lastMove || null;`,
`            lastMove = data.lastMove || null;
            if (Array.isArray(data.wormholes)) WORMHOLES = data.wormholes;`],
    // ワームホール上への着手は「転送」の表示と渦の光で発火
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 転送碁: ワームホール端点への着手は対側にも繋がる「転送」演出
            {
                const wc = move.cells[0];
                if (wc) {
                    const wi = wc.y * BOARD_SIZE + wc.x;
                    const pair = WORMHOLES.find(([a, b]) => a === wi || b === wi);
                    if (pair) {
                        const other = pair[0] === wi ? pair[1] : pair[0];
                        fxGlow(wi, '#a78bfa', 700);
                        fxGlow(other, '#a78bfa', 700);
                        fxText(wi, '転送', '#c4b5fd', 1100);
                    }
                }
            }

            turn = opponent;`],
    // ワームホールの脈動と対側へ飛ぶ火花 — 「遠隔で繋がっている」を常時演出
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 転送碁: ワームホールが脈動し、ペア間を火花が行き来する常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            WORMHOLES.forEach(([a, b], pi) => {
                // 端点の渦巻きリング (回転する弧で転送口を演出)
                [a, b].forEach((i, ei) => {
                    const cx = pad + (i % BOARD_SIZE) * cs;
                    const cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                    const rot = now / 700 * (pi === 0 ? 1 : -1) + ei * Math.PI;
                    ctx2.strokeStyle = '#a78bfa';
                    ctx2.globalAlpha = 0.5 + 0.2 * Math.sin(now / 400 + i);
                    ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, cs * 0.36, rot, rot + Math.PI * 1.4);
                    ctx2.stroke();
                });
                // ペア間を往復する火花 (トンネルを通る粒子)
                for (let k = 0; k < 3; k++) {
                    const ph = (now / 1800 + k * 0.33 + pi * 0.5) % 1;
                    const ax = pad + (a % BOARD_SIZE) * cs, ay = pad + Math.floor(a / BOARD_SIZE) * cs;
                    const bx = pad + (b % BOARD_SIZE) * cs, by = pad + Math.floor(b / BOARD_SIZE) * cs;
                    const t = ph < 0.5 ? ph * 2 : 2 - ph * 2;
                    ctx2.globalAlpha = 0.5 * (1 - Math.abs(ph - 0.5) * 2) + 0.15;
                    ctx2.fillStyle = '#c4b5fd';
                    ctx2.beginPath();
                    ctx2.arc(ax + (bx - ax) * t, ay + (by - ay) * t, cs * 0.09, 0, Math.PI * 2);
                    ctx2.fill();
                }
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
