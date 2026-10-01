// NUCLEATIONGO — 結晶碁: 孤立した着手は「結晶核」。自分の手番ごとに核から結晶が育って領地になる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'nucleationgo.html',
    en: 'NUCLEATIONGO',
    jp: '結晶碁',
    prefix: 'nucleationgo',
    desc: '孤立して置いた石は結晶核。自分の手番ごとに核の隣へ結晶が1つ育つ (各核2個まで)。',
    kind: 'stone',
    icon: 'nucleationgo',
    spec: [
        ...K.rb('NUCLEATIONGO', '結晶碁', 'nucleationgo'),
        K.params([
            { key: 'spr_max', label: '1核が育てる結晶の上限', min: 1, max: 5, def: 2, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST('{ nuc: {} }'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 結晶碁: 核は自分の手番ごとに隣の空点へ結晶を1つ育てる (各核2個まで)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                for (const k in st.nuc) {
                    const ni = +k, nc = st.nuc[k];
                    if (board[ni] !== player || nc.spr >= (P('spr_max') || 2)) continue;
                    for (const cand of getNeighbors(ni)) {
                        if (board[cand] !== 0) continue;
                        if (!isValidPlacement([{ x: cand % BOARD_SIZE, y: (cand / BOARD_SIZE) | 0 }], player)) continue;
                        board[cand] = player;
                        // 結晶が敵連の最後の呼吸を埋める場合は育たない (通常の取り手順を経ないため)
                        const safe = getNeighbors(cand).every(n =>
                            board[n] !== opponent || getLiberties(board, n).length > 0);
                        if (safe) {
                            pieces.push({ id: Date.now() + Math.random(), player, type: 'STONE', rot: 0, cells: [{ x: cand % BOARD_SIZE, y: (cand / BOARD_SIZE) | 0 }] });
                            nc.spr++;
                            fxGlow(cand, '#7dd3fc', 900);
                            fxText(cand, '結晶', '#38bdf8', 900);
                            break;
                        }
                        board[cand] = 0;
                    }
                }
                // 孤立した着手は新しい結晶核になる (成長は次の手番から)
                if (getNeighbors(mi).every(n => board[n] !== player)) {
                    st.nuc[mi] = { spr: 0 };
                    fxText(mi, '核', '#7dd3fc', 900);
                }
                for (const k in st.nuc) if (board[k] === 0 || board[k] === 3) delete st.nuc[k];
            }

            turn = opponent;`],
        // 核は水色の多角形、育った結晶は小さな結晶片
        ...K.STONE_MARKS_SPEC(`            // 結晶核: 水色の六角形の輪郭
            {
                ctx.save();
                for (const k in st.nuc) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(56,189,248,0.9)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    ctx.beginPath();
                    for (let a = 0; a < 6; a++) {
                        const t = a / 6 * Math.PI * 2 - Math.PI / 2;
                        const vx = cx + Math.cos(t) * cellSize * 0.32, vy = cy + Math.sin(t) * cellSize * 0.32;
                        a ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC('Object.keys(st.nuc).filter(k => board[+k] === turn).length + " 核"'),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            結晶碁: 孤立して置いた石は結晶核。自分の手番ごとに核の隣へ結晶が1つ育つ (各核2個)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '味方と隣接しない場所に置いた石は「結晶核」になる。',
            '自分の手番が来るたび、核の隣の空点に結晶 (自分の石) が1つ育つ。各核2個まで。',
            '核を取れば成長は止まる。育つ前に摘み取るか囲むか。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.nuc = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 孤立 → 核
        assert('孤立石は核になる', st.nuc[I(4, 4)] !== undefined);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        const before = board.filter(v => v === 1).length;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒の手番で核が結晶を育てる
        assert('結晶が育つ', board.filter(v => v === 1).length === before + 2);
        assert('結晶は核の隣', getNeighbors(I(4, 4)).some(n => board[n] === 1));
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
