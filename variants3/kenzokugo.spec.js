// KENZOKUGO — 眷属碁: 敵陣帯に単独で打ち込んだ石は「眷属(使い魔)」となり、
// 自分の手番ごとに探索+1を稼ぐ。連結すると眷属ではなくなる。
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
    file: 'kenzokugo.html',
    en: 'KENZOKUGO',
    jp: '眷属碁',
    prefix: 'kenzokugo',
    desc: '敵陣帯に単独で打ち込んだ石は眷属(使い魔)になる。毎ターン探索+1。',
    kind: 'stone',
    icon: 'kenzokugo',
    spec: [
        ...K.rb('KENZOKUGO', '眷属碁', 'kenzokugo'),
        ...PERSIST('{ fam: {}, pts: { 1: 0, 2: 0 } }'),
        // 眷属ルール: 敵陣帯の単石が眷属化し毎ターン探索得点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 眷属ルール: 敵陣帯 (黒は上3段 / 白は下3段) の単石は使い魔
            {
                const EZ = Math.max(2, Math.floor(BOARD_SIZE / 4));
                const inEnemyZone = (i, p) => {
                    const y = (i / BOARD_SIZE) | 0;
                    return p === 1 ? y < EZ : y >= BOARD_SIZE - EZ;
                };
                // 死んだ眷属・連結した眷属は解除
                Object.keys(st.fam).forEach(k => {
                    const i = +k;
                    if (board[i] !== st.fam[i].p || getConnectedGroup(i, board[i]).length > 1) delete st.fam[k];
                });
                // 眷属の探索: 自分の手番ごとに+1
                Object.keys(st.fam).forEach(k => {
                    if (st.fam[k].p === player) {
                        st.pts[player]++;
                        fxText(+k, '眷属探索+1', '#fbbf24', 700);
                    }
                });
                // 新規眷属: 敵陣に打ち込んだ単石が使い魔になる
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[i0] === player && inEnemyZone(i0, player) && getConnectedGroup(i0, player).length === 1) {
                    st.fam[i0] = { p: player };
                    fxText(i0, '眷属!', '#fbbf24', 1000);
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 眷属の探索得点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const ezB = st.pts[1], ezW = st.pts[2];
            const blackTotal = territory.black + captures[1] + ezB;
            const whiteTotal = territory.white + captures[2] + ezW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の眷属:</span> <strong>\${ezB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の眷属:</span> <strong>\${ezW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 敵陣帯の色付けと眷属の目印
        ...K.STONE_MARKS_SPEC(`            {
                const EZ = Math.max(2, Math.floor(BOARD_SIZE / 4));
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let band = null;
                    if (y < EZ) band = 'rgba(96,165,250,0.07)';
                    else if (y >= BOARD_SIZE - EZ) band = 'rgba(248,113,113,0.07)';
                    if (band) {
                        ctx.fillStyle = band;
                        ctx.fillRect(padding - cellSize / 2, padding + y * cellSize - cellSize / 2, cellSize * (BOARD_SIZE - 1) + cellSize, cellSize);
                    }
                }
                Object.keys(st.fam).forEach(k => {
                    const i = +k;
                    if (board[i] !== st.fam[i].p) return;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    // 使い魔の目: 白目と瞳
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'眷属 黒' + Object.values(st.fam).filter(f => f.p === 1).length + ' / 白' + Object.values(st.fam).filter(f => f.p === 2).length`),
        [K.ONE, K.INFO_ALGO, `            眷属碁: 敵陣帯 (盤の端3列) に単独で打ち込んだ石は眷属になる。眷属は自分の手番ごとに探索+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '黒は上3段、白は下3段が「敵陣帯」。そこに単独で打ち込んだ石は眷属 (使い魔) になる。',
            '眷属は自分の手番のたびに+1目の探索得点。取られるか仲間と連結すると眷属でなくなる。',
            '単騎で敵陣に潜り込ませるか、迎撃に出るか — 潜入と迎撃の読み合い。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.fam = {}; st.pts = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 1 }] }, 1);
        assert('敵陣帯の単石は眷属', st.fam[1 * BOARD_SIZE + 5] && st.fam[1 * BOARD_SIZE + 5].p === 1);
        executeMove({ cells: [{ x: 5, y: 11 }] }, 2);
        assert('白の敵陣帯も眷属', st.fam[11 * BOARD_SIZE + 5] && st.fam[11 * BOARD_SIZE + 5].p === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('眷属が探索+1', st.pts[1] === 1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('白眷属も探索+1', st.pts[2] === 1);
        executeMove({ cells: [{ x: 6, y: 1 }] }, 1);
        assert('連結で眷属は消える', st.fam[1 * BOARD_SIZE + 5] === undefined);
    `,
};
