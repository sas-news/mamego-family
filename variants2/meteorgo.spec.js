// METEORGO — 隕石碁: 7手ごとに隕石が落ち、十字のクレーター(壁)ができる
const K = require('../gen_kit.js');
module.exports = {
    file: 'meteorgo.html',
    en: 'METEORGO',
    jp: '隕石碁',
    prefix: 'meteorgo',
    desc: '7手ごとに隕石が落下し十字のクレーターができる。直撃した石は消える。',
    kind: 'stone',
    spec: [
        ...K.rb('METEORGO', '隕石碁', 'meteorgo'),
        // 7手ごとに隕石落下: 十字形のクレーター(壁)が穿たれ、直撃した石は消滅
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 隕石ルール: 7手ごとに隕石が落ち、十字形のクレーター(壁)ができる。
            //             直撃した石は相手のアゲハマになる。
            if (history.length % 7 === 0) {
                const N = BOARD_SIZE, n = history.length;
                const mx = (n * 5 + 2) % N, my = (n * 7 + 3) % N;
                const crater = [[mx, my], [mx - 1, my], [mx + 1, my], [mx, my - 1], [mx, my + 1]];
                // 着弾演出: 衝撃波リング + 画面揺れ + 各クレーターの火砕
                const ci = my * N + mx;
                fxGlow(ci, '#fdba74', 800);
                fxText(ci, '隕石!', '#fb923c', 1000);
                fxShake(7, 380);
                for (const [x, y] of crater) {
                    if (x < 0 || x >= N || y < 0 || y >= N) continue;
                    const i = y * N + x;
                    fxBurst(i, '#f97316', 9, 1.5);
                    fxBurst(i, '#78716c', 5, 1.0);
                    if (board[i] === 1 || board[i] === 2) captures[board[i] === 1 ? 2 : 1]++;
                    board[i] = 3;
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // クレーター専用テクスチャ: 黒焦げの岩盤 + 脈動する残り火
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // クレーター (壁セル): 黒焦げの岩盤とくすぶる残り火
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, cellSize * 0.05, cx, cy, cellSize * 0.75);
                    g.addColorStop(0, '#1c1917');
                    g.addColorStop(0.65, '#292524');
                    g.addColorStop(1, '#44403c');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    // クレーター縁の焦げた環
                    ctx.strokeStyle = 'rgba(120, 113, 108, 0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.stroke();
                    // 残り火: セルごとに位相の違う赤い脈動
                    const em = Math.sin(now / 400 + x * 2.3 + y * 1.9);
                    if (em > 0.25) {
                        ctx.fillStyle = 'rgba(249, 115, 22,' + ((em - 0.25) * 0.75) + ')';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.13, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`],
        ...K.WALL_GUARD_SPEC,
        ...K.EVENT_CHIP_SPEC(`'隕石まで ' + (7 - history.length % 7) + ' 手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '7手ごとに隕石が落下し、十字形のクレーター(壁)が穿たれる。直撃した石は消滅する。',
            'クレーターは壁となり、呼吸点も地も失う。落下位置は手数で決まり読める。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('隕石前は壁なし', board.every(v => v !== 3));
        const cells = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [0, 2]];
        for (let k = 0; k < 6; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        // 7手目の隕石: mx=(7*5+2)%13=11, my=(7*7+3)%13=0 → クレーターは(11,0)中心
        const N = BOARD_SIZE;
        const mx = (7 * 5 + 2) % N, my = (7 * 7 + 3) % N;
        assert('クレーターが穿たれた', board[my * N + mx] === 3);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('十字に壁ができる', w >= 3);
        assert('壁には置けない', isValidPlacement([{ x: mx, y: my }], 1) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
