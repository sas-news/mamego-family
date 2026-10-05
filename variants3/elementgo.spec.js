// ELEMENTGO — 周期碁: 各交点は元素。味方同士が結合対で隣接すると+2、
// 激反応対 (Na-O, Na-H) で隣接すると両者消失する。
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
    file: 'elementgo.html',
    en: 'ELEMENTGO',
    jp: '周期碁',
    prefix: 'elementgo',
    desc: '交点は元素記号。結合対で+2、激反応対は両者消失する。',
    kind: 'stone',
    icon: 'elementgo',
    spec: [
        ...K.rb('ELEMENTGO', '周期碁', 'elementgo'),
        K.params([
            { key: 'bond_pts', label: '結合ボーナス', min: 0, max: 8, def: 2, unit: '点' },
            { key: 'element_count', label: '元素の種類数', options: [{ v: 4, l: '4元素' }, { v: 6, l: '6元素' }, { v: 8, l: '8元素' }], def: 8 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 4, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...PERSIST('{ bondPts: { 1: 0, 2: 0 }, bonds: {} }'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 周期表盤: 交点ごとの元素と反応表
        const EL_AT = (i) => ['H', 'O', 'C', 'N', 'Na', 'Cl', 'S', 'Fe'][i % (P('element_count') || 8)];
        const BOND_PAIRS = ['H-O', 'C-O', 'N-H', 'Na-Cl', 'S-O', 'Fe-O'];
        const REACT_PAIRS = ['Na-O', 'Na-H'];
        const pairOf = (a, b) => [a + '-' + b, b + '-' + a];
        const isBond = (a, b) => { const [f, r] = pairOf(a, b); return BOND_PAIRS.includes(f) || BOND_PAIRS.includes(r); };
        const isReact = (a, b) => { const [f, r] = pairOf(a, b); return REACT_PAIRS.includes(f) || REACT_PAIRS.includes(r); };
        function isValidPlacement(cells, player) {`],
        // 元素ルール: 結合で+2、激反応で両者消失
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 元素ルール: 結合と激反応
            {
                const i0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                // 激反応: 色に関わらず Na-O / Na-H 隣接は両者消失 (アゲハマ無し)
                let reacted = false;
                getNeighbors(i0).forEach(n => {
                    if ((board[n] === 1 || board[n] === 2) && isReact(EL_AT(i0), EL_AT(n))) {
                        board[n] = 0; board[i0] = 0;
                        reacted = true;
                        fxText(n, '激反応!', '#f97316', 1300);
                        fxBurst(i0, '#fb923c', 12);
                        fxShake(5, 300);
                    }
                });
                if (reacted) cleanUpPieces();
                // 結合: 味方同士の結合対で+2 (1組1回)
                if (board[i0] === player) {
                    getNeighbors(i0).forEach(n => {
                        if (board[n] !== player) return;
                        const key = Math.min(i0, n) + '-' + Math.max(i0, n);
                        if (st.bonds[key]) return;
                        if (isBond(EL_AT(i0), EL_AT(n))) {
                            st.bonds[key] = 1;
                            st.bondPts[player] += (P('bond_pts') || 2);
                            fxText(n, EL_AT(n) + '−' + EL_AT(i0) + ' +' + (P('bond_pts') || 2), '#22d3ee', 1200);
                        }
                    });
                }
            }
${CAP}
            turn = opponent;`],
        // 採点: 結合得分を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const elB = st.bondPts[1], elW = st.bondPts[2];
            const blackTotal = territory.black + captures[1] + elB;
            const whiteTotal = territory.white + captures[2] + elW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の結合:</span> <strong>\${elB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の結合:</span> <strong>\${elW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 元素記号と結合線の描画
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.strokeStyle = 'rgba(34,211,238,0.5)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                Object.keys(st.bonds).forEach(k => {
                    const [a, b] = k.split('-').map(Number);
                    if (board[a] === 0 || board[b] === 0) return;
                    ctx.beginPath();
                    ctx.moveTo(padding + (a % BOARD_SIZE) * cellSize, padding + ((a / BOARD_SIZE) | 0) * cellSize);
                    ctx.lineTo(padding + (b % BOARD_SIZE) * cellSize, padding + ((b / BOARD_SIZE) | 0) * cellSize);
                    ctx.stroke();
                });
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.30) + 'px sans-serif';
                for (let i = 0; i < board.length; i++) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    if (board[i] === 1 || board[i] === 2) {
                        ctx.fillStyle = board[i] === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,30,0.85)';
                        ctx.fillText(EL_AT(i), cx, cy);
                    } else {
                        ctx.fillStyle = 'rgba(100,116,139,0.35)';
                        ctx.fillText(EL_AT(i), cx, cy);
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'結合 黒' + st.bondPts[1] + ' / 白' + st.bondPts[2]`),
        [K.ONE, K.INFO_BASE, `            周期碁: 交点は元素 (H O C N Na Cl S Fe)。結合対で+2、Na-O/Na-H 隣接は激反応で両者消失<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の交点には元素記号 (H O C N Na Cl S Fe) が市松に割り振られている。',
            '味方の石同士を結合対 (H-O, C-O, N-H, Na-Cl, S-O, Fe-O) で隣接させると+2目。',
            'Na と O/H の隣接は激反応: 敵味方関係なく両石が消失する (アゲハマ無し)。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.bondPts = { 1: 0, 2: 0 }; st.bonds = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // (0,0)=H, (1,0)=O → H-O結合
        board[0] = 1;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('H-O結合で+2', st.bondPts[1] === 2);
        // 激反応: (4,0)=Na, (4,1)=idx(13+4)=17 → 17%8=1 → O
        board.fill(0);
        board[BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('Na-O隣接で激反応・両者消失', board[4] === 0 && board[BOARD_SIZE + 4] === 0);
        assert('激反応はアゲハマにならない', captures[1] === 0 && captures[2] === 0);
    `,
};
