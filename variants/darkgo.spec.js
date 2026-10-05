// DARKGO — 暗闇碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'darkgo.html',
    en: 'DARKGO',
    jp: '暗闇碁',
    prefix: 'darkgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('DARKGO', '暗闇碁', 'darkgo'),
    K.params([
        { key: 'fog_range', label: '視界距離', min: 1, max: 8, def: 3, unit: 'マス' },
    ]),
    [ONE, RV_BASE, rv([
        '暗闇ルール: 自分の石からマンハッタン距離3以内の範囲しか見えない。',
        '視野外の敵石は表示されない (配置判定や取り自体は通常通り働く)。',
        'ローカル対戦では手番側の視点、AI/オンラインでは自分の視点で描画。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 暗闇ルール<br>
            ※自分の石の近くしか見えない。敵石は霧の中`],
    [ONE, `        let komi = 6.5;`,
`        let komi = 6.5;
        const FOG_RANGE = 3; // 暗闇ルール: 自石からの視界距離 (マンハッタン)`],
    [ONE, `        function drawBoardElements(padding, cellSize) {`,
`        // 暗闇: 視点となるプレイヤー色 (ローカル=手番側、AI/オンライン=自分)
        function fogViewer() {
            if (gameMode === 'online') return myOnlineRole || 1;
            if (gameMode === 'ai') return aiPlayer === 2 ? 1 : 2;
            return turn;
        }
        function isFogVisible(idx) {
            const v = fogViewer();
            const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== v) continue;
                if (Math.abs((i % BOARD_SIZE) - x) + Math.abs(((i / BOARD_SIZE) | 0) - y) <= (P('fog_range') || FOG_RANGE)) return true;
            }
            return false;
        }

        function drawBoardElements(padding, cellSize) {`],
    [ONE, `                const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player);`,
`                const alive = pc.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === pc.player)
                    .filter(p => pc.player === fogViewer() || isFogVisible(p.y * BOARD_SIZE + p.x));`],
    [ONE, FALLBACK_SKIP,
`                    if (val === 0 || covered.has(idx)) continue;
                    if ((val === 1 || val === 2) && val !== fogViewer() && !isFogVisible(idx)) continue;`],
    [ONE, `            const alive = lastMove.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === lastMove.player);`,
`            const alive = lastMove.cells.filter(p => board[p.y * BOARD_SIZE + p.x] === lastMove.player)
                .filter(p => lastMove.player === fogViewer() || isFogVisible(p.y * BOARD_SIZE + p.x));`],
    // 霧表現: 視界外のマスを暗いベールで覆う (石の描画より先に敷く)
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 視界外のマスを暗いベールで覆う (自石周辺のみ明るい)
            {
                ctx.save();
                ctx.fillStyle = 'rgba(16,20,34,0.30)';
                for (let fy = 0; fy < BOARD_SIZE; fy++) for (let fx = 0; fx < BOARD_SIZE; fx++) {
                    if (isFogVisible(fy * BOARD_SIZE + fx)) continue;
                    ctx.fillRect(padding + (fx - 0.5) * cellSize, padding + (fy - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.restore();
            }`],
    // 暗闇の演出: 霧の中を這う影の塊 + 自石の周りに灯りの縁
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 暗闇碁: 視界外を影の塊が静かに這い、自石の周りに灯りの輪が揺れる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 12; k++) {
                const ph = now / 3200 + k * 1.71;
                const x = (Math.sin(ph * 0.77 + k * 3.3) * 0.5 + 0.5) * BOARD_SIZE;
                const y = (Math.sin(ph * 1.03 + k * 1.9) * 0.5 + 0.5) * BOARD_SIZE;
                const xi = Math.max(0, Math.min(BOARD_SIZE - 1, x | 0));
                const yi = Math.max(0, Math.min(BOARD_SIZE - 1, y | 0));
                if (isFogVisible(yi * BOARD_SIZE + xi)) continue;
                ctx2.fillStyle = 'rgba(10,12,26,0.30)';
                ctx2.beginPath();
                ctx2.arc(pad + x * cs, pad + y * cs, cs * (0.6 + 0.25 * Math.sin(ph * 2)), 0, Math.PI * 2);
                ctx2.fill();
            }
            // 自石の周りに薄い灯りの輪 — 「ここだけが見える」を強調
            ctx2.strokeStyle = 'rgba(253,224,71,0.12)';
            ctx2.lineWidth = Math.max(1, cs * 0.05);
            board.forEach((v, i) => {
                if (v !== fogViewer()) return;
                const cx = pad + (i % BOARD_SIZE) * cs;
                const cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.55 + 0.08 * Math.sin(now / 500 + i)), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
