// KINGGO — 王碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'kinggo.html',
    en: 'KINGGO',
    jp: '王碁',
    prefix: 'kinggo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('KINGGO', '王碁', 'kinggo'),
    [ONE, RV_BASE, rv([
        '各プレイヤーが最初に置いた石は「王」(♛マーク) になる。',
        '王を含む連が取られると即座に敗北。通常の地集計勝負 (パス2連続) も同時に有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 王石ルール<br>
            ※各プレイヤーの最初の石が王 (♛)。王を取られると即負け`],
    [ONE, `        let consecutivePasses = 0;`,
`        let consecutivePasses = 0;
        let kings = { 1: -1, 2: -1 }; // 各プレイヤーの王石 (盤面idx、-1=未配置)`],
    // 着手後: 初手は王として登録
    [ONE, PIECES_PUSH,
`            // 王碁: 各プレイヤーが最初に置いた石が「王」になる
            if (kings[player] === -1) kings[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;

${PIECES_PUSH}`],
    // 捕獲時に相手の王を取っていたら即勝利
    [ONE, CAPTURE_BLOCK,
`            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                if (captured.includes(kings[opponent])) {
                    kings[opponent] = -1;
                    winByRule(player, '王取り', \`\${player === 1 ? '黒' : '白'}が相手の王を取りました\`);
                    return;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
    // 王の威光: 黄金の光輪 + 連の呼吸点が1以下で赤い警告点滅
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 王の威光と窮地の警告
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            [1, 2].forEach(pl => {
                const k = kings[pl];
                if (k < 0 || board[k] !== pl) return;
                const cx = pad + (k % BOARD_SIZE) * cs, cy = pad + ((k / BOARD_SIZE) | 0) * cs;
                const libs = getLiberties(board, k);
                const danger = libs <= 1;
                const pulse = 0.5 + 0.5 * Math.sin(now / (danger ? 170 : 800));
                ctx2.globalAlpha = danger ? 0.50 + 0.38 * pulse : 0.20 + 0.12 * pulse;
                ctx2.strokeStyle = danger ? '#ef4444' : '#fbbf24';
                ctx2.lineWidth = Math.max(1.5, cs * 0.07);
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.62 + 0.07 * pulse), 0, Math.PI * 2);
                ctx2.stroke();
            });
            ctx2.restore();
        });`],
    // 王石の冠マーカー描画
    [ONE, `        function drawLastMove(padding, cellSize) {`,
`        // 王石 (♛) の描画
        function drawKings(padding, cellSize) {
            [1, 2].forEach(pl => {
                const k = kings[pl];
                if (k < 0 || board[k] !== pl) return;
                const kx = k % BOARD_SIZE, ky = Math.floor(k / BOARD_SIZE);
                ctx.save();
                ctx.fillStyle = pl === 1 ? '#fbbf24' : '#b45309';
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.font = \`bold \${Math.round(cellSize * 0.5)}px sans-serif\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const kcx = padding + kx * cellSize, kcy = padding + ky * cellSize;
                ctx.strokeText('♛', kcx, kcy + cellSize * 0.04);
                ctx.fillText('♛', kcx, kcy + cellSize * 0.04);
                ctx.restore();
            });
        }

        function drawLastMove(padding, cellSize) {`],
    [ONE, `            // 直前に配置したピースのハイライト(緑系)
            drawLastMove(padding, cellSize);`,
`            // 直前に配置したピースのハイライト(緑系)
            drawLastMove(padding, cellSize);

            // 王石の冠マーカー
            drawKings(padding, cellSize);`],
    // 状態保存・復元・同期に kings を追加
    [ONE, SAVE_TAIL,
`                    heldPieces,
                    holdUsed,
                    kings,
                    gameMode,`],
    [ONE, LOAD_HOLD,
`            holdUsed = !!s.holdUsed;
            kings = (s.kings && typeof s.kings === 'object')
                ? { 1: s.kings[1] || -1, 2: s.kings[2] || -1 } : { 1: -1, 2: -1 };`],
    [ONE, SNAP_PUSH,
`                heldPieces: { ...heldPieces },
                holdUsed,
                kings: { ...kings }
            });`],
    [ONE, SNAP_POP,
`            holdUsed = !!snap.holdUsed;
            kings = snap.kings ? { ...snap.kings } : { 1: -1, 2: -1 };`],
    [ONE, ONLINE_SEND,
`                heldPieces,
                holdUsed,
                kings,
                deadStones: [...deadStones],`],
    [ONE, ONLINE_RECV,
`            holdUsed = !!data.holdUsed;
            kings = data.kings ? { ...data.kings } : { 1: -1, 2: -1 };`],
    [ONE, RESET_HELD,
`            heldPieces = { 1: null, 2: null };
            kings = { 1: -1, 2: -1 };`],
    // 即勝利ヘルパー
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    ...STONE_SPEC,
],
};
