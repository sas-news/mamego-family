// ANTCOLONYGO — 蟻群碁: 四隅は餌場。石で占めると餌を獲得して+4目。
// 石の隣の空点はフェロモンが滲み、道が見える。
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'antcolonygo.html',
    en: 'ANTCOLONYGO',
    jp: '蟻群碁',
    prefix: 'antcolonygo',
    desc: '四隅は餌場。石で占めると+4目。石の隣にはフェロモンの道が滲む。',
    kind: 'stone',
    icon: 'antcolonygo',
    spec: [
        ...K.rb('ANTCOLONYGO', '蟻群碁', 'antcolonygo'),
        K.params([
            { key: 'food_pts', label: '餌場の得点', min: 1, max: 12, def: 4, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 2.2, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...PERSIST('{ fed: {}, foodPts: { 1: 0, 2: 0 } }'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 蟻群: 四隅の餌場
        const FOOD = () => [0, BOARD_SIZE - 1, (BOARD_SIZE - 1) * BOARD_SIZE, BOARD_SIZE * BOARD_SIZE - 1];
        function isValidPlacement(cells, player) {`],
        // 蟻群ルール: 隅の餌場を占めると+4 (1餌場1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蟻群ルール: 餌場の制圧
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (FOOD().includes(i0) && board[i0] === player && !st.fed[i0]) {
                    st.fed[i0] = player;
                    st.foodPts[player] += (P('food_pts') || 4);
                    fxText(i0, '餌獲得+' + (P('food_pts') || 4), '#fb923c', 1300);
                    fxBurst(i0, '#f97316', 10);
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 餌の得点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const foodB = st.foodPts[1], foodW = st.foodPts[2];
            const blackTotal = territory.black + captures[1] + foodB;
            const whiteTotal = territory.white + captures[2] + foodW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の餌:</span> <strong>\${foodB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の餌:</span> <strong>\${foodW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 餌場とフェロモンの道の描画
        ...K.STONE_MARKS_SPEC(`            {
                const now = fxNow();
                ctx.save();
                // フェロモン: 石に隣接する空点に色の滲み
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    let pher = 0;
                    getNeighbors(i).forEach(n => { if (board[n] === 1 || board[n] === 2) pher++; });
                    if (!pher) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(217,119,6,' + Math.min(0.30, pher * 0.10) + ')';
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.12 + pher * cellSize * 0.03, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 餌場の描画: 角に砂糖の結晶
                FOOD().forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const taken = st.fed[i];
                    ctx.fillStyle = taken ? (taken === 1 ? 'rgba(96,165,250,0.9)' : 'rgba(248,113,113,0.9)') : 'rgba(251,191,36,0.85)';
                    for (let k = 0; k < 3; k++) {
                        const a = now / 900 + k * 2.1;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(a) * cellSize * 0.14, cy + Math.sin(a) * cellSize * 0.14, cellSize * 0.09, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'餌 黒' + st.foodPts[1] + ' / 白' + st.foodPts[2]`),
        [K.ONE, K.INFO_ALGO, `            蟻群碁: 四隅は餌場。石で占めると+4目 (1ヶ所1回)。石の隣にはフェロモンが滲む<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四隅は餌場。自分の石で占めると餌を獲得して+4目 (各隅1回のみ)。',
            '石の隣の空点はフェロモンの道として色が滲む — 蟻の通り道が可視化される。',
            '餌場は隅 — 蟻は遠回りする。通常の碁と餌争奪の二正面作戦。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.fed = {}; st.foodPts = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('隅の餌場を制圧+4', st.foodPts[1] === 4 && st.fed[0] === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('餌場は1回のみ', st.foodPts[1] === 4);
        assert('白は未取得', st.foodPts[2] === 0);
    `,
};
