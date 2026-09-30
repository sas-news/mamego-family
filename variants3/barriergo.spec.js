// BARRIERGO — 結界碁: 四隅の結界石(キーストーン)を3つ以上占めると結界が張られ、
// 内部の空点と敵石が終局時に自分の得点になる。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

// 結界ロジック共有部品 (endGameByScore内・描画内の両方で同じ定義を使う)
const KEYS_FN = `
            // 結界石: 四隅から2目離れた4点
            const KEYSTONES = [
                [2, 2], [BOARD_SIZE - 3, 2], [2, BOARD_SIZE - 3], [BOARD_SIZE - 3, BOARD_SIZE - 3]
            ];
            const inPoly = (px, py, poly) => {
                let inside = false;
                for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                    const [xi, yi] = poly[i], [xj, yj] = poly[j];
                    if ((yi > py) !== (yj > py)
                        && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
                }
                return inside;
            };
            const barrierInfo = (p) => {
                const owned = KEYSTONES.filter(([x, y]) => board[y * BOARD_SIZE + x] === p);
                if (owned.length < 3) return null;
                // 単純多角形: x昇順→yで整列して凸包相当 (結界石は4点のみ)
                const hull = owned.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
                if (hull.length === 3) {
                    // 三角形はそのまま
                } else {
                    // 4点: 左上→右上→右下→左下 の時計回りに並べ替え
                    hull.sort((a, b) => Math.atan2(a[1] - 4.5, a[0] - 4.5) - Math.atan2(b[1] - 4.5, b[0] - 4.5));
                }
                return hull;
            };
`;

module.exports = {
    file: 'barriergo.html',
    en: 'BARRIERGO',
    jp: '結界碁',
    prefix: 'barriergo',
    desc: '結界石を3つ結ぶと結界が張られる。内部の空点と敵石が得点に。',
    kind: 'stone',
    icon: 'barriergo',
    spec: [
        ...K.rb('BARRIERGO', '結界碁', 'barriergo'),
        // 結界スコア: キーストーン3つ以上で囲まれた領域を得点化
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`${KEYS_FN}
            const barrierPts = (p, q) => {
                const hull = barrierInfo(p);
                if (!hull) return 0;
                let pts = 0;
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] === p) continue;
                    if (inPoly(x, y, hull)) pts += 1;
                }
                return pts;
            };
            const barB = barrierPts(1, 2), barW = barrierPts(2, 1);
            const blackTotal = territory.black + captures[1] + barB;
            const whiteTotal = territory.white + captures[2] + barW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の結界:</span> <strong>\${barB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の結界:</span> <strong>\${barW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 結界線の描画: キーストーンの印と、3つ以上占めた側の結界ライン
        ...K.STONE_MARKS_SPEC(`            {
                const KEYS = [
                    [2, 2], [BOARD_SIZE - 3, 2], [2, BOARD_SIZE - 3], [BOARD_SIZE - 3, BOARD_SIZE - 3]
                ];
                const now = fxNow();
                ctx.save();
                // キーストーンの印 (未占領は淡い魔方陣)
                KEYS.forEach(([x, y]) => {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const occ = board[y * BOARD_SIZE + x];
                    ctx.strokeStyle = occ ? (occ === 1 ? 'rgba(96,165,250,0.9)' : 'rgba(248,113,113,0.9)') : 'rgba(129,140,248,0.4)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    for (let k = 0; k < 4; k++) {
                        const a = Math.PI / 4 + k * Math.PI / 2;
                        const px = cx + cellSize * 0.34 * Math.cos(a), py = cy + cellSize * 0.34 * Math.sin(a);
                        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                });
                // 結界ライン: 3つ以上を占めた側に発光リンク
                [1, 2].forEach(p => {
                    const owned = KEYS.filter(([x, y]) => board[y * BOARD_SIZE + x] === p);
                    if (owned.length < 3) return;
                    owned.sort((a, b) => Math.atan2(a[1] - 4.5, a[0] - 4.5) - Math.atan2(b[1] - 4.5, b[0] - 4.5));
                    const c = p === 1 ? '96,165,250' : '248,113,113';
                    ctx.strokeStyle = 'rgba(' + c + ',' + (0.5 + 0.3 * Math.sin(now / 450)) + ')';
                    ctx.lineWidth = Math.max(2, cellSize * 0.1);
                    ctx.beginPath();
                    owned.forEach(([x, y], k) => {
                        const px = padding + x * cellSize, py = padding + y * cellSize;
                        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    });
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(' + c + ',0.10)';
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { const K2 = [[2, 2], [BOARD_SIZE - 3, 2], [2, BOARD_SIZE - 3], [BOARD_SIZE - 3, BOARD_SIZE - 3]]; let b = 0, w = 0; K2.forEach(([x, y]) => { const v = board[y * BOARD_SIZE + x]; if (v === 1) b++; else if (v === 2) w++; }); return '結界石 黒' + b + ' / 白' + w; })()`),
        [K.ONE, K.INFO_ALGO, `            結界碁: 四隅の結界石を3つ以上占めると結界発動。内部の空点と敵石が終局時に得点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅から2目離れた4点が「結界石」(魔方陣の印)。',
            '自分の石で結界石を3つ以上占めると結界が張られる: 内部の空点と敵石がすべて終局時の自分の得点になる。',
            '結界内の敵石は「封印」される — 中に残すと危険。結界石の争奪戦。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[2 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + (BOARD_SIZE - 3)] = 1; board[(BOARD_SIZE - 3) * BOARD_SIZE + 2] = 1;
        endGameByScore();
        assert('3石で結界が張られる', gameResultData.details.includes('結界'));
        assert('結界内の空点が得点に', gameResultData.details.includes('黒の結界:</span> <strong>') && !gameResultData.details.includes('黒の結界:</span> <strong>0</strong>'));
        board.fill(0);
        board[2 * BOARD_SIZE + 2] = 2; board[2 * BOARD_SIZE + (BOARD_SIZE - 3)] = 2;
        endGameByScore();
        assert('2石では結界不成立', gameResultData.details.includes('黒の結界:</span> <strong>0</strong>'));
    `,
};
