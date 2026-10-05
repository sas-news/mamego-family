// TREASUREGO — 宝碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'treasurego.html',
    en: 'TREASUREGO',
    jp: '宝碁',
    prefix: 'treasurego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TREASUREGO', '宝碁', 'treasurego'),
    K.params([
        { key: 'treasure_bonus', label: '宝ボーナス', min: 1, max: 20, def: 5, unit: '点' },
    ]),
    [ONE, RV_BASE, rv([
        '宝ルール: 星のマス (◆印) は宝物。終局時、宝マスの全近傍が自分の石で囲まれていれば1箇所につき+5点。',
        '宝マスそのものは普通の空点として使える (置くとその宝は消える)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 宝ルール<br>
            ※星マス (◆) を全方向囲むと終局時+5点/箇所`],
    // 宝マス描画 (星の直後)
    [ONE, `            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);`,
`            // 星 (天元・星の点)
            const starPoints = getStarPoints(BOARD_SIZE);
            // 宝マス (◆) = 星の位置
            ctx.fillStyle = 'rgba(202, 138, 4, 0.95)';
            starPoints.forEach(tp => {
                const tx = tp.x, ty = tp.y;
                if (board[ty * BOARD_SIZE + tx] !== 0) return;
                const bx = padding + tx * cellSize;
                const by = padding + ty * cellSize;
                const ds = cellSize * 0.2;
                ctx.beginPath();
                ctx.moveTo(bx, by - ds); ctx.lineTo(bx + ds, by);
                ctx.lineTo(bx, by + ds); ctx.lineTo(bx - ds, by);
                ctx.closePath(); ctx.fill();
            });`],
    [ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 宝ボーナス: 宝マスの全近傍を囲んだ側に1箇所につき得点 (設定の treasure_bonus、既定5)
            const TREASURE_BONUS = P('treasure_bonus') || 5;
            let blackTreasure = 0, whiteTreasure = 0;
            getStarPoints(BOARD_SIZE).forEach(tp => {
                const nb = getNeighbors(tp.y * BOARD_SIZE + tp.x).map(i => board[i]);
                if (nb.length > 0 && nb.every(v => v === 1)) blackTreasure++;
                if (nb.length > 0 && nb.every(v => v === 2)) whiteTreasure++;
            });
            const blackTotal = territory.black + captures[1] + blackTreasure * TREASURE_BONUS;
            const whiteTotal = territory.white + captures[2] + komi + whiteTreasure * TREASURE_BONUS;`],
    [ONE, `<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の宝:</span> <strong>+\${blackTreasure * TREASURE_BONUS}</strong></div>`],
    [ONE, `<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の宝:</span> <strong>+\${whiteTreasure * TREASURE_BONUS}</strong></div>`],
    // 宝マスのきらめき + 全近傍を囲んだ側の色で光彩 (得点予告)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 宝: きらめきと囲み完成の光彩
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            getStarPoints(BOARD_SIZE).forEach((tp, ti) => {
                if (board[tp.y * BOARD_SIZE + tp.x] !== 0) return;
                const cx = pad + tp.x * cs, cy = pad + tp.y * cs;
                const nb = getNeighbors(tp.y * BOARD_SIZE + tp.x).map(i => board[i]);
                const owner = nb.length && nb.every(v => v === 1) ? 1 : (nb.length && nb.every(v => v === 2) ? 2 : 0);
                if (owner) {
                    const pulse = 0.5 + 0.5 * Math.sin(now / 400 + ti);
                    ctx2.globalAlpha = 0.30 + 0.25 * pulse;
                    ctx2.strokeStyle = owner === 1 ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)';
                    ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                    ctx2.beginPath(); ctx2.arc(cx, cy, cs * 0.42, 0, Math.PI * 2); ctx2.stroke();
                }
                const tw = Math.sin(now / 500 + ti * 2.1);
                if (tw > 0.6) {
                    ctx2.globalAlpha = (tw - 0.6) * 2;
                    ctx2.fillStyle = '#fde047';
                    const sx = cx + Math.sin(ti * 13.7) * cs * 0.3, sy = cy + Math.cos(ti * 7.3) * cs * 0.3;
                    const s = cs * 0.10;
                    ctx2.beginPath();
                    ctx2.moveTo(sx, sy - s); ctx2.lineTo(sx + s * 0.3, sy); ctx2.lineTo(sx, sy + s); ctx2.lineTo(sx - s * 0.3, sy);
                    ctx2.closePath(); ctx2.fill();
                }
            });
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
