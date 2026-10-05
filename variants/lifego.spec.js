// LIFEGO — 生命碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

const LIFE_FN = `
        // LIFE_EVERY 手ごとに盤面全体を Conway のライフゲーム1世代進める (B3/S23・斜め含む8近傍)。
        // 誕生色は3近傍の単色のみ (混色なら誕生しない)。死滅は自然消滅 (アゲハマにならない)。
        // 前回の世代以降に置かれた石はその世代だけ死滅を免除される (新生児保護)。
        // 世代交代の結果、呼吸点を失った連は両色とも取り除く。
        const LIFE_EVERY = 4;          // 世代交代の間隔 (手数)
        const lifeNewborns = new Set(); // 前回世代以降に置かれた石 (その世代は死滅しない)
        function applyLifeStep(immune) {
            const n = BOARD_SIZE;
            immune = immune || new Set(); // 前回世代以降の新生児はこの世代は死なない
            const counts = new Array(board.length).fill(0);
            const tint = new Array(board.length).fill(0); // 0:未接触 / 1,2:単色 / -1:混色
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                const i = y * n + x;
                const c = board[i];
                if (c !== 1 && c !== 2) continue;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
                    const j = ny * n + nx;
                    counts[j]++;
                    tint[j] = tint[j] === 0 ? c : (tint[j] === c ? c : -1);
                }
            }
            const next = [...board];
            const born = [], died = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 1 || board[i] === 2) {
                    // S23: 隣接同色・異色問わず2-3個で生存、それ以外は死滅 (新生児は免除)
                    if (!immune.has(i) && (counts[i] < 2 || counts[i] > 3)) { next[i] = 0; died.push(i); }
                } else if (board[i] === 0 && counts[i] === 3 && tint[i] !== -1) {
                    // B3: 空点はちょうど3近傍・単色で誕生
                    next[i] = tint[i]; born.push(i);
                }
            }
            board = next;
            // 誕生を緑に光らせ、死滅は小さく弾ける (数が多い場合は間引き)
            born.slice(0, 24).forEach(i => fxGlow(i, 'rgba(74,222,128,0.9)', 520));
            died.slice(0, 24).forEach(i => fxBurst(i, 'rgba(160,160,170,0.8)', 3, 0.6));
            if (born.length + died.length > 0) cleanUpPieces();
            // 世代交代で呼吸点を失った連を両色とも除去 (安定するまで)
            for (let k = 0; k < 8; k++) {
                const dead = [...getCapturedStones(board, 1), ...getCapturedStones(board, 2)];
                if (dead.length === 0) break;
                dead.forEach(i => { board[i] = 0; });
                cleanUpPieces();
            }
        }
`;
module.exports = {
    file: 'lifego.html',
    en: 'LIFEGO',
    jp: '生命碁',
    prefix: 'lifego',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('LIFEGO', '生命碁', 'lifego'),
    K.params([
        { key: 'life_every', label: '世代交代の間隔', min: 1, max: 12, def: 4, unit: '手' },
        { key: 'life_cap', label: '打ち切り手数', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '4手ごとに盤面全体が Conway のライフゲームを1世代進む (B3/S23・斜め含む8近傍)。',
        '石は孤独(近傍<2)でも過密(>3)でも死滅する (前回の世代以降に置いた石はその世代は死なない)。空点はちょうど3個の同色近傍で誕生。',
        'ライフ死滅はアゲハマにならない。世代交代で呼吸点を失った連は通常通り取られる。',
        '累計200手で打ち切り終局して地計算 (無限対局を防ぐ安全装置)。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + ライフゲーム<br>
            ※4手ごと盤面が1世代進化 (誕生B3・生存S23・8近傍)`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 打ち切り終局: 累計手数で強制終局 (ライフの循環で無限対局になり得るため)
            if (history.length >= (P('life_cap') || 200)) endGameByScore();`],
    [ONE, `        function cleanUpPieces() {
            pieces = pieces.filter(pc =>
                pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] !== 0)
            );
        }`,
`        function cleanUpPieces() {
            pieces = pieces.filter(pc =>
                pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] !== 0)
            );
        }
${LIFE_FN}`],
    [ONE, RESET_BOARD,
`${RESET_BOARD}
            lifeNewborns.clear();`],
    [ONE, `            // ネクストモードでは次のピースを供給`,
`            // ライフゲーム世代交代: LIFE_EVERY 手ごとに盤面全体を1世代進める。
            // 前回世代以降に置かれた石はその世代だけ死滅を免除 (孤立しても次の世代までは残る)。
            move.cells.forEach(p => lifeNewborns.add(p.y * BOARD_SIZE + p.x));
            if (history.length % Math.max(1, P('life_every') || LIFE_EVERY) === 0) {
                applyLifeStep(lifeNewborns);
                lifeNewborns.clear();
                // 世代交代の合図: 盤中央に世代マーカーを表示
                fxText(Math.floor(BOARD_SIZE / 2) * (BOARD_SIZE + 1), '世代+1', '#4ade80', 900);
            }

            // ネクストモードでは次のピースを供給`],
    ...STONE_SPEC,
],
};
