// PLANTGO — 植物碁: 石は植物。6手ごとに日差しゾーンの連が1つ芽を出して成長する
const K = require('../gen_kit.js');
module.exports = {
    file: 'plantgo.html',
    en: 'PLANTGO',
    jp: '植物碁',
    prefix: 'plantgo',
    desc: '石は植物。6手ごとに日光ゾーン (盤左側) に触れる連が1つ芽を出して成長する。',
    kind: 'stone',
    icon: 'plantgo',
    spec: [
        ...K.rb('PLANTGO', '植物碁', 'plantgo'),
        K.params([{ key: 'grow_every', label: '成長の間隔', min: 2, max: 15, def: 6, unit: '手' }, { key: 'sun_ratio', label: '日差しゾーン幅', min: 0.1, max: 2, step: 0.05, def: 1, hint: '盤幅1/3を1とする' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 植物: 左1/3が日差しゾーン。6手ごとに日差しに触れる連が1つ芽を出す
        let SUN_W = Math.ceil(BOARD_SIZE / 3);
        function rebuildSun() { SUN_W = Math.ceil(BOARD_SIZE / 3 * (P('sun_ratio') || 1)); }
        rebuildSun();
        function onVariantParam() { rebuildSun(); }
        function inSun(x) { return x < SUN_W; }`],
        // 成長: 6手ごとに日差しゾーンの連が芽を出す (両者共通)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 植物: 6手ごとに日差しゾーンの連が成長
            if (history.length > 0 && history.length % Math.max(1, P('grow_every') || 6) === 0) {
                // 連を集めて日差しに触れるものを特定
                const visited = Array(board.length).fill(false);
                const grown = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (visited[i]) continue;
                    const grp = [];
                    let sunny = false;
                    const q = [i]; visited[i] = true;
                    while (q.length) {
                        const c = q.pop(); grp.push(c);
                        if (inSun(c % BOARD_SIZE)) sunny = true;
                        getNeighbors(c).forEach(n => {
                            if (board[n] === board[i] && !visited[n]) { visited[n] = true; q.push(n); }
                        });
                    }
                    if (!sunny) continue;
                    // 空きの隣接セルを集めて最小idxに芽を出す
                    const spots = [];
                    grp.forEach(gi => getNeighbors(gi).forEach(n => {
                        if (board[n] === 0 && !spots.includes(n)) spots.push(n);
                    }));
                    if (spots.length > 0) {
                        spots.sort((a, b) => a - b);
                        const ni = spots[0];
                        board[ni] = board[i];
                        grown.push(ni);
                        fxBurst(ni, '#4ade80', 8, 1.2);
                        fxText(ni, '芽!', '#4ade80', 900);
                    }
                }
                if (grown.length > 0) {
                    cleanUpPieces();
                    // 成長で窒息した連は草枯れ (両者共通)
                    for (let sweep = 0; sweep < 3; sweep++) {
                        let any = false;
                        [1, 2].forEach(p => {
                            const dead = getCapturedStones(board, p);
                            if (dead.length > 0) {
                                dead.forEach(di => { board[di] = 0; fxBurst(di, '#a3e635', 5, 1.0); });
                                captures[p === 1 ? 2 : 1] += dead.length;
                                any = true;
                            }
                        });
                        if (!any) break;
                    }
                    cleanUpPieces();
                }
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 日差しゾーンの描画 (格子線の直前)
        K.CUE_GRID(`            // 植物: 日差しゾーンの薄塗りと太陽
            {
                ctx.save();
                ctx.fillStyle = 'rgba(250,204,21,0.12)';
                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, SUN_W * cellSize, BOARD_SIZE * cellSize);
                const sx = padding + (SUN_W - 0.5) * cellSize, sy = padding - cellSize * 0.5;
                ctx.fillStyle = 'rgba(250,204,21,0.5)';
                ctx.beginPath();
                ctx.arc(sx, sy, cellSize * 0.32, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(250,204,21,0.5)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(sx + Math.cos(a) * cellSize * 0.40, sy + Math.sin(a) * cellSize * 0.40);
                    ctx.lineTo(sx + Math.cos(a) * cellSize * 0.52, sy + Math.sin(a) * cellSize * 0.52);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            植物碁: 6手ごとに日差しゾーンの連が芽を出して成長する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の左1/3は日差しゾーン。6手ごとに日差しに触れる連が空いた隣に芽を出す。',
            '芽は両者の連に出る。成長で相手を窒息させることもできる。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(1, 4)] = 1; // 日差しゾーンの黒
        board[I(8, 8)] = 2; // 日陰の白
        history.length = 5;
        executeMove({ cells: [{ x: 6, y: 0 }] }, 2); // 6手目 → 成長
        // 黒の連が芽を出す (最小idxの空き隣接セル)
        let buds = 0;
        getNeighbors(I(1, 4)).forEach(n => { if (board[n] === 1) buds++; });
        assert('日差しゾーンの連が成長', buds >= 1);
        assert('日陰の連は成長しない', board[I(8, 8)] === 2 && getNeighbors(I(8, 8)).every(n => board[n] !== 2));
        assert('着手できる', isValidPlacement([{ x: 11, y: 11 }], 1) === true);
    `,
};
