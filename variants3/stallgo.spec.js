// STALLGO — 夜店碁: 星の点が「屋台」。屋台を出した側に得点、隣接する客(自石)でさらに加点。
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

module.exports = {
    file: 'stallgo.html',
    en: 'STALLGO',
    jp: '夜店碁',
    prefix: 'stallgo',
    desc: '星の点が夜店の屋台。屋台を出し、客(石)を集めて得点。',
    kind: 'stone',
    icon: 'stallgo',
    spec: [
        ...K.rb('STALLGO', '夜店碁', 'stallgo'),
        K.params([
            { key: 'stall_pts', label: '屋台の得点', min: 0, max: 6, def: 2, unit: '点' },
            { key: 'guest_pts', label: '客1人あたりの得点', min: 0, max: 3, def: 1, unit: '点' },
        ]),
        // 屋台得点: 星の点を占めると+2、隣接する自石(客)1つごとにさらに+1
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 夜店碁: 屋台(星の点)を占めると+2、隣接する自石1つごとに+1 (客集め)
            const stallPts = (p) => {
                let pts = 0;
                getStarPoints(BOARD_SIZE).forEach(sp => {
                    const si = sp.y * BOARD_SIZE + sp.x;
                    if (board[si] !== p) return;
                    pts += (P('stall_pts') ?? 2);
                    getNeighbors(si).forEach(n => { if (board[n] === p) pts += (P('guest_pts') ?? 1); });
                });
                return pts;
            };
            const stallB = stallPts(1), stallW = stallPts(2);
            const blackTotal = territory.black + captures[1] + stallB;
            const whiteTotal = territory.white + captures[2] + stallW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の屋台得分:</span> <strong>\${stallB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の屋台得分:</span> <strong>\${stallW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 屋台描画: 星の点に小さな赤提灯、占めると明るく灯る
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(sp => {
                    const cx = padding + sp.x * cellSize, cy = padding + sp.y * cellSize;
                    const occ = board[sp.y * BOARD_SIZE + sp.x];
                    // 提灯本体 (占領で灯色、未占領は淡い輪郭)
                    ctx.fillStyle = occ ? '#ef4444' : 'rgba(239,68,68,0.14)';
                    ctx.strokeStyle = occ ? '#7f1d1d' : 'rgba(153,27,27,0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.035);
                    ctx.beginPath();
                    ctx.ellipse(cx, cy - cellSize * 0.52, cellSize * 0.17, cellSize * 0.21, 0, 0, Math.PI * 2);
                    ctx.fill(); ctx.stroke();
                    // 上下の口金
                    ctx.fillStyle = occ ? '#451a03' : 'rgba(69,26,3,0.4)';
                    ctx.fillRect(cx - cellSize * 0.07, cy - cellSize * 0.76, cellSize * 0.14, cellSize * 0.05);
                    ctx.fillRect(cx - cellSize * 0.07, cy - cellSize * 0.30, cellSize * 0.14, cellSize * 0.05);
                    if (occ) {
                        ctx.fillStyle = '#fde68a';
                        ctx.font = 'bold ' + Math.round(cellSize * 0.3) + 'px sans-serif';
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('祭', cx, cy - cellSize * 0.52);
                    }
                });
                ctx.restore();
            }`),
        // 夜の雰囲気: 盤上を薄い宵闇のヴィネットで覆う
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 夜店の宵闇: 薄い紺の覆いと提灯の灯り
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const g = ctx2.createRadialGradient(w / 2, w / 2, w * 0.2, w / 2, w / 2, w * 0.75);
            g.addColorStop(0, 'rgba(10,10,40,0)');
            g.addColorStop(1, 'rgba(10,10,40,0.22)');
            ctx2.fillStyle = g;
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { let b = 0, w = 0; getStarPoints(BOARD_SIZE).forEach(sp => { const v = board[sp.y * BOARD_SIZE + sp.x]; if (v === 1) b++; else if (v === 2) w++; }); return '屋台 黒' + b + ' / 白' + w; })()`),
        [K.ONE, K.INFO_ALGO, `            夜店碁: 星の点が夜店の屋台。屋台を出し、隣に客(自石)を集めて得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点は夜店の「屋台」。自分の石で占めると終局時に+2目。',
            '屋台に隣接する自分の石は「客」— 1つにつきさらに+1目。',
            '屋台は両者の共通目標。相手に取られた屋台は相手の得点になる。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('星の点が存在する', getStarPoints(BOARD_SIZE).length >= 5);
        const sp = getStarPoints(BOARD_SIZE)[0];
        board[sp.y * BOARD_SIZE + sp.x] = 1; // 黒が屋台を出す
        board[sp.y * BOARD_SIZE + sp.x + 1] = 1; // 客1
        board[sp.y * BOARD_SIZE + sp.x + 2] = 2; // 相手の客は数えない
        endGameByScore();
        assert('屋台+客の得分が結果に反映', gameResultData.details.includes('屋台'));
    `,
};
