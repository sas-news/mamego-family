// GLOWGO — 輝石碁: 5連以上の「輝く連」は取られた時にアゲハマ2倍
const K = require('../gen_kit.js');
module.exports = {
    file: 'glowgo.html',
    en: 'GLOWGO',
    jp: '輝石碁',
    prefix: 'glowgo',
    desc: '5個以上連なった連は輝く。輝いた連の捕獲はアゲハマ2倍。',
    kind: 'crown',
    icon: 'glowgo',
    spec: [
        ...K.rb('GLOWGO', '輝石碁', 'glowgo'),
        K.params([
            { key: 'glow_min', label: '輝石になる連の大きさ', min: 2, max: 15, def: 5, unit: '個' },
            { key: 'glow_bonus', label: '輝石の追加倍率', min: 1, max: 4, def: 1, unit: '倍' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.5, max: 2, step: 0.05, def: 1.1 },
        ]),
        // 捕獲: 取られた連が5個以上ならアゲハマ倍率x2
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                // 輝石: 取った連が5個以上ならアゲハマ2倍 (両者共通)
                const capSet = new Set(captured);
                const seen = new Set();
                let bonus = 0;
                for (const s0 of captured) {
                    if (seen.has(s0)) continue;
                    const q = [s0];
                    seen.add(s0);
                    const grp = [];
                    while (q.length) {
                        const c = q.shift();
                        grp.push(c);
                        getNeighbors(c).forEach(n => {
                            if (capSet.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
                        });
                    }
                    if (grp.length >= (P('glow_min') || 5)) bonus += grp.length * (P('glow_bonus') || 1);
                }
                captures[player] += captured.length + bonus;
                if (bonus > 0) {
                    fxText(captured[0], '輝石x2!', '#fde047', 1200);
                    fxShake(5, 300);
                    captured.forEach(ci => fxGlow(ci, '#fde047', 600));
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 輝き: 5個以上の連は黄金のハイライトを帯びる
            {
                const seen2 = new Set();
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] !== 1 && board[i] !== 2) || seen2.has(i)) continue;
                    const col = board[i];
                    const q = [i];
                    seen2.add(i);
                    const grp = [];
                    while (q.length) {
                        const c = q.shift();
                        grp.push(c);
                        getNeighbors(c).forEach(n => {
                            if (board[n] === col && !seen2.has(n)) { seen2.add(n); q.push(n); }
                        });
                    }
                    if (grp.length < (P('glow_min') || 5)) continue;
                    grp.forEach(g => {
                        const gx = g % BOARD_SIZE, gy = Math.floor(g / BOARD_SIZE);
                        const cx = padding + gx * cellSize, cy = padding + gy * cellSize;
                        ctx.save();
                        ctx.strokeStyle = 'rgba(253,224,71,0.75)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.37, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    });
                }
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は連結するほど輝く。5個以上の連は黄金のリングで示される「輝石」。',
            '輝石の連を取るとアゲハマが2倍になる (取られると痛い)。自分の輝石も同じルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白の5連を作る (中央の横一列)
        for (let x = 2; x <= 6; x++) board[I(x, 4)] = 2;
        // 黒で全周囲を包囲してから最後の呼吸点を埋める
        for (let x = 2; x <= 6; x++) { board[I(x, 3)] = 1; board[I(x, 5)] = 1; }
        board[I(1, 4)] = 1;
        executeMove({ cells: [{ x: 7, y: 4 }] }, 1);
        assert('5連が取られる', board[I(4, 4)] === 0);
        assert('輝石でアゲハマ2倍', captures[1] === 10);
        assert('起動して着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
