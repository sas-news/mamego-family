// THUNDERGO — 雷碁 (wave1 から spec ファイルへ移行)
const K = require('../gen_kit.js');
const { BASE, apply, ONE, out, ALGO_SIZE_SPEC, ALGO_RULES_SPEC, ALGO_PIECES_SPEC, MOLECULES_BASE, OCNT_BASE, NBRS_GRID, VALID_BOUNDS, INFO_BASE, TRAY_DIV, SUPPLY_SEC, CATALOG_ROW, SIZE_BTNS, STARS_BASE, RCM_BASE, RV_BASE, RC_BASE, PIECES_PUSH, CAPTURE_BLOCK, TURN_FLIP, FALLBACK_SKIP, TOGGLE_GUARD, BOARD_DECL, RESET_BOARD, RESET_HELD, PASS_INC, SNAP_PUSH, SNAP_POP, LOAD_HOLD, SAVE_TAIL, ONLINE_SEND, ONLINE_RECV, TURN_LINE, UI_TAIL, NEXTBOX_HTML, GRID_RENDER, AI_EVAL, TRAY_UI_BASE, HOLD_ROTATE_FNS, CLICK_BODY, MOUSE_MOVE, PLACE_AT, REFRESH_PREVIEW, RESET_SUPPLY, LOAD_QUEUE, SAVE_QUEUE, SNAP_QUEUE, UNDO_QUEUE, ONLINE_QUEUE_RECV, ONLINE_QUEUE_SEND, PALETTE_FOR, PALETTE_CLICK, SHUFFLE_FN, QUEUE_DECL, PMODE_DECL, AI_TYPES, SUPPLY_BLOCK, rv, rc, RULES_STONE_COMMON, RULES_STONE_CONTROLS, STARS_GENERIC, SIZE_BTNS_91319, rb, STONE_DEFS, STONE_SPEC, PER_PLAYER_SPEC, WIN_BY_RULE_FN, voidDraw, WALL_GUARD_SPEC, WALL_DRAW, WALL_SPEC, CIRCLE_FRAME_NONE, CIRCLE_DRAW, LEGAL_DOTS, LEGAL_DOTS_SPEC, EVENT_CHIP_SPEC, wrapMarks, WRAP_MARKS_SPEC, STONE_MARKS_SPEC, CUE_STARS, CUE_GRID, COVERED_ANCHOR, OBSTACLE_ANCHOR, FX_BOOT, texDraw, PAINT_WATER, PAINT_ROCK, PAINT_BRICK, PAINT_RIFT, PAINT_FRAME, PAINT_TOMB, PAINT_STEEL, PAINT_ZOMBIE, PAINT_CAVE, PAINT_MOSS, PAINT_METEOR, PAINT_PIT, PAINT_CLIFF, AMBIENT_WATER, AMBIENT_MIST, ALL } = K;

module.exports = {
    file: 'thundergo.html',
    en: 'THUNDERGO',
    jp: '雷碁',
    prefix: 'thundergo',
    kind: 'stone',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    spec: [
    ...rb('THUNDERGO', '雷碁', 'thundergo'),
    K.params([
        { key: 'interval', label: '落雷間隔', min: 3, max: 30, def: 10, unit: '手' },
        { key: 'max_size', label: '対象の最大連サイズ', min: 1, max: 20, def: 6, unit: '石' },
        { key: 'max_moves', label: '手数上限', min: 60, max: 600, def: 200, unit: '手' },
    ]),
    [ONE, RV_BASE, rv([
        '雷ルール: 合計10手ごとに6石以下のランダムな石連が雷に打たれて消滅する (アゲハマにはならない)。',
        '小さな連も一撃で消えることがある — 盤面の運要素が大きい祭り碁。',
        '安全装置: 合計200手に達すると自動終局し得点計算する。',
    ])],
    [ONE, INFO_BASE,
`            通常の囲碁 + 雷ルール<br>
            ※10手ごとに小さな連が雷で消滅 (アゲハマにならない)。200手で自動終局`],
    [ONE, `        function endGameByScore() {`,
`        // 雷: ランダムな小さな連(6石以下)を1つ消滅させる
        function applyThunder() {
            const seen = new Set(), groups = [];
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                const g = getConnectedGroup(i, v);
                g.forEach(x => seen.add(x));
                if (g.length <= (P('max_size') || 6)) groups.push(g);
            }
            if (!groups.length) return;
            const group = groups[(Math.random() * groups.length) | 0];
            // 落雷演出: 打点の雷光 + 画面揺れ
            const ti = group[0];
            fxGlow(ti, '#fef08a', 800);
            fxText(ti, '落雷!', '#fde047', 900);
            fxShake(6, 320);
            group.forEach(i => {
                board[i] = 0;
                fxBurst(i, '#fde047', 8, 1.7);
                fxBurst(i, '#e0f2fe', 4, 1.2);
            });
            cleanUpPieces();
            soundManager.playCapture();
        }

        function endGameByScore() {`],
    [ONE, TURN_FLIP,
`            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;
            // 雷: N手ごとにランダムな連が消滅 (間隔は設定で調整)
            if (history.length % (P('interval') || 10) === 0) applyThunder();
            // 手数上限で自動終局
            if (history.length >= (P('max_moves') || 200)) { endGameByScore(); return; }`],
    ...EVENT_CHIP_SPEC(`'落雷' + ((P('interval') || 10) - history.length % (P('interval') || 10)) + '手'`),
    // 雷雲の常時オーバーレイ: 盤を這う暗い雲影 + ときどき遠雷の閃き
    [ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 嵐: 薄い雲影が這い、ときどき遠雷が空を明るくする
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            // 這う雲影 (2枚の楕円が時間で流れる)
            for (let k = 0; k < 2; k++) {
                const t = now / (9000 + k * 4000) + k * 0.53;
                const cx = w * (t - Math.floor(t)) * 1.4 - w * 0.2;
                const cy = w * (0.25 + 0.5 * ((k * 0.37 + 0.2) % 1));
                const g = ctx2.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
                g.addColorStop(0, 'rgba(30, 41, 59, 0.16)');
                g.addColorStop(1, 'rgba(30, 41, 59, 0)');
                ctx2.fillStyle = g;
                ctx2.fillRect(0, 0, w, w);
            }
            // 遠雷: 約12秒周期の一拍だけ空が白む
            const cyc = (now / 12000) % 1;
            if (cyc < 0.012) {
                ctx2.fillStyle = 'rgba(224, 242, 254, ' + (0.10 * (1 - cyc / 0.012)) + ')';
                ctx2.fillRect(0, 0, w, w);
            }
            ctx2.restore();
        });`],
    ...STONE_SPEC,
],
};
