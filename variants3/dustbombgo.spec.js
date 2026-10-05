// DUSTBOMBGO — 粉塵碁: 着手の周囲の空点に粉塵が溜まる。粉塵3の空点は火花で爆発し3x3の敵石を吹き飛ばす (連鎖あり)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
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
const ST_INIT = `{ dust: [] }`;
module.exports = {
    file: 'dustbombgo.html',
    en: 'DUSTBOMBGO',
    jp: '粉塵碁',
    prefix: 'dustbombgo',
    desc: '着手の隣の空点に粉塵が堆積。粉塵3の空点は爆発し3x3の敵石を吹き飛ばす (連鎖あり・自石は無事)。',
    kind: 'stone',
    icon: 'dustbombgo',
    spec: [
        ...K.rb('DUSTBOMBGO', '粉塵碁', 'dustbombgo'),
        K.params([
            { key: 'dust_max', label: '爆発する粉塵量', min: 2, max: 6, def: 3, unit: '個' },
            { key: 'chain_max', label: '連鎖の上限', min: 5, max: 60, def: 30, unit: '箇所' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...ST(ST_INIT),

        // 粉塵: 着手の隣の空点に堆積、3溜まると爆発 (3x3・連鎖)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 粉塵碁: 着手の隣の空点に粉塵+1。3溜まった空点は爆発して3x3を消す (連鎖あり)
            {
                if (!Array.isArray(st.dust) || st.dust.length !== board.length) st.dust = Array(board.length).fill(0);
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(pi).forEach(n => { if (board[n] === 0) st.dust[n]++; });
                let boom = 0;
                const queue = [];
                const dm = P('dust_max') || 3;
                for (let i = 0; i < st.dust.length; i++) if (st.dust[i] >= dm && board[i] === 0) queue.push(i);
                const seen = new Set(queue);
                while (queue.length && boom < (P('chain_max') || 30)) {
                    const c = queue.shift();
                    const cx = c % BOARD_SIZE, cy = Math.floor(c / BOARD_SIZE);
                    const extra = [];
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = cx + dx, ny = cy + dy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                            const i0 = ny * BOARD_SIZE + nx;
                            if (st.dust[i0] >= dm && board[i0] === 0 && !seen.has(i0)) { seen.add(i0); extra.push(i0); }
                            if (board[i0] === opponent) { captures[player]++; board[i0] = 0; }
                            st.dust[i0] = 0;
                        }
                    }
                    boom++;
                    fxBurst(c, '#f97316', 12, 1.9);
                    fxGlow(c, '#fbbf24', 600);
                    extra.forEach(e => queue.push(e));
                }
                if (boom) {
                    fxShake(7, 350);
                    fxText(pi, '粉塵爆発!', '#fb923c', 1300);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 溜まった粉塵の描画
        K.CUE_STARS(`            // 粉塵の堆積: 空点の黄褐色の靄
            {
                if (Array.isArray(st.dust)) {
                    ctx.save();
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== 0 || !st.dust[i]) continue;
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.fillStyle = 'rgba(202,138,4,' + (0.08 + st.dust[i] * 0.09) + ')';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * (0.16 + st.dust[i] * 0.07), 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            粉塵碁: 着手の隣の空点に粉塵が溜まる。粉塵3の空点は爆発して3x3の敵石を吹き飛ばす (連鎖あり)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手した石の上下左右の空点に粉塵が1溜まる。粉塵が3溜まった空点は即座に爆発し、周囲3x3の敵石を消す。',
            '吹き飛ぶのは敵石だけ (アゲハマに)。爆発は隣の臨界空点へ最大30箇所まで連鎖する。',
            '密集地帯で指し続けると盤が火薬庫になる。撒き散らしと誘爆の読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.dust = Array(board.length).fill(0);
        st.dust[4 * BOARD_SIZE + 5] = 3; // 爆発寸前の空点
        board[4 * BOARD_SIZE + 4] = 2; // 巻き込まれる敵石
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('臨界粉塵が爆発する', st.dust[4 * BOARD_SIZE + 5] === 0);
        assert('巻き込まれた敵石はアゲハマ', captures[1] === 1 && board[4 * BOARD_SIZE + 4] === 0);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('着手の隣に粉塵が溜まる', st.dust[8 * BOARD_SIZE + 7] === 1 || st.dust[7 * BOARD_SIZE + 8] === 1);
    `,
};
