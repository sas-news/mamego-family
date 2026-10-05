// NOGO — 禁取碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const ANY_VALID_FN = `
        // 合法手スキャン: 手番側に1つでも置ける点があれば true
        function anyValidMove(player) {
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (isValidPlacement([{ x, y }], player)) return true;
            }
            return false;
        }
        // 合法手の数を数える (詰み警告・情報表示用)
        function countLegalMoves(player) {
            let n = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                if (isValidPlacement([{ x, y }], player)) n++;
            }
            return n;
        }
`;

const STALEMATE_CHECK = `            // 詰み判定: 手番側に合法手がなければ敗北
            if (gamePhase === 'playing' && !gameOver && !anyValidMove(turn)) {
                winByRule(turn === 1 ? 2 : 1, '手詰み', '合法手がありません');
            }
`;
module.exports = {
    file: 'nogo.html',
    en: 'NOGO',
    jp: '禁取碁',
    prefix: 'nogo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('NOGO', '禁取碁', 'nogo'),
    [ONE, RV_BASE, rv([
        '禁取ルール: 相手の石を取る手 (着手の結果相手の連の呼吸点が0になる手) は置けない。',
        '自殺手も禁止。盤が埋まり合法手がなくなった側が敗北する (パス2連続の地集計も有効)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 禁取ルール<br>
            ※相手石を取る手は置けない。合法手がなくなった側が負け`],
    // 禁取: 取れる手は禁止
    [ONE, `            const captured = getCapturedStones(tempBoard, opponent);`,
`            const captured = getCapturedStones(tempBoard, opponent);
            if (captured.length > 0) return false; // 禁取: 相手石を取る手は置けない`],
    [ONE, `        function isValidPlacement(cells, player) {`, ANY_VALID_FN + `
        function isValidPlacement(cells, player) {`],
    [ONE, `        function updateUI() {`, `        function updateUI() {
${STALEMATE_CHECK}`],
    [ONE, `        function endGameByScore() {`, WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    // 禁取の可視化: 相手連の最後の呼吸点 (取れば禁手の点) に赤い禁止マーク
    [ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 禁取: 相手連の最後の呼吸点に取禁止マーク
            {
                const seen = new Set();
                const noCap = [];
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if ((c !== 1 && c !== 2) || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, c);
                    grp.forEach(g => seen.add(g));
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(m => { if (board[m] === 0) libs.add(m); }));
                    if (libs.size === 1) noCap.push([...libs][0]);
                }
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.65)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                noCap.forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.21, cy - cellSize * 0.21);
                    ctx.lineTo(cx + cellSize * 0.21, cy + cellSize * 0.21);
                    ctx.stroke();
                });
                ctx.restore();
            }`],
    ...LEGAL_DOTS_SPEC,
    ...EVENT_CHIP_SPEC(`'合法手 ' + countLegalMoves(turn)`),
    ...STONE_SPEC,
],
};
