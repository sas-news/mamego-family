// EYEGO — 眼碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'eyego.html',
    en: 'EYEGO',
    jp: '眼碁',
    prefix: 'eyego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('EYEGO', '眼碁', 'eyego'),
    K.params([
        { key: 'eye_size', label: '眼の最大サイズ', min: 1, max: 12, def: 6, unit: '点' },
    ]),
    [ONE, RV_BASE, rv([
        '眼ルール: 自分の石だけで完全に囲まれた小さな空領域 (眼・6点以内) を最初に作った側が即勝利。',
        '相手は侵入して囲みを壊せる。取り・地集計も通常通り有効。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 眼ルール<br>
            ※自分の石だけで囲まれた小領域 (6点以内) を最初に作った側が即勝利`],
    [ONE, `        function endGameByScore() {`,
`        // 眼判定: 全近傍が自分の石の小さな空領域(6点以内)があれば勝利
        function checkEyeWin(player) {
            const seen = new Set();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0 || seen.has(i)) continue;
                const q = [i]; seen.add(i);
                let onlyP = true, size = 0;
                while (q.length) {
                    const cur = q.pop(); size++;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === 0 && !seen.has(n)) { seen.add(n); q.push(n); }
                        else if (board[n] !== 0 && board[n] !== player) onlyP = false;
                    });
                }
                if (onlyP && size <= (P('eye_size') || 6)) return true;
            }
            return false;
        }
` + WIN_BY_RULE_FN + `
        function endGameByScore() {`],
    [ONE, CAPTURE_BLOCK,
`${CAPTURE_BLOCK}

            // 眼勝利判定
            if (checkEyeWin(player)) {
                winByRule(player, '眼', \`\${player === 1 ? '黒' : '白'}が眼を完成させました\`);
                return;
            }`],
    // 形成中の眼: 単色で囲まれた空領域をその色で薄く照らす (6点以内=完成=即勝利)
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 眼: 単色で囲まれた空領域を所有者色で照らす (6点以内=完成=即勝利)
        fxAmbient((ctx2, now, pad, cs) => {
            const n = BOARD_SIZE, seen = new Set();
            ctx2.save();
            for (let i = 0; i < n * n; i++) {
                if (board[i] !== 0 || seen.has(i)) continue;
                const q = [i]; seen.add(i);
                const region = [];
                let owner = 0, mixed = false;
                while (q.length) {
                    const cur = q.pop(); region.push(cur);
                    getNeighbors(cur).forEach(m => {
                        if (board[m] === 0 && !seen.has(m)) { seen.add(m); q.push(m); }
                        else if (board[m] !== 0) {
                            if (owner === 0) owner = board[m];
                            else if (board[m] !== owner) mixed = true;
                        }
                    });
                }
                if (mixed || owner === 0 || region.length > Math.max(9, P('eye_size') || 6)) continue;
                const done = region.length <= (P('eye_size') || 6);
                const col = owner === 1 ? '30,30,30' : '255,255,255';
                const pulse = 0.5 + 0.5 * Math.sin(now / 500);
                ctx2.fillStyle = 'rgba(' + col + ',' + (done ? 0.30 + 0.2 * pulse : 0.10 + 0.06 * pulse) + ')';
                region.forEach(r => {
                    ctx2.fillRect(pad + (r % n - 0.42) * cs, pad + (((r / n) | 0) - 0.42) * cs, cs * 0.84, cs * 0.84);
                });
                if (done) {
                    const cx0 = region.reduce((s, r) => s + (r % n), 0) / region.length;
                    const cy0 = region.reduce((s, r) => s + ((r / n) | 0), 0) / region.length;
                    ctx2.strokeStyle = 'rgba(' + col + ',0.8)';
                    ctx2.lineWidth = Math.max(1.4, cs * 0.06);
                    ctx2.beginPath(); ctx2.arc(pad + cx0 * cs, pad + cy0 * cs, cs * (0.28 + pulse * 0.08), 0, Math.PI * 2); ctx2.stroke();
                }
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
