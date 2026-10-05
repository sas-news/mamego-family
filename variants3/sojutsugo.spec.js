// SOJUTSUGO — 槍術碁: 敵の3連以上の直線 (槍) の間合い — 槍先から3点以内の正面には敵は踏み込めない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sojutsugo.html',
    en: 'SOJUTSUGO',
    jp: '槍術碁',
    prefix: 'sojutsugo',
    desc: '3連以上の直線は槍 — 槍先から3点以内の正面には敵は踏み込めない。',
    kind: 'stone',
    icon: 'sojutsugo',
    spec: [
        ...K.rb('SOJUTSUGO', '槍術碁', 'sojutsugo'),
        K.params([
            { key: 'spear_min', label: '槍になる連数', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'spear_range', label: '槍の間合い', min: 1, max: 7, def: 3, unit: '点' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 槍の間合い: 敵の3連以上の直線の槍先正面3点は着手不可
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 槍術碁: 敵の3連以上の直線 (槍) の間合い — 槍先正面3点には踏み込めない
            for (const p of cells) {
                for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    // 直線上で最も近い石 (3点以内) を探す
                    let tip = -1;
                    for (let t = 1; t <= (P('spear_range') || 3); t++) {
                        const x = p.x - d[0] * t, y = p.y - d[1] * t;
                        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) break;
                        if (board[y * BOARD_SIZE + x] !== 0) { tip = t; break; }
                    }
                    if (tip < 0) continue;
                    const tx = p.x - d[0] * tip, ty = p.y - d[1] * tip;
                    const c0 = board[ty * BOARD_SIZE + tx];
                    if (c0 === 0 || c0 === 3 || c0 === player) continue; // 味方の槍は踏み込める
                    // 槍の長さ (敵の連続数) を測る
                    let run = 1;
                    for (let s = tip + 1; ; s++) {
                        const x = p.x - d[0] * s, y = p.y - d[1] * s;
                        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) break;
                        if (board[y * BOARD_SIZE + x] !== c0) break;
                        run++;
                    }
                    if (run >= (P('spear_min') || 3)) return false;
                }
            }`],
        // 3連以上の直線は槍の印を先端に表示
        ...K.STONE_MARKS_SPEC(`            // 槍: 3連以上の先端の石に朱色の穂先印
            {
                ctx.save();
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    for (const d of [[1, 0], [0, 1]]) {
                        // この点が直線の先端か (前に味方、後ろに敵なしの連続>=3)
                        const bx = x - d[0], by = y - d[1];
                        if (bx < 0 || bx >= BOARD_SIZE || by < 0 || by >= BOARD_SIZE) continue;
                        if (board[by * BOARD_SIZE + bx] !== board[i]) continue;
                        let run = 1;
                        for (let s = 1; ; s++) {
                            const qx = x - d[0] * s, qy = y - d[1] * s;
                            if (qx < 0 || qx >= BOARD_SIZE || qy < 0 || qy >= BOARD_SIZE) break;
                            if (board[qy * BOARD_SIZE + qx] !== board[i]) break;
                            run++;
                        }
                        const fx2 = x + d[0], fy2 = y + d[1];
                        const front = fx2 < 0 || fx2 >= BOARD_SIZE || fy2 < 0 || fy2 >= BOARD_SIZE || board[fy2 * BOARD_SIZE + fx2] !== board[i];
                        if (run >= (P('spear_min') || 3) && front) {
                            const cx = padding + x * cellSize, cy = padding + y * cellSize;
                            ctx.strokeStyle = 'rgba(239,68,68,0.9)';
                            ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                            ctx.beginPath();
                            ctx.moveTo(cx - d[0] * cellSize * 0.2, cy - d[1] * cellSize * 0.2);
                            ctx.lineTo(cx + d[0] * cellSize * 0.28, cy + d[1] * cellSize * 0.28);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            槍術碁: 3連以上の直線は槍 — 槍先の正面3点には敵は踏み込めない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '3連以上並んだ直線は「槍」になる — 槍先 (端の石の向かい側) から3点以内の正面には敵は置けない。',
            '槍の間合いで敵を寄せ付けず壁を作る。側面と後ろは無防備。',
            '長い直線を崩されないよう囲み、槍先で制す。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        board[I(3, 3)] = 1; board[I(4, 3)] = 1; board[I(5, 3)] = 1; // 黒の槍 (横3連)
        assert('槍先正面は敵不可', isValidPlacement([{ x: 6, y: 3 }], 2) === false);
        assert('間合い内も敵不可', isValidPlacement([{ x: 7, y: 3 }], 2) === false);
        assert('間合い外は置ける', isValidPlacement([{ x: 9, y: 3 }], 2) === true);
        assert('側面は踏み込める', isValidPlacement([{ x: 4, y: 4 }], 2) === true);
        assert('味方は槍を延ばせる', isValidPlacement([{ x: 6, y: 3 }], 1) === true);
    `,
};
