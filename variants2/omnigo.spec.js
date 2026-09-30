// OMNIGO — 全能碁: 6手ごとにイベントが周期的に襲来する (侵攻→流星→全反転)
const K = require('../gen_kit.js');
module.exports = {
    file: 'omnigo.html',
    en: 'OMNIGO',
    jp: '全能碁',
    prefix: 'omnigo',
    desc: '6手ごとにイベント襲来。侵攻ブロック→流星で石消滅→全石反転の周期。',
    kind: 'stone',
    spec: [
        ...K.rb('OMNIGO', '全能碁', 'omnigo'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:侵攻ブロック
        let moveCount = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 全能碁: 6手ごとにイベント襲来 (侵攻石→流星→全反転の周期)
            moveCount++;
            if (moveCount % 6 === 0) {
                const ev = Math.floor(moveCount / 6) % 3;
                if (ev === 0) {
                    // 侵攻: 上端の空点に敵ブロックが出現
                    const tops = [];
                    for (let x = 0; x < BOARD_SIZE; x++) if (board[x] === 0) tops.push(x);
                    if (tops.length > 0) {
                        const ti = tops[Math.floor(Math.random() * tops.length)];
                        board[ti] = 3;
                        fxBurst(ti, '#ef4444', 16, 2.0);
                        fxText(ti, '侵攻!', '#ef4444', 1100);
                        fxShake(4, 260);
                    }
                } else if (ev === 1) {
                    // 流星: 盤上の石がランダムに1つ消える
                    const stones = [];
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] === 1 || board[i] === 2) stones.push(i);
                    }
                    if (stones.length > 0) {
                        const si = stones[Math.floor(Math.random() * stones.length)];
                        board[si] = 0;
                        cleanUpPieces();
                        fxBurst(si, '#f8fafc', 18, 2.2);
                        fxBurst(si, '#fbbf24', 8, 1.2);
                        fxText(si, '流星!', '#fbbf24', 1100);
                        fxShake(5, 300);
                    }
                } else {
                    // 反転: 盤上の全石が色を入れ替える
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] === 1) board[i] = 2;
                        else if (board[i] === 2) board[i] = 1;
                    }
                    pieces.forEach(pc => { pc.player = pc.player === 1 ? 2 : 1; });
                    const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                    fxGlow(cc, '#a78bfa', 950);
                    fxText(cc, '天地反転!', '#a78bfa', 1400);
                    fxShake(7, 420);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('moveCount % 6 >= 4 ? "イベント接近" : ""'),
        // 侵攻ブロック: 暗赤の軍事ブロックで自前描画
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`, `            const covered = new Set(); // ピース描画でカバー済みのマス

            // 侵攻ブロック: 鋲打ちの暗赤装甲
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#7f1d1d');
                    g.addColorStop(1, '#450a0a');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.fillStyle = 'rgba(255,160,120,0.5)';
                    [[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3],[0.3,0.3]].forEach(([dx, dy]) => {
                        ctx.beginPath();
                        ctx.arc(cx + dx * cellSize, cy + dy * cellSize, cellSize * 0.07, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.strokeStyle = '#290505';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(cx - hh, cy - hh, cellSize, cellSize);
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_ALGO, `            全能碁: 6手ごとにイベントが周期的に襲来する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとに天変地異が襲来する。周期は 侵攻ブロック出現 → 流星で石1個消滅 → 全石の色反転。',
            '反転で優勢がひっくり返る大盤荒れの碁。イベントの手数を読んで布石せよ。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // イベント接近: 盤の縁が赤く脈動する
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            if (moveCount % 6 < 4) return;
            const ph = (Math.sin(now / 300) + 1) / 2;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(255,120,40,' + (0.07 + ph * 0.10).toFixed(3) + ')';
            ctx2.lineWidth = cs * 0.18;
            ctx2.strokeRect(pad - cs * 0.55, pad - cs * 0.55, w + cs * 0.1, w + cs * 0.1);
            ctx2.restore();
        });`],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; moveCount = 5;
        board[3] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('流星で石が減る', board.filter(v => v === 1 || v === 2).length === 1);
        board.fill(0); pieces = []; moveCount = 11;
        board[0] = 1; board[5] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2);
        assert('全石が反転する', board[0] === 2 && board[5] === 1 && board[6 * BOARD_SIZE + 6] === 1);
        board.fill(0); pieces = []; moveCount = 17;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('侵攻ブロックが上端に湧く', board.slice(0, BOARD_SIZE).includes(3));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
