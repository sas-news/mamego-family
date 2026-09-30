// GROVEGO — 木立碁: 盤上の木立は置けないが、追い詰められた連は木立を1本伐って息をつく
const K = require('../gen_kit.js');
module.exports = {
    file: 'grovego.html',
    en: 'GROVEGO',
    jp: '木立碁',
    prefix: 'grovego',
    desc: '木立区域は着手不可。窒息した連は接する木立を1本伐って生き延びる。',
    kind: 'stone',
    icon: 'grovego',
    spec: [
        ...K.rb('GROVEGO', '木立碁', 'grovego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 木立: 5つの小さな林。着手不可・呼吸なしだが「伐採」で消える
        const GROVE_SEEDS = [
            [0.20, 0.28], [0.72, 0.16], [0.26, 0.74], [0.80, 0.66], [0.48, 0.42],
        ];
        const GROVE_R = BOARD_SIZE * 0.085;
        function isGrove(x, y) {
            return GROVE_SEEDS.some(([fx, fy]) =>
                Math.hypot(x - fx * (BOARD_SIZE - 1), y - fy * (BOARD_SIZE - 1)) <= GROVE_R);
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (isGrove(x, y)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 木立の救済: 窒息した連が木立に接していれば1本伐って生き延びる
        [K.ONE, K.CAPTURE_BLOCK, `            // 捕獲処理 (木立の救済つき)
            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 連ごとに分割して木立に接するか判定
                const capSet = new Set(captured);
                const seenG = new Set();
                let fellCount = 0;
                captured.forEach(start => {
                    if (seenG.has(start)) return;
                    const grp = [];
                    const q = [start]; seenG.add(start);
                    while (q.length) {
                        const c = q.pop(); grp.push(c);
                        getNeighbors(c).forEach(n => {
                            if (capSet.has(n) && !seenG.has(n)) { seenG.add(n); q.push(n); }
                        });
                    }
                    // 木立に接する連は1本伐って息をつく
                    let fell = -1;
                    grp.forEach(gi => {
                        if (fell >= 0) return;
                        getNeighbors(gi).forEach(n => { if (board[n] === 3) fell = n; });
                    });
                    if (fell >= 0) {
                        board[fell] = 0; // 伐採: 木立が消えて空地になる
                        fellCount++;
                        fxBurst(fell, '#4ade80', 10, 1.3);
                        fxText(grp[0], '伐採!', '#4ade80', 1100);
                    } else {
                        grp.forEach(ci => { board[ci] = 0; fxBurst(ci, '#f87171', 5, 1.0); });
                        captures[player] += grp.length;
                    }
                });
                if (captured.length > 0) soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 木立の描画
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_MOSS)],
        // 木立を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            木立碁: 木立区域は着手不可。窒息した連は木立を1本伐って生き延びる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の木立 (緑の林) は着手も呼吸点にもならない。',
            'ただし窒息した連が木立に接していれば、木を1本伐って息をつき生き延びる (伐採は1度きり)。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        // 木立が存在する
        let groveCount = 0;
        for (let i = 0; i < board.length; i++) if (board[i] === 3) groveCount++;
        assert('木立がある', groveCount > 0);
        // 木立の1マスを特定
        const gi = board.findIndex(v => v === 3);
        const gx = gi % BOARD_SIZE, gy = Math.floor(gi / BOARD_SIZE);
        assert('木立には置けない', isValidPlacement([{ x: gx, y: gy }], 1) === false);
        // 木立に接した窒息連が伐採で助かるか: 木立の隣に白を置き他を黒で塞ぐ
        pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 木立の隣接セルを1つ選び、そこに白の連を窒息させる
        let wi = -1;
        getNeighbors(gi).forEach(n => { if (board[n] === 0 && wi < 0) wi = n; });
        board[wi] = 2;
        getNeighbors(wi).forEach(n => { if (board[n] === 0) board[n] = 1; });
        const groveBefore = board.filter(v => v === 3).length;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒がどこかに着手 → 白連の取り判定
        assert('木立に接する連は伐採で生存', board[wi] === 2);
        assert('木立が1本伐られた', board.filter(v => v === 3).length === groveBefore - 1);
        assert('アゲハマは増えない', captures[1] === 0);
    `,
};
