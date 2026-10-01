// MENKOGO — 面子碁: 石は面子。取った連は盤から除かず裏返って自分の色になる
const K = require('../gen_kit.js');
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
    file: 'menkogo.html',
    en: 'MENKOGO',
    jp: '面子碁',
    prefix: 'menkogo',
    desc: '石は面子。呼吸を失った敵の連は盤から除かず裏返って自分の色になる。',
    kind: 'stone',
    icon: 'menkogo',
    spec: [
        ...K.rb('MENKOGO', '面子碁', 'menkogo'),
        K.params([
            { key: 'menko_pts', label: '面返しの得点', min: 0, max: 4, def: 1, step: 0.5, hint: '裏返した面1つにつき何アゲハマ' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 履歴に裏返した面を記録 (描画用)
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                flipped: null,
                holdUsed
            });`],
        // 面子の裏返し: 取られた連は除かずに着手者の色に変わる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 面子: 呼吸を失った連は裏返って着手者の石になる (面を取った=得点)
                if (history.length > 0) history[history.length - 1].flipped = captured.slice();
                captured.forEach(idx => { board[idx] = player; });
                captures[player] += Math.round(captured.length * (P('menko_pts') ?? 1));
                captured.forEach(idx => {
                    pieces.forEach(pc => {
                        if (pc.player === opponent && pc.cells.some(p => p.y * BOARD_SIZE + p.x === idx)) pc.player = player;
                    });
                    fxGlow(idx, '#fbbf24', 700);
                    fxSplash(idx, '#fbbf24', 6);
                });
                fxText(captured[0], '面返し x' + captured.length, '#fbbf24', 1300);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 裏返った面の印: 金色の縁取り
        ...K.STONE_MARKS_SPEC(`            // 直前に裏返った面: 金色の縁
            {
                ctx.save();
                const last = history[history.length - 1];
                if (last && last.flipped && last.flipped.length) {
                    ctx.strokeStyle = 'rgba(251,191,36,0.75)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    last.flipped.forEach(i => {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.33, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            面子碁: 石は面子。呼吸を失った敵の連は除かず裏返って自分の色になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は面子。呼吸を失った敵の連は盤から除かず裏返り、着手者の石になる。',
            '裏返った面の数はアゲハマとして得点に入る (終局時も通常採点)。',
            '取った面は自分の勢力になる — 大きな連を返すと一気に形勢が変わる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(5, 5)] = 2; // 白の孤立面
        board[I(5, 4)] = 1; board[I(4, 5)] = 1; board[I(6, 5)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('面は裏返る', board[I(5, 5)] === 1);
        assert('面返しは得点', captures[1] === 1);
        assert('裏返った面は履歴に残る', history[history.length - 1].flipped.length === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
