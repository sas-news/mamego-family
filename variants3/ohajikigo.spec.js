// OHAJIKIGO — 御碁碁: 石はおはじき。打った石が敵石に弾き当たると、その敵石を弾き飛ばせる
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
    file: 'ohajikigo.html',
    en: 'OHAJIKIGO',
    jp: '御碁碁',
    prefix: 'ohajikigo',
    desc: '石はおはじき。打った石に接した敵石を直線に弾き、行き止まりや盤外に当たれば取れる。',
    kind: 'stone',
    icon: 'ohajikigo',
    spec: [
        ...K.rb('OHAJIKIGO', '御碁碁', 'ohajikigo'),
        K.params([
            { key: 'flick_dist', label: '弾き飛ばす距離', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // おはじき: 着手点に隣接する敵石を直線に弾く。
        // 弾かれた敵石は盤外または行き止まりで取れ、空へ飛ぶと1つずれる
        function flickHits(moveIdx, player) {
            const opponent = 3 - player, hits = [];
            const mx = moveIdx % BOARD_SIZE, my = (moveIdx / BOARD_SIZE) | 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const x = mx + dx, y = my + dy;
                if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return;
                const j = y * BOARD_SIZE + x;
                if (board[j] !== opponent) return; // 隣が敵石の時だけ弾ける
                const dist = Math.max(1, P('flick_dist') || 1);
                let lx = x, ly = y, dead = false;
                for (let s = 0; s < dist; s++) {
                    lx += dx; ly += dy;
                    if (lx < 0 || ly < 0 || lx >= BOARD_SIZE || ly >= BOARD_SIZE) { dead = true; break; }
                    if (board[ly * BOARD_SIZE + lx] !== 0) { dead = true; break; }
                }
                if (dead) {
                    hits.push({ from: j, to: null }); // 盤外または行き止まりで取れる
                } else {
                    hits.push({ from: j, to: ly * BOARD_SIZE + lx }); // 空=ずれる
                }
            });
            return hits;
        }`],
        // 弾き: 着手後、隣接した敵石を直線に弾く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // おはじき: 着手点に隣接する敵石を直線に弾く
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const hits = flickHits(mi, player);
                let taken = 0;
                hits.forEach(h => {
                    if (h.to === null) {
                        const v = board[h.from];
                        if (v === 1 || v === 2) {
                            board[h.from] = 0;
                            captures[player]++;
                            taken++;
                            fxBurst(h.from, '#f472b6', 10, 1.5);
                        }
                    } else {
                        const v = board[h.from];
                        board[h.to] = v;
                        board[h.from] = 0;
                        const fx = h.from % BOARD_SIZE, fy = (h.from / BOARD_SIZE) | 0;
                        const tx = h.to % BOARD_SIZE, ty = (h.to / BOARD_SIZE) | 0;
                        pieces.forEach(pc => pc.cells.forEach(p => {
                            if (p.x === fx && p.y === fy) { p.x = tx; p.y = ty; }
                        }));
                        fxSlide(h.from, h.to, 320);
                    }
                });
                if (taken > 0) {
                    pieces = pieces.filter(pc => pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                    fxText(mi, 'はじき x' + taken, '#f472b6', 1300);
                }
            }

            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            御碁碁: 石はおはじき。打った石に接した敵石を直線に弾く — 盤外や行き止まりで取れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '打った石に隣接した敵石は、その方向へ1つ弾き飛ばされる (おはじき)。',
            '弾かれた敵石が盤外に出るか行き止まり (壁・他石) に当たると取れる。空なら1つずれるだけ。',
            '通常の囲み取りも有効 — 弾きと囲みを組み合わせて攻める。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(5, 5)] = 2; // 白
        board[I(6, 5)] = 1; // 黒で行き止まり
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 右隣の白を弾く → (6,5)黒で行き止まり → 取れる
        assert('はじきで取れる', board[I(5, 5)] === 0 && captures[1] === 1);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(5, 5)] = 2; // 白、向こう側が空
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 右に弾く → (6,5)空 → 白がずれる
        assert('空へ弾くとずれる', board[I(5, 5)] === 0 && board[I(6, 5)] === 2);
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(0, 4)] = 2; // 左辺の白
        executeMove({ cells: [{ x: 1, y: 4 }] }, 1); // 左隣の白を左へ弾く → 盤外 → 取れる
        assert('盤外へ弾くと取れる', board[I(0, 4)] === 0 && captures[1] === 1);
    `,
};
