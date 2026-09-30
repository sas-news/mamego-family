// MOCHITSUKIGO — 餅搗碁: 石は餅。自分の連に隣接して打つと連が1石伸びる (搗くと柔らかくなる)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mochitsukigo.html',
    en: 'MOCHITSUKIGO',
    jp: '餅搗碁',
    prefix: 'mochitsukigo',
    desc: '石は餅。自分の連に隣接して打つと、その連が空点へ1石伸びる。',
    kind: 'stone',
    icon: 'mochitsukigo',
    spec: [
        ...K.rb('MOCHITSUKIGO', '餅搗碁', 'mochitsukigo'),
        // 餅搗き: 着手した連が呼吸点2以上なら、連が1つ空点へ伸びる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 餅搗き: 搗かれた餅(連)は柔らかくなって1石伸びる (呼吸点2以上の時だけ・1手1回)
            {
                const placed = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                // 着手した石を含む連を収集
                const grp = [];
                const seen = new Set([placed]);
                const q = [placed];
                while (q.length) {
                    const c = q.pop();
                    grp.push(c);
                    getNeighbors(c).forEach(n => {
                        if (board[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }
                    });
                }
                // 連の呼吸点を集める
                const libs = new Set();
                grp.forEach(c => getNeighbors(c).forEach(n => {
                    if (board[n] === 0) libs.add(n);
                }));
                if (libs.size >= 2) {
                    // 最も盤中央寄りの呼吸点へ1石伸びる (ランダムではなく決定的)
                    const cc = (BOARD_SIZE - 1) / 2;
                    const grow = [...libs].sort((a, b) =>
                        (Math.abs(a % BOARD_SIZE - cc) + Math.abs(Math.floor(a / BOARD_SIZE) - cc)) -
                        (Math.abs(b % BOARD_SIZE - cc) + Math.abs(Math.floor(b / BOARD_SIZE) - cc)))[0];
                    board[grow] = player;
                    fxSlide(placed, grow, 380);
                    fxText(grow, 'のびる', '#fbcfe8', 900);
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: [{ x: grow % BOARD_SIZE, y: Math.floor(grow / BOARD_SIZE) }] });
                }
            }

            turn = opponent;`],
        [K.ONE, K.INFO_ALGO, `            餅搗碁: 石は餅。自分の連に隣接して打つと搗かれて柔らかくなり、連が空点へ1石伸びる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は餅でできている。自分の連に隣接する空点へ打つと、その連は搗かれて柔らかくなり、',
            '連の呼吸点のうち盤中央に最も近い1点へ自分の石が1つ伸びる (連の呼吸点が2以上の時・1手1回)。',
            '伸びる分だけ連は大きく育つが、伸びた石も取られる。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        board[4 * B + 4] = 1; board[5 * B + 4] = 1; // 既存の黒連 (4,4)と(4,5)
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 連に隣接 → 搗き
        const mine = board.filter(v => v === 1).length;
        assert('餅が1石伸びる', mine === 4);
        // 伸びた石は着手石を含む連の呼吸点だった場所
        const grp = []; const seen = new Set([4 * B + 4]);
        const q = [4 * B + 4];
        while (q.length) { const c = q.pop(); grp.push(c); getNeighbors(c).forEach(n => { if (board[n] === 1 && !seen.has(n)) { seen.add(n); q.push(n); } }); }
        assert('伸びた石も同じ連', grp.length === 4);
        assert('相手の連は伸びない', board.filter(v => v === 2).length === 0);
    `,
};
