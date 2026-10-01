// KOINOBORIGO — 鯉幟碁: 3石以上の連(鯉)が着手ごとの風向きへ1マス泳ぐ
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ ply: 0 }`;
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
    file: 'koinoborigo.html',
    en: 'KOINOBORIGO',
    jp: '鯉幟碁',
    prefix: 'koinoborigo',
    desc: '3石以上の連は鯉。着手のたび風(北→東→南→西)へ1マス泳ぐ。',
    kind: 'stone',
    icon: 'koinoborigo',
    spec: [
        ...K.rb('KOINOBORIGO', '鯉幟碁', 'koinoborigo'),
        K.params([
            { key: 'koi_min', label: '泳ぐ鯉の最小連サイズ', min: 2, max: 8, def: 3, unit: '石' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 風呲み: 着手した側の連(3以上)が風下へ1マス泳ぐ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鯉の泳ぎ: 着手した側の連 (3石以上) が風向きへ1マス進む
            {
                st.ply++;
                const KOI_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const w = KOI_DIRS[st.ply % 4];
                const visited = new Set();
                const groups = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player || visited.has(i)) continue;
                    const g = []; const q = [i]; visited.add(i);
                    while (q.length) {
                        const c = q.pop(); g.push(c);
                        getNeighbors(c).forEach(n => {
                            if (board[n] === player && !visited.has(n)) { visited.add(n); q.push(n); }
                        });
                    }
                    groups.push(g);
                }
                groups.forEach(g => {
                    if (g.length < (P('koi_min') || 3)) return;
                    const inset = new Set(g);
                    const ok = g.every(i => {
                        const x = i % BOARD_SIZE + w[0], y = Math.floor(i / BOARD_SIZE) + w[1];
                        return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE &&
                            (board[y * BOARD_SIZE + x] === 0 || inset.has(y * BOARD_SIZE + x));
                    });
                    if (!ok) return;
                    // 泳いだ先で呼吸点0になるなら泳がない (自沈防止)
                    const destSet = new Set(g.map(i => {
                        const nx = i % BOARD_SIZE + w[0], ny = Math.floor(i / BOARD_SIZE) + w[1];
                        return ny * BOARD_SIZE + nx;
                    }));
                    const hasLib = [...destSet].some(d => getNeighbors(d).some(n =>
                        !destSet.has(n) && (inset.has(n) || board[n] === 0)));
                    if (!hasLib) return;
                    g.forEach(i => { board[i] = 0; });
                    g.forEach(i => {
                        const nx = i % BOARD_SIZE + w[0], ny = Math.floor(i / BOARD_SIZE) + w[1];
                        board[ny * BOARD_SIZE + nx] = player;
                        fxSlide(i, ny * BOARD_SIZE + nx, 380);
                    });
                });
                cleanUpPieces();
            }

            turn = opponent;`],
        // 風向きを右上に吹き流しで表示
        K.CUE_STARS(`            // 風向きの吹き流し (盤の右上)
            {
                const KOI_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const w = KOI_DIRS[st.ply % 4];
                const bx = padding + (BOARD_SIZE - 1) * cellSize, by = padding;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.85)';
                ctx.fillStyle = 'rgba(56,189,248,0.85)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                const s = cellSize * 0.22;
                ctx.beginPath();
                ctx.moveTo(bx - w[0] * s, by - w[1] * s);
                ctx.lineTo(bx + w[0] * s, by + w[1] * s);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(bx + w[0] * s * 1.4, by + w[1] * s * 1.4, cellSize * 0.07, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'風: ' + ['北','東','南','西'][st.ply % 4]`),
        [K.ONE, K.INFO_ALGO, `            鯉幟碁: 3石以上の連は泳ぐ鯉。着手のたび風向き(北→東→南→西の順)へ1マス進む<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の3石以上の連は「鯉のぼり」。自分の着手のたび、盤を吹く風の向きへ1マス泳ぐ。',
            '風は全手数を数えて北→東→南→西の順に巡る (両者共通)。進路が盤外や他の石で塞がっている連は泳げない。',
            '泳いだ連は形を保つ。2石以下の連は泳がない。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.ply = 0;
        board[4 * B + 4] = 1; board[4 * B + 5] = 1; board[4 * B + 6] = 1; // 横3連の鯉
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // ply=1 → 風=東(+x)
        assert('鯉が東へ泳ぐ', board[4 * B + 5] === 1 && board[4 * B + 6] === 1 && board[4 * B + 7] === 1);
        assert('元の尾は抜ける', board[4 * B + 4] === 0);
        st.ply = 4; // 次の着手もply=5 → 風=東
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('さらに東へ', board[4 * B + 8] === 1);
        st.ply = 9; // 次の着手はply=10 → 風=南(+y)
        board[5 * B + 7] = 2; // 進路に敵石を置いて塞ぐ → 泳げない
        executeMove({ cells: [{ x: 0, y: 2 }] }, 1);
        assert('進路が塞がると泳げない', board[4 * B + 6] === 1 && board[4 * B + 7] === 1 && board[4 * B + 8] === 1);
    `,
};
