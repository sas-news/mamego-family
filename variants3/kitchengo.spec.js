// KITCHENGO — 厨房碁: オーダーは「直列の盛り付け」。自石を横/縦に3連で完成+2、5連で大盛り+4。
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
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'kitchengo.html',
    en: 'KITCHENGO',
    jp: '厨房碁',
    prefix: 'kitchengo',
    desc: '直列3連でオーダー完成+2、5連で大盛り+4。配置の美しさを競う。',
    kind: 'stone',
    icon: 'kitchengo',
    spec: [
        ...K.rb('KITCHENGO', '厨房碁', 'kitchengo'),
        K.params([
            { key: 'order_len', label: 'オーダー完成の連数', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'order_pts', label: 'オーダー完成の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'big_len', label: '大盛りの連数', min: 4, max: 8, def: 5, unit: '連' },
            { key: 'big_pts', label: '大盛りの得点', min: 0, max: 12, def: 4, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...PERSIST('{ orderPts: { 1: 0, 2: 0 } }'),
        // 厨房ルール: 着手点を通る自石の直線ランが 3連→+2 / 5連→+4
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 厨房ルール: オーダー(直列ラン)の完成判定
            {
                const cell0 = move.cells[0];
                const i0 = cell0.y * BOARD_SIZE + cell0.x;
                let maxRun = 1;
                [[1, 0], [0, 1], [1, 1], [1, -1]].forEach(([dx, dy]) => {
                    let run = 1;
                    for (const s of [-1, 1]) {
                        let nx = cell0.x + dx * s, ny = cell0.y + dy * s;
                        while (nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE
                            && board[ny * BOARD_SIZE + nx] === player) {
                            run++; nx += dx * s; ny += dy * s;
                        }
                    }
                    if (run > maxRun) maxRun = run;
                });
                if (maxRun === (P('order_len') || 3)) {
                    st.orderPts[player] += (P('order_pts') ?? 2);
                    fxText(i0, 'オーダー完成+' + (P('order_pts') ?? 2), '#fb923c', 1100);
                    fxGlow(i0, '#fbbf24', 700);
                } else if (maxRun >= (P('big_len') || 5)) {
                    st.orderPts[player] += (P('big_pts') ?? 4);
                    fxText(i0, '大盛り+' + (P('big_pts') ?? 4) + '!', '#f59e0b', 1300);
                    fxGlow(i0, '#f59e0b', 900);
                    fxShake(3, 220);
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: オーダー得分を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const ordB = st.orderPts[1], ordW = st.orderPts[2];
            const blackTotal = territory.black + captures[1] + ordB;
            const whiteTotal = territory.white + captures[2] + ordW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒のオーダー:</span> <strong>\${ordB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白のオーダー:</span> <strong>\${ordW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        ...K.EVENT_CHIP_SPEC(`'厨房 黒' + st.orderPts[1] + '点 / 白' + st.orderPts[2] + '点'`),
        [K.ONE, K.INFO_ALGO, `            厨房碁: 自石を直線に3連で「オーダー完成」(+2)、5連で「大盛り」(+4)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            'オーダーは「直列の盛り付け」。着手点を通る自石の直線ラン(横・縦・斜め)がちょうど3連になると完成で+2目。',
            'さらに伸ばして5連以上にすると「大盛り」で+4目 (3連の+2と別途)。',
            'オーダー得分は終局時の採点に加算される。敵のランは相手のオーダーになる。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.orderPts = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[5 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // (3,5)-(4,5)-(5,5) で横3連
        assert('3連でオーダー完成+2', st.orderPts[1] === 2);
        board[2 * BOARD_SIZE + 6] = 1; board[3 * BOARD_SIZE + 6] = 1; board[4 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // (6,2..6) で縦5連
        assert('5連で大盛り+4', st.orderPts[1] === 6);
        assert('白は未受注', st.orderPts[2] === 0);
    `,
};
