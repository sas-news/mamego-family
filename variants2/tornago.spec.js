// TORNAGO — 竜巻碁: 竜巻が盤の内環を巡回し、周囲の石を巻き上げて旋回させる
const K = require('../gen_kit.js');
module.exports = {
    file: 'tornago.html',
    en: 'TORNAGO',
    jp: '竜巻碁',
    prefix: 'tornago',
    desc: '竜巻が内側の環状コースを巡回。周囲8マスの石を巻き上げて旋回させる。',
    kind: 'stone',
    spec: [
        ...K.rb('TORNAGO', '竜巻碁', 'tornago'),
        K.params([
            { key: 'tornado_step', label: '竜巻の進行マス数', min: 1, max: 6, def: 2, unit: 'マス' },
            { key: 'rotate', label: '旋回マス数', min: 1, max: 4, def: 2, unit: 'マス' },
            { key: 'cap_rows', label: '打ち切り手数', min: 0, max: 8, def: 2, unit: '行', hint: '盤面+この行数' },
        ]),
        // 着手ごと竜巻が内環を2マス進み、周囲8マスの石を2マス分旋回させる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 竜巻ルール: 竜巻は中心から2つ内側の環状コースを1手に2マス進む。
            //             竜巻の周囲8マスの石は2マス分だけ時計回りに旋回する。
            {
                const N = BOARD_SIZE;
                const ring = (d) => {
                    const cs = [];
                    const lo = d, hi = N - 1 - d;
                    for (let x = lo; x <= hi; x++) cs.push([x, lo]);
                    for (let y = lo + 1; y <= hi; y++) cs.push([hi, y]);
                    for (let x = hi - 1; x >= lo; x--) cs.push([x, hi]);
                    for (let y = hi - 1; y > lo; y--) cs.push([lo, y]);
                    return cs;
                };
                const orbit = ring(Math.max(1, Math.floor(N / 2) - 2));
                const pos = orbit[(history.length * (P('tornado_step') || 2)) % orbit.length];
                const tx = pos[0], ty = pos[1];
                const sur = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
                const cells = sur.map(([dx, dy]) => [tx + dx, ty + dy])
                    .filter(([x, y]) => x >= 0 && x < N && y >= 0 && y < N);
                const vals = cells.map(([x, y]) => board[y * N + x]);
                const rot = P('rotate') || 2;
                cells.forEach(([x, y], k) => {
                    board[y * N + x] = vals[(k - rot + vals.length) % vals.length];
                    if (board[y * N + x] !== 0) {
                        const [sx, sy] = cells[(k - rot + vals.length) % vals.length];
                        fxSlide(sy * N + sx, y * N + x, 380);
                    }
                });
                // 変動後処理: 呼吸のなくなった連を両色について除去
                for (const pl of [1, 2]) {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length) {
                        dead.forEach(i => { board[i] = 0; });
                        captures[pl === 1 ? 2 : 1] += dead.length;
                    }
                }
                cleanUpPieces();
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_rows') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 竜巻の描画: 巡回コースの点線 + 現在位置で常時回転する渦腕
        K.CUE_STARS(`            // 竜巻: 巡回コースを薄い点で示す
            {
                const N = BOARD_SIZE;
                const ring = (d) => {
                    const cs = [];
                    const lo = d, hi = N - 1 - d;
                    for (let x = lo; x <= hi; x++) cs.push([x, lo]);
                    for (let y = lo + 1; y <= hi; y++) cs.push([hi, y]);
                    for (let x = hi - 1; x >= lo; x--) cs.push([x, hi]);
                    for (let y = hi - 1; y > lo; y--) cs.push([lo, y]);
                    return cs;
                };
                const orbit = ring(Math.max(1, Math.floor(N / 2) - 2));
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.20);
                for (let k = 0; k < orbit.length; k += 2) {
                    ctx.beginPath();
                    ctx.arc(padding + orbit[k][0] * cellSize, padding + orbit[k][1] * cellSize, Math.max(1, cellSize * 0.05), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        // 竜巻本体: 現在位置で常時回転する渦腕 (アンビエント)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const N = BOARD_SIZE;
            const ring = (d) => {
                const cs2 = [];
                const lo = d, hi = N - 1 - d;
                for (let x = lo; x <= hi; x++) cs2.push([x, lo]);
                for (let y = lo + 1; y <= hi; y++) cs2.push([hi, y]);
                for (let x = hi - 1; x >= lo; x--) cs2.push([x, hi]);
                for (let y = hi - 1; y > lo; y--) cs2.push([lo, y]);
                return cs2;
            };
            const orbit = ring(Math.max(1, Math.floor(N / 2) - 2));
            const pos = orbit[(history.length * (P('tornado_step') || 2)) % orbit.length];
            const cx = pad + pos[0] * cs, cy = pad + pos[1] * cs;
            const rot = now / 230;
            ctx2.save();
            for (let k = 0; k < 3; k++) {
                const a = rot + k * (Math.PI * 2 / 3);
                ctx2.strokeStyle = 'rgba(100,100,140,' + (0.6 - k * 0.15) + ')';
                ctx2.lineWidth = Math.max(1.4, cs * (0.11 - k * 0.025));
                ctx2.lineCap = 'round';
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.55 - k * 0.16), a, a + 1.9);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.RV_ALGO, K.rv([
            '竜巻が内側の環状コースを1手に2マス巡回する。竜巻の周囲8マスの石は2マス分旋回する。',
            '竜巻の位置は手数で決まるので予測できる。巻き上げられた石は隣へ運ばれる。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        const N = BOARD_SIZE;
        board.fill(0);
        // 1手目の竜巻位置: orbit[(1*2)%len] — N=13ならring(4)の3番目=(6,4)
        const c = Math.floor(N / 2);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1); // 竜巻(6,4)の左上
        assert('竜巻に巻き上げられる', board[3 * N + 7] === 1 && board[3 * N + 5] === 0);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 竜巻から遠い場所
        assert('遠くの石は動かない', board[0] === 1);
        board.fill(0);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // 竜巻の目の位置
        assert('目の上の石は旋回しない', board[4 * N + 6] === 1);
    `,
};
