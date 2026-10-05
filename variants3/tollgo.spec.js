// TOLLGO — 弔鐘碁: 石が取られるたびに弔鐘が鳴り、全ての石が震源地から1歩ずつ外へ押される
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= (P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tollgo.html',
    en: 'TOLLGO',
    jp: '弔鐘碁',
    prefix: 'tollgo',
    desc: '石が取られるたびに弔鐘が鳴り、全ての石が震源地から1歩ずつ外へ押される。',
    kind: 'stone',
    icon: 'tollgo',
    spec: [
        ...K.rb('TOLLGO', '弔鐘碁', 'tollgo'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 50, max: 500, def: 150, unit: '手' },
        ]),
        // 弔鐘: 取られた地点からの衝撃波で全石が外へ1歩押される
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let ex = 0, ey = 0;
                captured.forEach(idx => {
                    board[idx] = 0;
                    ex += idx % BOARD_SIZE;
                    ey += Math.floor(idx / BOARD_SIZE);
                });
                ex /= captured.length; ey /= captured.length;
                captures[player] += captured.length;
                soundManager.playCapture();

                // 弔鐘の余震: 全石が震源地から外方向へ1歩押される
                {
                    const pushes = {}; // 行き先 -> 出発点 (-1: 衝突で動けない)
                    board.forEach((v, i) => {
                        if (v !== 1 && v !== 2) return;
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        const dx = x - ex, dy = y - ey;
                        if (dx === 0 && dy === 0) return;
                        let nx = x, ny = y;
                        if (Math.abs(dx) >= Math.abs(dy)) nx = x + Math.sign(dx);
                        else ny = y + Math.sign(dy);
                        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] !== 0) return; // 押し先が塞がっている
                        if (pushes[ni] !== undefined) { pushes[ni] = -1; return; } // 同じ行き先に2石 → 両方停止
                        pushes[ni] = i;
                    });
                    let moved = 0;
                    Object.keys(pushes).forEach(k => {
                        const src = pushes[k];
                        if (src === -1) return;
                        const dst = +k;
                        board[dst] = board[src];
                        board[src] = 0;
                        moved++;
                        fxSlide(src, dst, 330);
                    });
                    if (moved) {
                        fxShake(7, 520);
                        fxText(Math.round(ey) * BOARD_SIZE + Math.round(ex), '弔鐘!', '#fbbf24', 1300);
                    }
                    cleanUpPieces();
                }
            } else {
                soundManager.playPlace();
            }`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            弔鐘碁: 取るたびに弔鐘が鳴り、全石が外へ1歩押される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石が取られると弔鐘が鳴り響く — 取られた場所を震源に、全ての石が外へ1歩ずつ押される。',
            '押し先が塞がる石や、同じ行き先を争う石は動けない。取りのたびに盤面が揺れ動く。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('取られる', board[I(4, 4)] === 0 && captures[1] === 1);
        assert('左の石はさらに外へ', board[I(2, 4)] === 1 && board[I(3, 4)] === 0);
        assert('右の石も外へ', board[I(6, 4)] === 1 && board[I(5, 4)] === 0);
        assert('着手石も押される', board[I(4, 6)] === 1 && board[I(4, 5)] === 0);
    `,
};
