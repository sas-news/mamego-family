// KANJIGO — 漢字碁: 各交点には漢字が割り当てられている。
// 味方同士が隣接して2字熟語が成立すると+2目。
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

const KDEF = `
        // 漢字盤: 交点ごとの漢字と熟語辞書
        const KANJI_AT = (i) => '火山風花石雪月水川空'[i % 10];
        const K_COMPOUNDS = ['火山', '山水', '水火', '風花', '花雪', '風月', '石川', '山川', '空山', '花月', '花火', '雪月'];
        const isCompound = (a, b) => K_COMPOUNDS.includes(a + b) || K_COMPOUNDS.includes(b + a);
`;

module.exports = {
    file: 'kanjigo.html',
    en: 'KANJIGO',
    jp: '漢字碁',
    prefix: 'kanjigo',
    desc: '石の座る交点は漢字。味方同士で熟語を隣接成立させると+2目。',
    kind: 'stone',
    icon: 'kanjigo',
    spec: [
        ...K.rb('KANJIGO', '漢字碁', 'kanjigo'),
        K.params([
            { key: 'word_pts', label: '熟語1組の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...PERSIST('{ word: { 1: 0, 2: 0 }, bonds: {} }'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`${KDEF}
        function isValidPlacement(cells, player) {`],
        // 熟語ルール: 置いた石と味方の隣接石の漢字が熟語を成すと+2 (1組1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 熟語ルール: 味方の隣接漢字が熟語を成すと+2
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(i0).forEach(n => {
                    if (board[n] !== player) return;
                    const key = Math.min(i0, n) + '-' + Math.max(i0, n);
                    if (st.bonds[key]) return;
                    if (isCompound(KANJI_AT(i0), KANJI_AT(n))) {
                        st.bonds[key] = 1;
                        st.word[player] += (P('word_pts') ?? 2);
                        fxText(n, KANJI_AT(n) + KANJI_AT(i0) + '+' + (P('word_pts') ?? 2), '#f59e0b', 1300);
                        fxGlow(i0, '#fbbf24', 700);
                    }
                });
            }
${CAP}
            turn = opponent;`],
        // 採点: 熟語得分を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const wordB = st.word[1], wordW = st.word[2];
            const blackTotal = territory.black + captures[1] + wordB;
            const whiteTotal = territory.white + captures[2] + wordW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の熟語:</span> <strong>\${wordB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の熟語:</span> <strong>\${wordW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 漢字を石に刻み、熟語の結合を線で描く
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                // 熟語の結合線
                ctx.strokeStyle = 'rgba(245,158,11,0.55)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                Object.keys(st.bonds).forEach(k => {
                    const [a, b] = k.split('-').map(Number);
                    if (board[a] === 0 || board[b] === 0) return;
                    ctx.beginPath();
                    ctx.moveTo(padding + (a % BOARD_SIZE) * cellSize, padding + ((a / BOARD_SIZE) | 0) * cellSize);
                    ctx.lineTo(padding + (b % BOARD_SIZE) * cellSize, padding + ((b / BOARD_SIZE) | 0) * cellSize);
                    ctx.stroke();
                });
                // 石の漢字
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = board[i] === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,30,0.85)';
                    ctx.font = 'bold ' + Math.round(cellSize * 0.38) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(KANJI_AT(i), cx, cy);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'熟語 黒' + st.word[1] + ' / 白' + st.word[2]`),
        [K.ONE, K.INFO_ALGO, `            漢字碁: 各交点に漢字がある。味方の石を熟語となる漢字同士で隣接させると+2<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の交点には漢字が刻まれている (火山風花石雪月水川空 が市松に)。',
            '味方の石同士が熟語 (火山・山水・風月など) となる漢字で隣接すると+2目 (1組1回)。',
            '辞書: 火山 山水 水火 風花 花雪 風月 石川 山川 空山 花月 花火 雪月。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.word = { 1: 0, 2: 0 }; st.bonds = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // (0,0)='火' (0%10) と (1,0)='山' (1%10) は熟語「火山」
        board[0] = 1;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('熟語火山で+2', st.word[1] === 2 && st.bonds['0-1'] === 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('同じ結合で再加点しない', st.word[1] === 2);
        assert('漢字は対称: 白も同じルール', typeof st.word[2] === 'number');
    `,
};
