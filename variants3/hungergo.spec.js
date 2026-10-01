// HUNGERGO — 飢餓碁: 盤を這い回る「飢えたもの」が6手ごとに
// 最も近い石を1つ喰らう (アゲハマにならない)。
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
    file: 'hungergo.html',
    en: 'HUNGERGO',
    jp: '飢餓碁',
    prefix: 'hungergo',
    desc: '盤に飢えたものがいる。6手ごとに最寄りの石を喰らい、そこへ移る。',
    kind: 'stone',
    icon: 'hungergo',
    spec: [
        ...K.rb('HUNGERGO', '飢餓碁', 'hungergo'),
        K.params([
            { key: 'maw_interval', label: '捕食の間隔', min: 2, max: 18, def: 6, unit: '手' },
        ]),
        ...PERSIST('{ maw: -1 }'),
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st.maw = ((BOARD_SIZE / 2) | 0) * BOARD_SIZE + ((BOARD_SIZE / 2) | 0);`],
        // 飢餓ルール: 6手ごとに最も近い石を喰らい、そこへ移動する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 飢餓ルール: 6手ごとに最寄りの石を捕食
            if (st.maw >= 0 && history.length % Math.max(1, P('maw_interval') || 6) === 0) {
                const mx = st.maw % BOARD_SIZE, my = (st.maw / BOARD_SIZE) | 0;
                let best = -1, bestD = Infinity;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1 || board[i] === 2) {
                        const d = Math.abs(i % BOARD_SIZE - mx) + Math.abs(((i / BOARD_SIZE) | 0) - my);
                        if (d < bestD) { bestD = d; best = i; }
                    }
                }
                if (best >= 0) {
                    board[best] = 0;
                    fxSlide(st.maw, best);
                    st.maw = best;
                    fxText(best, '捕食!', '#dc2626', 1200);
                    fxBurst(best, '#7f1d1d', 10);
                    fxShake(4, 250);
                    cleanUpPieces();
                }
            }
${CAP}
            turn = opponent;`],
        // 飢えたものの描画: 暗い口
        ...K.STONE_MARKS_SPEC(`            {
                if (st.maw >= 0) {
                    const mx = st.maw % BOARD_SIZE, my = (st.maw / BOARD_SIZE) | 0;
                    const cx = padding + mx * cellSize, cy = padding + my * cellSize;
                    const now = fxNow();
                    const r = cellSize * (0.32 + 0.04 * Math.sin(now / 350));
                    ctx.save();
                    ctx.fillStyle = 'rgba(30,10,10,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(220,38,38,0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.stroke();
                    // 牙
                    ctx.fillStyle = '#e5e7eb';
                    for (let k = 0; k < 6; k++) {
                        const a = k * Math.PI / 3 + Math.PI / 6;
                        const tx = cx + Math.cos(a) * r * 0.85, ty = cy + Math.sin(a) * r * 0.85;
                        const bx = cx + Math.cos(a) * r * 0.55, by = cy + Math.sin(a) * r * 0.55;
                        ctx.beginPath();
                        ctx.moveTo(tx, ty);
                        ctx.lineTo(bx + Math.cos(a + 1.7) * cellSize * 0.05, by + Math.sin(a + 1.7) * cellSize * 0.05);
                        ctx.lineTo(bx + Math.cos(a - 1.7) * cellSize * 0.05, by + Math.sin(a - 1.7) * cellSize * 0.05);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'飢餓 ' + (st.maw >= 0 ? '次の捕食 ' + (Math.max(1, P('maw_interval') || 6) - history.length % Math.max(1, P('maw_interval') || 6)) + '手後' : '—')`),
        [K.ONE, K.INFO_ALGO, `            飢餓碁: 6手ごとに盤上の飢えたものが最寄りの石を喰らう (アゲハマにならない)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に「飢えたもの」がいる。6手ごとに最も近い石を1つ喰らい、その場所へ這い移る。',
            '喰われた石はアゲハマにならず、どちらの得点にもならない — 両者共通の脅威。',
            '石を撒いて遠ざけるか、敵陣へ誘導するか。距離の管理が勝敗を分ける。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.maw = 6 * BOARD_SIZE + 6; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[6 * BOARD_SIZE + 7] = 2; // 飢えたものの隣に獲物
        for (let k = 0; k < 5; k++) executeMove({ cells: [{ x: k, y: 0 }] }, 1 + (k % 2));
        assert('6手前はまだ喰われない', board[6 * BOARD_SIZE + 7] === 2);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2); // 6手目
        assert('最寄りの石が喰われた', board[6 * BOARD_SIZE + 7] === 0);
        assert('飢えたものが獲物の場所へ移った', st.maw === 6 * BOARD_SIZE + 7);
        assert('捕食はアゲハマにならない', captures[1] === 0 && captures[2] === 0);
    `,
};
