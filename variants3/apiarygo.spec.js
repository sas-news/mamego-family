// APIARYGO — 採蜜碁: 石は蜂。連が花花畑と巣箱の両方に届くと、8手ごとに蜜を貯めて+1点
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
const ST_INIT = `{ score: { 1: 0, 2: 0 } }`;
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
    file: 'apiarygo.html',
    en: 'APIARYGO',
    jp: '採蜜碁',
    prefix: 'apiarygo',
    desc: '中央の花畑と両隅の巣箱。連が両方に届くと8手ごとに蜜を貯めて+1点。',
    kind: 'stone',
    icon: 'apiarygo',
    spec: [
        ...K.rb('APIARYGO', '採蜜碁', 'apiarygo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 花花畑と巣箱: 中央の花畑と上辺両隅の巣箱
        const API_FLOWER = new Set();
        const API_HIVE = new Set();
        {
            const m = Math.floor(BOARD_SIZE / 2);
            const r = Math.max(1, Math.round(BOARD_SIZE * 0.14));
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (Math.hypot(x - m, y - m) <= r) API_FLOWER.add(y * BOARD_SIZE + x);
            }
            API_HIVE.add(1 * BOARD_SIZE + 1);
            API_HIVE.add(1 * BOARD_SIZE + (BOARD_SIZE - 2));
        }
        // 連が花畑と巣箱の両方に届いているか
        function apiaryConnected(player) {
            const seen = new Set();
            const stack = [];
            API_HIVE.forEach(i => { if (board[i] === player) stack.push(i); });
            while (stack.length) {
                const i = stack.pop();
                if (seen.has(i)) continue;
                seen.add(i);
                if (API_FLOWER.has(i)) return true;
                getNeighbors(i).forEach(n => { if (board[n] === player && !seen.has(n)) stack.push(n); });
            }
            return false;
        }`],
        // 8手ごとの採蜜
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 採蜜碁: 8手ごとに、花畑と巣箱を結ぶ連が蜜を貯める (+1点)
            if (history.length > 0 && history.length % 8 === 0) {
                [1, 2].forEach(p => {
                    if (apiaryConnected(p)) {
                        st.score[p]++;
                        const h = [...API_HIVE].find(i => board[i] === p);
                        if (h !== undefined) { fxBurst(h, '#fbbf24', 12, 1.4); fxText(h, '採蜜+1', '#fbbf24', 1100); }
                    }
                });
            }

            turn = opponent;`],
        // 花畑と巣箱の描画
        K.CUE_GRID(`            // 花畑と巣箱
            {
                ctx.save();
                API_FLOWER.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(236, 72, 153, 0.18)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.1, cellSize * 0.1, 0, Math.PI * 2);
                    ctx.arc(cx - cellSize * 0.12, cy + cellSize * 0.06, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.arc(cx + cellSize * 0.12, cy + cellSize * 0.06, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                });
                API_HIVE.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
                    ctx.fillRect(cx - cellSize * 0.38, cy - cellSize * 0.34, cellSize * 0.76, cellSize * 0.68);
                    ctx.strokeStyle = 'rgba(120, 53, 15, 0.8)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.38, cy - cellSize * 0.34, cellSize * 0.76, cellSize * 0.68);
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.1, cy + cellSize * 0.34);
                    ctx.lineTo(cx - cellSize * 0.1, cy + cellSize * 0.12);
                    ctx.lineTo(cx + cellSize * 0.1, cy + cellSize * 0.12);
                    ctx.lineTo(cx + cellSize * 0.1, cy + cellSize * 0.34);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 採点: 蜜をアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._apiDone) {
                st._apiDone = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'蜜 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            採蜜碁: 連が花畑と巣箱を結ぶと8手ごとに+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央に花畑、上辺の両隅に巣箱がある。',
            '自分の連が花畑と巣箱の両方に届いていると、8手ごとに蜜を貯めて+1点。',
            '花畑の争奪と巣への路づくり。巣箱はどちらか一方に届けばよい。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('花畑がある', API_FLOWER.size >= 4);
        assert('巣箱が2つある', API_HIVE.size === 2);
        // 花畑と巣箱を結ぶ連が採蜜する
        board.fill(0); pieces = []; history.length = 0; st.score = { 1: 0, 2: 0 };
        const h = [...API_HIVE][0];
        const f = [...API_FLOWER][0];
        // 巣箱の石と花畑の石を直線の連で結ぶ
        const hx = h % BOARD_SIZE, hy = (h / BOARD_SIZE) | 0;
        const fx = f % BOARD_SIZE, fy = (f / BOARD_SIZE) | 0;
        for (let y = hy; y !== fy + Math.sign(fy - hy); y += Math.sign(fy - hy)) board[I(hx, y)] = 1;
        for (let x = hx; x !== fx + Math.sign(fx - hx); x += Math.sign(fx - hx)) board[I(x, fy)] = 1;
        assert('連が花畑と巣箱を結ぶ', apiaryConnected(1));
        // 結ばれていない敵は採蜜しない
        assert('敵の連は未接続', apiaryConnected(2) === false);
    `,
};
