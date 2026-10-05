// PROPHGO — 預言碁: 15手ごとに隕石が落下し3x3を破壊する。落下点は当初から予告されている
const K = require('../gen_kit.js');
module.exports = {
    file: 'prophgo.html',
    en: 'PROPHGO',
    jp: '預言碁',
    prefix: 'prophgo',
    desc: '15手ごとに予告された地点へ隕石が落ち、3x3の石を消し飛ばす。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'meteor',
    spec: [
        ...K.rb('PROPHGO', '預言碁', 'prophgo'),
        K.params([{ key: 'meteor_every', label: '隕石の間隔', min: 5, max: 40, def: 15, unit: '手' }, { key: 'blast_r', label: '爆風の半径', min: 1, max: 3, def: 1 }]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 預言碁: n 手目の着手後に落下する隕石の中心 (決定論的)
        function meteorPoint(n) {
            return { x: (n * 5 + 3) % BOARD_SIZE, y: (n * 7 + 2) % BOARD_SIZE };
        }
        function nextMeteorMove() { const _me = Math.max(1, P('meteor_every') || 15); return (Math.floor(history.length / _me) + 1) * _me; }

        function drawBoardElements(padding, cellSize) {`],
        // 15の倍数手の後、予告地点に隕石落下 → 3x3の石を破壊 (敵石はアゲハマに)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 預言碁: 15の倍数手の後に隕石落下。落下点の3x3の石を全て消し飛ばす
            if (history.length % Math.max(1, P('meteor_every') || 15) === 0) {
                const mp = meteorPoint(history.length);
                // 着弾演出: 預言どおりの着点で衝撃波・火花・画面揺れ
                const mi = mp.y * BOARD_SIZE + mp.x;
                fxGlow(mi, '#fdba74', 850);
                fxText(mi, '着弾!', '#fb923c', 1000);
                fxShake(8, 400);
                const _br = Math.max(1, P('blast_r') || 1);
                for (let dy = -_br; dy <= _br; dy++) {
                    for (let dx = -_br; dx <= _br; dx++) {
                        const nx = mp.x + dx, ny = mp.y + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                        const i0 = ny * BOARD_SIZE + nx;
                        fxBurst(i0, '#f97316', 9, 1.6);
                        fxBurst(i0, '#fbbf24', 5, 1.1);
                        if (board[i0] === opponent) captures[player]++;
                        board[i0] = 0;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        K.CUE_STARS(`            // 隕石: 次の落下予告点に照準 (常時表示 = 預言。接近で脈動・警告色に転移)
            {
                const mp = meteorPoint(nextMeteorMove());
                const cx = padding + mp.x * cellSize, cy = padding + mp.y * cellSize;
                const remain = nextMeteorMove() - history.length;
                const urgency = Math.max(0, Math.min(1, (5 - remain) / 5));
                const pl = Math.sin(fxNow() / (160 - urgency * 80));
                ctx.save();
                ctx.strokeStyle = urgency > 0.6
                    ? 'rgba(239, 68, 68, ' + (0.75 + 0.2 * pl) + ')'
                    : 'rgba(249, 115, 22, ' + (0.65 + 0.25 * pl) + ')';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.055);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * (0.46 + 0.08 * pl), 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.7, cy); ctx.lineTo(cx - cellSize * 0.3, cy);
                ctx.moveTo(cx + cellSize * 0.3, cy); ctx.lineTo(cx + cellSize * 0.7, cy);
                ctx.moveTo(cx, cy - cellSize * 0.7); ctx.lineTo(cx, cy - cellSize * 0.3);
                ctx.moveTo(cx, cy + cellSize * 0.3); ctx.lineTo(cx, cy + cellSize * 0.7);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'隕石まで ' + (nextMeteorMove() - history.length) + '手'`),
        [K.ONE, K.INFO_BASE, `            預言碁: 15手ごとに予告された地点へ隕石落下。3x3の石は色を問わず消し飛ぶ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤上には常に「次の隕石落下点」が照準で示されている (落下は15の倍数手の後)。',
            '落下点の3x3の石は全て消し飛ぶ — 敵石は着手側のアゲハマに、自分の石はただ消える。',
            '隕石圏内に固めない / 敵を追い込む — 天災を読みに組み込む戦い。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('落下点は決定論的', JSON.stringify(meteorPoint(15)) === JSON.stringify(meteorPoint(15)));
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const mp = meteorPoint(15);
        board[mp.y * BOARD_SIZE + mp.x] = 2; // 落下点に白石を配置
        history.length = 14;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1); // 15手目 → 隕石落下
        assert('15手後に落下点の石は消える', board[mp.y * BOARD_SIZE + mp.x] === 0);
        assert('敵石は着手側のアゲハマに', captures[1] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
