// REQUIEMGO — 鎮魂碁: 彷徨う霊 (中立石) を四方から囲んで鎮めると回向点を得る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'requiemgo.html',
    en: 'REQUIEMGO',
    jp: '鎮魂碁',
    prefix: 'requiemgo',
    desc: '盤に彷徨う霊 (中立石) がいる。四方を自石で囲んで鎮めると回向点を得る。',
    kind: 'stone',
    icon: 'requiemgo',
    spec: [
        ...K.rb('REQUIEMGO', '鎮魂碁', 'requiemgo'),
        K.params([
            { key: 'merit', label: '回向点 (霊1体)', min: 0, max: 10, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 霊の状態 st.merit (両者の回向点)
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { merit: { 1: 0, 2: 0 } }; // 回向点`],
        // 霊を星の位置に配置 (中立障害 board=4)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { merit: { 1: 0, 2: 0 } };
            // 彷徨う霊を星の位置に配置 (中立石: 置けず呼吸も通らないが取られない)
            { const pts = getStarPoints(BOARD_SIZE).length ? getStarPoints(BOARD_SIZE)
                : [{x: 2, y: 2}, {x: 6, y: 2}, {x: 4, y: 4}, {x: 2, y: 6}, {x: 6, y: 6}];
              pts.forEach(pt => { board[pt.y * BOARD_SIZE + pt.x] = 4; }); }`],
        [K.ONE, K.SNAP_PUSH, K.SNAP_PUSH.replace('holdUsed', 'holdUsed,\n                st: { merit: { ...st.merit } }')],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.st) st = { merit: { ...snap.st.merit } };`],
        [K.ONE, K.SAVE_TAIL, K.SAVE_TAIL.replace('holdUsed,', 'holdUsed,\n                    st,')],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? { merit: { ...s.st.merit } } : { merit: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, K.ONLINE_SEND.replace('holdUsed,', 'holdUsed,\n                st,')],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? { merit: { ...data.st.merit } } : st;`],
        // 鎮魂: 霊の四方を自石で囲むと鎮まって消え、回向点+2
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鎮魂: 霊 (board=4) の四方を自石で囲んだら鎮める (回向点+2)
            {
                const spirits = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 4) spirits.push(i);
                spirits.forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const nbrs = [];
                    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE) nbrs.push(ny * BOARD_SIZE + nx);
                    });
                    if (nbrs.length > 0 && nbrs.every(n => board[n] === player)) {
                        board[i] = 0; // 霊は成仏して消える
                        st.merit[player] += (P('merit') ?? 2);
                        fxBurst(i, '#a5f3fc', 14, 1.4);
                        fxText(i, '回向', '#67e8f9', 1200);
                    }
                });
                if (st.merit[1] + st.merit[2] > 0) cleanUpPieces();
            }

            turn = opponent;`],
        // 回向点を採点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.merit[1];
            const whiteTotal = territory.white + captures[2] + komi + st.merit[2];`],
        // 霊を幽光の玉で描く
        K.CUE_GRID(`            // 霊: 中立障害セルを幽光の勾玉風に描く
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 4) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const r = cellSize * 0.28;
                    const g = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy, r * 1.4);
                    g.addColorStop(0, 'rgba(186,230,253,0.95)');
                    g.addColorStop(0.6, 'rgba(103,232,249,0.5)');
                    g.addColorStop(1, 'rgba(103,232,249,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(224,242,254,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'回向点: 黒' + st.merit[1] + ' / 白' + st.merit[2]`),
        [K.ONE, K.INFO_BASE, `            鎮魂碁: 彷徨う霊 (中立石) の四方を自石で囲んで鎮めると回向点を得る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の星に彷徨う霊 (中立石) がいる。霊は置けない障害で取りもしない。',
            '霊の四方を全て自石で囲めば鎮魂 — 霊は消えて回向点+2が採点に加算される。',
            '霊が多い中央付近を制するほど回向点は稼げる。両者同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const sp = getStarPoints(BOARD_SIZE)[0];
        const si = sp.y * BOARD_SIZE + sp.x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.merit = { 1: 0, 2: 0 };
        board[si] = 4;
        // 三方では未鎮魂
        [[0, -1], [0, 1], [-1, 0]].forEach(([dx, dy]) => { board[si + dy * BOARD_SIZE + dx] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('三方では未鎮魂', board[si] === 4 && st.merit[1] === 0);
        // 四方を囲むと鎮魂
        board[si + 1] = 1;
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('四方で鎮魂して消える', board[si] === 0);
        assert('回向点+2', st.merit[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
