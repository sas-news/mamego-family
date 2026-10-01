// MYCELIUMGO — 菌糸碁: 打った石の菌糸が栄養源(星の点)へ向かって自動的に1歩伸長する
const K = require('../gen_kit.js');
module.exports = {
    file: 'myceliumgo.html',
    en: 'MYCELIUMGO',
    jp: '菌糸碁',
    prefix: 'myceliumgo',
    desc: '打った石の菌糸が最も近い栄養源に向かって1歩伸びる。栄養源を3つ吸収すると勝ち。',
    kind: 'stone',
    icon: 'myceliumgo',
    spec: [
        ...K.rb('MYCELIUMGO', '菌糸碁', 'myceliumgo'),
        K.params([
            { key: 'feed_goal', label: '養分の目標数', min: 1, max: 8, def: 3, unit: '個', hint: '菌糸が収穫で得られる栄養数' },
            { key: 'cap', label: '打ち切り手数', min: 50, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { fed: { 1: 0, 2: 0 } }; // 吸収した栄養源の数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { fed: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { fed: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { fed: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { fed: { 1: 0, 2: 0 } };`],
        // 栄養源: 星の点
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function nutrientCells() { return getStarPoints(BOARD_SIZE).map(pt => pt.y * BOARD_SIZE + pt.x); }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 菌糸伸長: 打った石が最も近い栄養源へ向かって1歩伸びる (空きマスのみ)
            {
                const last = move.cells[0];
                const li = last.y * BOARD_SIZE + last.x;
                const nuts = nutrientCells().filter(ni => board[ni] !== 3);
                if (nuts.length > 0) {
                    let target = nuts[0], best = 1e9;
                    nuts.forEach(ni => {
                        const nx = ni % BOARD_SIZE, ny = Math.floor(ni / BOARD_SIZE);
                        const d = Math.abs(nx - last.x) + Math.abs(ny - last.y);
                        if (d < best) { best = d; target = ni; }
                    });
                    const tx = target % BOARD_SIZE, ty = Math.floor(target / BOARD_SIZE);
                    const dx = Math.sign(tx - last.x), dy = Math.sign(ty - last.y);
                    // 軸差が大きい方へ1歩 (同距離ならx優先)
                    let ni = -1;
                    if (Math.abs(tx - last.x) >= Math.abs(ty - last.y) && dx !== 0) {
                        const cand = last.y * BOARD_SIZE + last.x + dx;
                        if (board[cand] === 0) ni = cand;
                    }
                    if (ni < 0 && dy !== 0) {
                        const cand = (last.y + dy) * BOARD_SIZE + last.x;
                        if (board[cand] === 0) ni = cand;
                    }
                    if (ni < 0 && dx !== 0) {
                        const cand = last.y * BOARD_SIZE + last.x + dx;
                        if (board[cand] === 0) ni = cand;
                    }
                    if (ni >= 0) {
                        board[ni] = player;
                        fxSlide(li, ni, 300);
                        // 栄養源に到達したら吸収
                        if (nuts.includes(ni)) {
                            st.fed[player]++;
                            fxBurst(ni, '#84cc16', 10, 1.6);
                            fxText(ni, '吸収!', '#84cc16', 1200);
                            if (st.fed[player] >= Math.max(1, P('feed_goal') || 3)) {
                                winByRule(player, '菌糸支配', '栄養源を3つ吸収しました'); return;
                            }
                        }
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 栄養源の描画 (緑のもやし)
        K.CUE_STARS(`            // 栄養源: 緑の双葉
            {
                nutrientCells().forEach(ni => {
                    const nx = ni % BOARD_SIZE, ny = Math.floor(ni / BOARD_SIZE);
                    const cx = padding + nx * cellSize, cy = padding + ny * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(132,204,22,0.85)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + cellSize * 0.25);
                    ctx.quadraticCurveTo(cx - cellSize * 0.2, cy, cx - cellSize * 0.18, cy - cellSize * 0.22);
                    ctx.moveTo(cx, cy + cellSize * 0.25);
                    ctx.quadraticCurveTo(cx + cellSize * 0.2, cy, cx + cellSize * 0.18, cy - cellSize * 0.22);
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'吸収 ' + st.fed[1] + '-' + st.fed[2]`),
        [K.ONE, K.INFO_ALGO, `            菌糸碁: 打った石の菌糸が最寄りの栄養源へ1歩伸びる。3つ吸収で勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石を打つたび、その石から最も近い栄養源 (緑の双葉=星の点) へ向かって菌糸が1歩伸び、空きマスに自分の石が生える。',
            '菌糸の先端が栄養源に到達すると吸収。3つ吸収した側が菌糸支配で勝ち。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { fed: { 1: 0, 2: 0 } };
        const nuts = nutrientCells();
        assert('栄養源は5箇所', nuts.length === 5);
        // 栄養源の左隣に打つ → 菌糸が栄養源へ伸びて吸収
        const target = nuts[0];
        const tx = target % BOARD_SIZE, ty = Math.floor(target / BOARD_SIZE);
        executeMove({ cells: [{ x: tx - 1, y: ty }] }, 1);
        assert('菌糸が栄養源に伸びた', board[target] === 1 && st.fed[1] === 1);
        // 栄養源から遠い場所では1歩だけ
        executeMove({ cells: [{ x: 0, y: BOARD_SIZE - 1 }] }, 1);
        assert('遠くでも1歩だけ伸びる', st.fed[1] === 1);
    `,
};
