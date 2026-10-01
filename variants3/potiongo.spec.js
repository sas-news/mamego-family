// POTIONGO — 薬草碁: 盤の各点は葉(0)・根(1)・実(2)の材料。
// 同じ連の中に3種すべて揃うと「調合成功」で+3目。
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
    file: 'potiongo.html',
    en: 'POTIONGO',
    jp: '薬草碁',
    prefix: 'potiongo',
    desc: '葉・根・実の材料を同じ連に揃えるとポーション調合成功。',
    kind: 'stone',
    icon: 'potiongo',
    spec: [
        ...K.rb('POTIONGO', '薬草碁', 'potiongo'),
        K.params([{ key: 'brew_pts', label: '調合の得点', min: 1, max: 9, def: 3, unit: '目' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 2.2, def: 1.1, step: 0.05, hint: '交点数×倍率' }]),
        ...PERSIST('{ brewPts: { 1: 0, 2: 0 }, brewed: {} }'),
        // 薬草ルール: 連の中に3種の材料が揃うと調合成功 (+3)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 薬草ルール: 材料3種を同じ連に集めて調合
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const grp = getConnectedGroup(i0, player);
                const types = {};
                let fresh = false;
                grp.forEach(i => {
                    types[(i % BOARD_SIZE + ((i / BOARD_SIZE) | 0)) % 3] = true;
                    if (!st.brewed[i]) fresh = true;
                });
                if (fresh && types[0] && types[1] && types[2]) {
                    grp.forEach(i => { st.brewed[i] = 1; });
                    st.brewPts[player] += (P('brew_pts') || 3);
                    fxText(i0, '調合成功+' + (P('brew_pts') || 3), '#4ade80', 1200);
                    fxGlow(i0, '#22c55e', 800);
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 調合得分を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const brewB = st.brewPts[1], brewW = st.brewPts[2];
            const blackTotal = territory.black + captures[1] + brewB;
            const whiteTotal = territory.white + captures[2] + brewW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の調合:</span> <strong>\${brewB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の調合:</span> <strong>\${brewW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 材料の色: 葉=緑・根=茶・実=赤 の小さな印を各点に
        ...K.STONE_MARKS_SPEC(`            {
                const col = ['rgba(74,222,128,0.75)', 'rgba(180,120,60,0.75)', 'rgba(248,113,113,0.75)'];
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const t = (x + y) % 3;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    if (board[i] === 0) {
                        ctx.fillStyle = col[t].replace('0.75', '0.18');
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (board[i] === 1 || board[i] === 2) {
                        ctx.fillStyle = col[t];
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * 0.33, cellSize * 0.075, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    if (st.brewed[i]) {
                        ctx.strokeStyle = 'rgba(34,197,94,0.8)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.035);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'調合 黒' + st.brewPts[1] + ' / 白' + st.brewPts[2]`),
        [K.ONE, K.INFO_ALGO, `            薬草碁: 各点は葉・根・実の材料 (色点)。同じ連に3種揃えるとポーション調合で+3<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の各交点は材料の産地: 葉(緑)・根(茶)・実(赤) が市松に分布する。',
            '自分の連の中に3種すべての材料が揃うと「調合成功」で+3目 (連の成長でも再判定されるが1連1回)。',
            '敵の連に入り込んで材料を欠かせるか、取って材料を奪うか — 調合の攻防。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.brewPts = { 1: 0, 2: 0 }; st.brewed = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // (x+y)%3 が 0,1,2 揃う連を作る: (3,3)=6%3=0, (4,3)=7%3=1, (4,4)=8%3=2
        board[3 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('3種揃いで調合成功+3', st.brewPts[1] === 3);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('同じ連で再調合しない', st.brewPts[1] === 3);
        assert('白は未調合', st.brewPts[2] === 0);
    `,
};
