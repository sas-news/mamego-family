// INVADERGO — 侵攻碁: 敵石が上端から降下し、盤面を区画していく
const K = require('../gen_kit.js');
module.exports = {
    file: 'invadergo.html',
    en: 'INVADERGO',
    jp: '侵攻碁',
    prefix: 'invadergo',
    desc: '4手ごとに敵ブロックが上端から降下。下をふさがれたら終わり。',
    kind: 'stone',
    spec: [
        ...K.rb('INVADERGO', '侵攻碁', 'invadergo'),
        K.params([
            { key: 'inv_interval', label: '侵攻間隔', min: 2, max: 12, def: 4, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:侵攻ブロック
        let moveCount = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 侵攻: ブロックが下へ落ち (下が空なら)、4手ごとに上端へ湧く
            moveCount++;
            for (let y = BOARD_SIZE - 1; y >= 0; y--) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const ii = y * BOARD_SIZE + x;
                    if (board[ii] !== 3) continue;
                    if (y + 1 < BOARD_SIZE && board[ii + BOARD_SIZE] === 0) {
                        board[ii + BOARD_SIZE] = 3;
                        board[ii] = 0;
                        fxSlide(ii, ii + BOARD_SIZE, 300); // 降下の実際の経路
                    }
                }
            }
            if (moveCount % Math.max(1, P('inv_interval') || 4) === 0) {
                const tops = [];
                for (let x = 0; x < BOARD_SIZE; x++) if (board[x] === 0) tops.push(x);
                if (tops.length > 0) {
                    const ti = tops[Math.floor(Math.random() * tops.length)];
                    board[ti] = 3;
                    fxGlow(ti, '#a3e635', 800);
                    fxText(ti, '侵攻!', '#a3e635', 1000);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('moveCount % Math.max(1, P("inv_interval") || 4) >= 2 ? "あと" + (Math.max(1, P("inv_interval") || 4) - moveCount % Math.max(1, P("inv_interval") || 4)) + "手で侵攻" : ""'),
        // 侵攻ブロック: 暗緑の装甲面に瞬く複眼 (侵攻らしい質感)
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 侵攻ブロック: 暗緑の装甲と瞬く眼
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                    g.addColorStop(0, '#1c3a1c'); g.addColorStop(1, '#0a140a');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(120,200,80,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - hh, cy - hh, cellSize, cellSize);
                    // 複眼: セルごとに位相をずらして瞬く
                    const blink = Math.sin(now / 900 + i * 1.7) > -0.85;
                    ctx.fillStyle = blink ? '#a3e635' : '#2c4a12';
                    [-0.18, 0.18].forEach(dx0 => {
                        ctx.beginPath();
                        ctx.arc(cx + dx0 * cellSize, cy, cellSize * 0.08, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        // 侵攻の気配: 上端から緑の侵食が滲む常時オーバーレイ
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const g = ctx2.createLinearGradient(0, 0, 0, w * 0.4);
            g.addColorStop(0, 'rgba(80,160,60,0.16)');
            g.addColorStop(1, 'rgba(80,160,60,0)');
            ctx2.fillStyle = g;
            ctx2.fillRect(0, 0, w, w * 0.4);
            ctx2.restore();
        });`],
        [K.ONE, K.INFO_ALGO, `            侵攻碁: 上端から敵ブロックが降下し盤面を侵食していく<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '4手ごとに上端へ敵ブロック (黒い■) が出現し、毎手番に下が空いていれば1段落ちる。',
            'ブロックはどちらの色でもなく取れないが、地や呼吸を分断する障害物になる。',
            'ブロックの落下位置を読み、味方の連が窒息しないよう逃がそう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; moveCount = 0;
        board[0] = 3;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('敵ブロックは一段落ちる', board[0] === 0 && board[BOARD_SIZE] === 3);
        assert('侵攻1手目は湧かない', board.filter(v => v === 3).length === 1);
        board.fill(0); pieces = [];
        board[2 * BOARD_SIZE] = 3; board[3 * BOARD_SIZE] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('下に石があれば落ちられない', board[2 * BOARD_SIZE] === 3);
        board.fill(0); pieces = []; moveCount = 3;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('4手ごとに上端へ湧く', board.slice(0, BOARD_SIZE).includes(3));
    `,
};
