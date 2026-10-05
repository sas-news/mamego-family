// GLAZEGO — 釉薬碁: 着いた石は釉薬が生乾き。12手ごとの窯焚きで色が確定する。生乾きの石は取られると2個分
const K = require('../gen_kit.js');
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
const ST_INIT = `{ raw: [] }`; // 釉薬が生乾きの石 (窯で確定するまで)
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'glazego.html',
    en: 'GLAZEGO',
    jp: '釉薬碁',
    prefix: 'glazego',
    desc: '釉薬の石は生乾きのうち取られると2個分。12手ごとの窯で色が確定する。',
    kind: 'stone',
    icon: 'glazego',
    spec: [
        ...K.rb('GLAZEGO', '釉薬碁', 'glazego'),
        K.params([
            { key: 'kiln_interval', label: '窯入りの周期', min: 3, max: 48, def: 12, unit: '手' },
            { key: 'raw_mult', label: '生乾き石の取り倍率', min: 1, max: 5, def: 2, unit: '倍' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        ...ST(ST_INIT),
        // 着手した石は生乾き
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => st.raw.push(p.y * BOARD_SIZE + p.x));`],
        // 生乾きの石は2個分のアゲハマになる
        [K.ONE, `                captures[player] += captured.length;`,
`                captures[player] += captured.reduce((s, i) => s + (st.raw.includes(i) ? (P('raw_mult') || 2) : 1), 0);`],
        // 12手ごとの窯焚き: 生乾きの石が確定 (素地→釉薬)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 釉薬碁: 12手ごとに窯が焚かれ、生乾きの石の色が確定する
            if (history.length > 0 && history.length % Math.max(1, P('kiln_interval') || 12) === 0 && st.raw.length) {
                st.raw.forEach(i => {
                    if (board[i] === 1 || board[i] === 2) fxGlow(i, '#fb923c', 700);
                });
                st.raw = [];
                const kc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(kc, '窯焚き!', '#fb923c', 1200);
            }

            turn = opponent;`],
        // 生乾きの石には露の輝き
        ...K.STONE_MARKS_SPEC(`            // 生乾きの石: 湿った露のハイライト
            (st.raw || []).forEach(i => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(160, 220, 255, 0.75)';
                ctx.beginPath();
                ctx.arc(cx - cellSize * 0.13, cy - cellSize * 0.13, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(190, 235, 255, 0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.32, -0.4, 1.6);
                ctx.stroke();
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`st.raw.length ? '生乾き ' + st.raw.length + '個 (窯まで ' + ((P('kiln_interval') || 12) - history.length % (P('kiln_interval') || 12)) + '手)' : '窯まで ' + ((P('kiln_interval') || 12) - history.length % (P('kiln_interval') || 12)) + '手'`),
        [K.ONE, K.INFO_BASE, `            釉薬碁: 生乾きの石は取られると2個分。12手ごとの窯で確定<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着いたばかりの石は釉薬が生乾き (濡れ印が付く)。',
            '生乾きの石が取られると2個分のアゲハマになる — 生乾きの間は守りたい。',
            '12手ごとに窯が焚かれ、全ての生乾きの石の色が確定する (両者同じ窯)。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        st.raw = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('着いた石は生乾き', st.raw.includes(I(0, 0)));
        // 生乾きの石が取られると2個分
        board.fill(0); st.raw = [I(1, 1)]; captures = { 1: 0, 2: 0 };
        board[I(1, 1)] = 2;
        board[I(0, 1)] = 1; board[I(2, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        history.length = 0;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1);
        // (1,1)の白石は既に呼吸0 → 直前の着手で取られて2個分
        assert('生乾きは2個分のアゲハマ', captures[1] >= 2);
        // 窯で確定する
        board.fill(0); st.raw = [I(3, 3)]; history.length = 0;
        for (let k = 0; k < 12; k++) executeMove({ cells: [{ x: k % BOARD_SIZE, y: BOARD_SIZE - 1 }] }, 1);
        assert('窯焚きで確定', st.raw.length === 0);
    `,
};
