// GRAFFITIGO — 落書碁: 盤に散らばる落書きの隣に置くと消えて+1目。消し合いの清掃合戦
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
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
const ST_INIT = `{ cleaned: {} }`;
module.exports = {
    file: 'graffitigo.html',
    en: 'GRAFFITIGO',
    jp: '落書碁',
    prefix: 'graffitigo',
    desc: '盤の落書き点の隣に自石を置くと落書きが消えて+1目 (各1回・両者共通)。',
    kind: 'stone',
    icon: 'graffitigo',
    spec: [
        ...K.rb('GRAFFITIGO', '落書碁', 'graffitigo'),
        K.params([
            { key: 'clean_bonus', label: '消去ボーナス', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        // 落書きが散らばる点 (固定)
const GRAFFITI = [
    [1, 4], [3, 1], [5, 8], [7, 2], [9, 6], [11, 3], [2, 9], [6, 11], [10, 9], [8, 5],
].map(([x, y]) => Math.min(y, BOARD_SIZE - 1) * BOARD_SIZE + Math.min(x, BOARD_SIZE - 1));

        function executeMove(move, player) {`],

        // 落書きの描画
        K.CUE_STARS(`            // 落書き: 消えていない点にクレヨンの落書き
            {
                ctx.save();
                const cols = ['rgba(220,60,60,0.55)', 'rgba(60,120,220,0.55)', 'rgba(60,170,90,0.55)', 'rgba(200,140,40,0.55)'];
                GRAFFITI.forEach((i, k) => {
                    if (st.cleaned[i] || board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = cols[k % cols.length];
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.25, cy - cellSize * 0.15);
                    ctx.lineTo(cx + cellSize * 0.22, cy + cellSize * 0.1);
                    ctx.moveTo(cx - cellSize * 0.1, cy + cellSize * 0.22);
                    ctx.lineTo(cx + cellSize * 0.15, cy - cellSize * 0.24);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 清掃: 着手の隣の落書きを消して+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 落書碁: 着手点の隣の落書きを消去して+1目ずつ
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let wiped = 0;
                getNeighbors(pi).forEach(n => {
                    if (!st.cleaned[n] && GRAFFITI.includes(n)) {
                        st.cleaned[n] = 1;
                        captures[player] += (P('clean_bonus') || 1);
                        wiped++;
                        fxText(n, '消去 +' + (P('clean_bonus') || 1), '#60a5fa', 1000);
                    }
                });
                if (GRAFFITI.includes(pi) && !st.cleaned[pi]) {
                    st.cleaned[pi] = 1;
                    captures[player] += (P('clean_bonus') || 1);
                    wiped++;
                    fxText(pi, '消去 +' + (P('clean_bonus') || 1), '#60a5fa', 1000);
                }
                if (wiped) fxSplash(pi, '#60a5fa', 8);
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'落書き残り ' + (GRAFFITI.filter(i => !st.cleaned[i]).length)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            落書碁: 盤に散らばる落書き点の隣 (または直上) に自石を置くと消えて+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤には10箇所の落書き。落書き点の隣 (または真上) に自分の石を置くと消えて+1目。',
            '落書きは両者共通 — 先に消した側が点を得る清掃合戦。',
            '消すために打つ手が形を崩すことも。綺麗な盤と綺麗な碁は別物。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cleaned = {};
        const g0 = GRAFFITI[0];
        const gx = g0 % BOARD_SIZE, gy = Math.floor(g0 / BOARD_SIZE);
        executeMove({ cells: [{ x: gx, y: gy }] }, 1); // 直上に置く
        assert('直上で消去+1', captures[1] === 1 && st.cleaned[g0] === 1);
        const g1 = GRAFFITI[1];
        const nx = g1 % BOARD_SIZE + 1; // 右隣
        executeMove({ cells: [{ x: nx, y: Math.floor(g1 / BOARD_SIZE) }] }, 2);
        assert('隣接でも消去+1', captures[2] === 1 && st.cleaned[g1] === 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('消去済みは再加点なし', captures[1] === 1);
    `,
};
