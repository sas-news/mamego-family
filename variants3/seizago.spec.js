// SEIZAGO — 星座碁: 石は星。4つ以上の味方の連が一直線 (縦・横・斜め) に
// 並ぶと星座として認定され+4目。
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
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'seizago.html',
    en: 'SEIZAGO',
    jp: '星座碁',
    prefix: 'seizago',
    desc: '石は星。4つ以上の連が一直線に並ぶと星座となり+4目。',
    kind: 'stone',
    icon: 'seizago',
    spec: [
        ...K.rb('SEIZAGO', '星座碁', 'seizago'),
        ...PERSIST('{ starPts: { 1: 0, 2: 0 }, marked: {} }'),
        // 星座ルール: 4つ以上の連が一直線に並ぶと+4 (1連1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 星座ルール: 連が一直線なら星座認定
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const grp = getConnectedGroup(i0, player);
                if (grp.length >= 4 && !grp.some(i => st.marked[i])) {
                    const xs = grp.map(i => i % BOARD_SIZE), ys = grp.map(i => (i / BOARD_SIZE) | 0);
                    const allX = xs.every(v => v === xs[0]);
                    const allY = ys.every(v => v === ys[0]);
                    const diag1 = grp.every(i => (i % BOARD_SIZE) - ((i / BOARD_SIZE) | 0) === xs[0] - ys[0]);
                    const diag2 = grp.every(i => (i % BOARD_SIZE) + ((i / BOARD_SIZE) | 0) === xs[0] + ys[0]);
                    if (allX || allY || diag1 || diag2) {
                        grp.forEach(i => { st.marked[i] = 1; });
                        st.starPts[player] += 4;
                        fxText(i0, '星座認定+4', '#fde047', 1300);
                        fxGlow(i0, '#facc15', 900);
                    }
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 星座ボーナスを加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const stB = st.starPts[1], stW = st.starPts[2];
            const blackTotal = territory.black + captures[1] + stB;
            const whiteTotal = territory.white + captures[2] + stW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の星座:</span> <strong>\${stB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の星座:</span> <strong>\${stW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 星座の線と瞬き
        ...K.STONE_MARKS_SPEC(`            {
                const now = fxNow();
                ctx.save();
                // 星座認定済みの連を線で結ぶ
                [1, 2].forEach(p => {
                    const seen = new Set();
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== p || !st.marked[i] || seen.has(i)) continue;
                        const grp = getConnectedGroup(i, p);
                        grp.forEach(g => seen.add(g));
                        if (grp.length < 4) continue;
                        const sorted = grp.slice().sort((a, b) => a - b);
                        ctx.strokeStyle = 'rgba(253,224,71,0.65)';
                        ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                        ctx.beginPath();
                        sorted.forEach((g, k) => {
                            const cx = padding + (g % BOARD_SIZE) * cellSize, cy = padding + ((g / BOARD_SIZE) | 0) * cellSize;
                            if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
                        });
                        ctx.stroke();
                    }
                });
                // すべての石に星の瞬き
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const tw = 0.4 + 0.4 * Math.sin(now / 350 + i * 2.1);
                    ctx.fillStyle = 'rgba(253,224,71,' + tw + ')';
                    ctx.beginPath();
                    const r = cellSize * 0.10;
                    ctx.moveTo(cx, cy - r * 1.6);
                    ctx.lineTo(cx + r * 0.5, cy - r * 0.5); ctx.lineTo(cx + r * 1.6, cy);
                    ctx.lineTo(cx + r * 0.5, cy + r * 0.5); ctx.lineTo(cx, cy + r * 1.6);
                    ctx.lineTo(cx - r * 0.5, cy + r * 0.5); ctx.lineTo(cx - r * 1.6, cy);
                    ctx.lineTo(cx - r * 0.5, cy - r * 0.5);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'星座 黒' + st.starPts[1] + ' / 白' + st.starPts[2]`),
        [K.ONE, K.INFO_ALGO, `            星座碁: 4つ以上の連が縦・横・斜めの一直線に並ぶと星座認定+4<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方の連 (4石以上) が縦・横・斜め45度の一直線に並ぶと「星座」となり+4目 (1連1回)。',
            '線上の並びを作ると得点だが、一直線は伸ばしすぎると敵に分断されやすい。',
            '星座を描きながら普通の碁も戦う — 美しさと実利の両立。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.starPts = { 1: 0, 2: 0 }; st.marked = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // (0,0)-(3,0) の横一直線4連
        board[0] = 1; board[1] = 1; board[2] = 1;
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        assert('一直線4連で星座+4', st.starPts[1] === 4);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('同じ連で再認定しない', st.starPts[1] === 4);
        assert('白は未認定', st.starPts[2] === 0);
    `,
};
