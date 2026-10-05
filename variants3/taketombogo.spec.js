// TAKETOMBOGO — 竹蜻碁: 12手ごとに置いた石が竹とんぼのように回転して2つ先へ飛ぶ
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
const ST_INIT = `{ ply: 0 }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'taketombogo.html',
    en: 'TAKETOMBOGO',
    jp: '竹蜻碁',
    prefix: 'taketombogo',
    desc: '12手ごとに置いた石が竹とんぼのように回転して2つ先の空点へ飛ぶ。',
    kind: 'stone',
    icon: 'taketombogo',
    spec: [
        ...K.rb('TAKETOMBOGO', '竹蜻碁', 'taketombogo'),
        K.params([
            { key: 'fly_interval', label: '飛行の間隔', min: 4, max: 30, def: 12, unit: '手' },
            { key: 'fly_dist', label: '飛ぶ距離', min: 1, max: 4, def: 2, unit: 'マス' },
        ]),
        ...ST(ST_INIT),
        // 竹とんぼの飛行: 12手ごとに置いた石が2つ先の空点へ飛ぶ (方向は回転)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 竹とんぼ: 12手ごとに置いた石が回転方向へ2マス飛ぶ
            st.ply++;
            if (st.ply % (P('fly_interval') || 12) === 0) {
                const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const [dx, dy] = dirs[Math.floor((st.ply - (P('fly_interval') || 12)) / (P('fly_interval') || 12)) % 4];
                const c0 = move.cells[0];
                const fd = P('fly_dist') || 2;
                const tx = c0.x + dx * fd, ty = c0.y + dy * fd;
                const mx = c0.x + dx, my = c0.y + dy;
                const from = c0.y * BOARD_SIZE + c0.x;
                if (tx >= 0 && ty >= 0 && tx < BOARD_SIZE && ty < BOARD_SIZE
                    && board[my * BOARD_SIZE + mx] === 0 && board[ty * BOARD_SIZE + tx] === 0
                    && board[from] === player) {
                    // 空いていれば飛んで遠くの点を占める
                    board[ty * BOARD_SIZE + tx] = player;
                    board[from] = 0;
                    pieces.forEach(pc => pc.cells.forEach(p => {
                        if (p.x === c0.x && p.y === c0.y) { p.x = tx; p.y = ty; }
                    }));
                    fxSlide(from, ty * BOARD_SIZE + tx, 460);
                    fxText(ty * BOARD_SIZE + tx, 'ひゅん!', '#38bdf8', 1100);
                }
            }

            turn = opponent;`],
        // 飛行方向の予告: 中央に回転する矢印
        K.CUE_GRID(`            // 竹とんぼの風向き: 中央に次の飛行方向を示す小さな矢印
            {
                ctx.save();
                const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const [dx, dy] = dirs[Math.floor(st.ply / (P('fly_interval') || 12)) % 4];
                const cx = padding + (BOARD_SIZE - 1) / 2 * cellSize, cy = padding - cellSize * 0.9;
                ctx.strokeStyle = 'rgba(56,189,248,0.8)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(cx - dx * cellSize * 0.3, cy - dy * cellSize * 0.3);
                ctx.lineTo(cx + dx * cellSize * 0.3, cy + dy * cellSize * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + dx * cellSize * 0.3 - dy * cellSize * 0.12 - dx * cellSize * 0.12,
                           cy + dy * cellSize * 0.3 + dx * cellSize * 0.12 - dy * cellSize * 0.12);
                ctx.lineTo(cx + dx * cellSize * 0.3, cy + dy * cellSize * 0.3);
                ctx.lineTo(cx + dx * cellSize * 0.3 + dy * cellSize * 0.12 - dx * cellSize * 0.12,
                           cy + dy * cellSize * 0.3 - dx * cellSize * 0.12 - dy * cellSize * 0.12);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'飛行まで ' + ((P('fly_interval') || 12) - (st.ply % (P('fly_interval') || 12))) + '手'`),
        [K.ONE, K.INFO_BASE, `            竹蜻碁: 12手ごとに置いた石が回転方向へ2マス飛ぶ (空いていれば)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '12手ごとに、その手で置いた石が竹とんぼのように回転して2つ先の空点へ飛ぶ。',
            '飛行方向は北→東→南→西と回転し、盤上に予告の矢印が出る。途中か着地が塞がっていれば飛べない。',
            '飛ぶと遠くの点を一手で占める。双方同じタイミングで飛ぶ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.ply = 11;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 12手目 → 北へ2マス飛ぶ
        assert('竹とんぼが飛ぶ', board[I(6, 6)] === 0 && board[I(6, 4)] === 1);
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.ply = 11;
        board[I(6, 5)] = 2; // 途中が塞がっている
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('塞がっていれば飛べない', board[I(6, 6)] === 1 && board[I(6, 4)] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
