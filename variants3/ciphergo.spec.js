// CIPHERGO — 暗号碁: 盤上に書かれた暗号文。石を置くとその数字が解読され、
// 隠し得点になる。
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
            // 打ち切り: 交点数の一定割合を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'ciphergo.html',
    en: 'CIPHERGO',
    jp: '暗号碁',
    prefix: 'ciphergo',
    desc: '盤面は暗号文。石を置いた場所の数字が解読されて隠し得点になる。',
    kind: 'stone',
    icon: 'ciphergo',
    spec: [
        ...K.rb('CIPHERGO', '暗号碁', 'ciphergo'),
        K.params([
            { key: 'cipher_mult', label: '解読点の倍率', min: 1, max: 3, def: 1, unit: '倍' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 1.1 },
        ]),
        ...PERSIST('{ rev: { 1: 0, 2: 0 } }'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 暗号文: 交点ごとの秘匿数字 (0=意味なし, 1-2=解読点)
        const CIPHER_AT = (i) => [0, 1, 0, 2, 0, 0, 1, 0, 0, 2, 0, 1, 0][i % 13];
        function isValidPlacement(cells, player) {`],
        // 暗号ルール: 置いた場所の数字が自分の隠し得点になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 暗号ルール: 着手点の秘匿数字を解読して得点化
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const v = CIPHER_AT(i0) * (P('cipher_mult') || 1);
                if (v > 0) {
                    st.rev[player] += v;
                    fxText(i0, '解読+' + v, '#38bdf8', 1100);
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 解読得点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const cB = st.rev[1], cW = st.rev[2];
            const blackTotal = territory.black + captures[1] + cB;
            const whiteTotal = territory.white + captures[2] + cW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の解読:</span> <strong>\${cB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の解読:</span> <strong>\${cW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 暗号文の数字を全交点に薄く表示 (空点のみ)
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.font = 'bold ' + Math.round(cellSize * 0.30) + 'px monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                for (let i = 0; i < board.length; i++) {
                    const v = CIPHER_AT(i);
                    if (!v || board[i] !== 0) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(56,189,248,0.5)';
                    ctx.fillText(String(v), padding + x * cellSize, padding + y * cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'解読 黒' + st.rev[1] + ' / 白' + st.rev[2]`),
        [K.ONE, K.INFO_ALGO, `            暗号碁: 空点に書かれた数字は暗号文。そこに打つと解読され隠し得点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の空点には小さな数字 (1か2) の暗号文が書かれている。',
            '数字のある点に自分の石を置くと解読され、その数字が終局時の隠し得点になる。',
            '大きい数字を狙うか、地を取るか — 暗号の拾い合い。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.rev = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // idx1 → 数字1
        assert('数字1を解読+1', st.rev[1] === 1);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 2); // idx3 → 数字2
        assert('白も数字2を解読+2', st.rev[2] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // idx0 → 数字0
        assert('0の地点は得点なし', st.rev[1] === 1);
    `,
};
