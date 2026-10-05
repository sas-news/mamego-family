// TWILIGHTGO — 黄昏碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'twilightgo.html',
    en: 'TWILIGHTGO',
    jp: '黄昏碁',
    prefix: 'twilightgo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('TWILIGHTGO', '黄昏碁', 'twilightgo'),
    K.params([
        { key: 'phase_len', label: '昼/夜の長さ', min: 2, max: 12, def: 6, unit: '手' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '黄昏ルール: 12手周期で昼と夜が交互に来る。昼 (前半6手) は通常配置、',
        '夜 (後半6手) は自分の石に隣接する点にしか置けない (自石が無ければどこでも可)。',
        '手番表示の ☀/☾ が現在のフェーズ。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 黄昏ルール<br>
            ※昼(6手)=自由配置、夜(6手)=自石隣接のみ。☀/☾表示`],
    [ONE, `        function endGameByScore() {`,
`        // 黄昏: 2周期の後半が「夜」(周期長は設定で調整)
        function isNight() {
            return Math.floor(history.length / (P('phase_len') || 6)) % 2 === 1;
        }

        function endGameByScore() {`],
    [ONE, VALID_BOUNDS,
`${VALID_BOUNDS}

            // 黄昏ルール: 夜は自石隣接のみ
            if (isNight() && board.some(v => v === player) &&
                !cells.some(p => getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
    [ONE, TURN_LINE,
`            turnIndicator.textContent = (turn === 1 ? '黒 (1P)' : '白 (2P)') + (isNight() ? ' ☾' : ' ☀');`],
    // 夜は盤全体を薄く冷たく沈める
    CUE_GRID(`            // 黄昏: 夜の間は盤全体を冷色のヴェールで覆う
            if (isNight()) {
                ctx.save();
                ctx.fillStyle = 'rgba(30,40,70,0.15)';
                ctx.fillRect(0, 0, width, width);
                ctx.restore();
            } else {
                ctx.save();
                ctx.fillStyle = 'rgba(255,230,150,0.05)';
                ctx.fillRect(0, 0, width, width);
                ctx.restore();
            }`),
    // 昼夜の切替を「昼/夜」のフラッシュで知らせる
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 黄昏碁: N手ごとの昼夜切替を盤上の表示で発火
            if (history.length % (P('phase_len') || 6) === 0 && history.length > 0) {
                const tc = move.cells[0];
                if (tc) {
                    const ti = tc.y * BOARD_SIZE + tc.x;
                    fxText(ti, isNight() ? '夜 ☾' : '昼 ☀', isNight() ? '#93c5fd' : '#fde68a', 1200);
                    fxGlow(ti, isNight() ? '#60a5fa' : '#fbbf24', 800);
                }
            }

            turn = opponent;
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    // 夜の星空と昼の陽光の燦めき — フェーズが一目で分かる常時演出
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 黄昏碁: 夜は瞬く星、昼は陽光の燦めきが舞う常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            if (isNight()) {
                for (let k = 0; k < 16; k++) {
                    const tw = Math.sin(now / 400 + k * 2.7);
                    if (tw < 0.2) continue;
                    ctx2.globalAlpha = 0.10 + tw * 0.20;
                    ctx2.fillStyle = '#e0e7ff';
                    ctx2.beginPath();
                    ctx2.arc((Math.sin(k * 12.9898) * 0.5 + 0.5) * w, (Math.sin(k * 78.233) * 0.5 + 0.5) * w, cs * 0.05, 0, Math.PI * 2);
                    ctx2.fill();
                }
            } else {
                for (let k = 0; k < 8; k++) {
                    const ph = now / 2600 + k * 1.9;
                    ctx2.globalAlpha = 0.06 + 0.07 * Math.sin(ph * 2 + k);
                    ctx2.fillStyle = '#fbbf24';
                    ctx2.beginPath();
                    ctx2.arc((Math.sin(ph * 0.6 + k * 2.9) * 0.5 + 0.5) * w, (Math.cos(ph * 0.8 + k * 1.7) * 0.5 + 0.5) * w, cs * 0.14, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
    ...LEGAL_DOTS_SPEC,
    ...STONE_SPEC,
],
};
