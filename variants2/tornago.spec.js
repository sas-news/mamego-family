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
        // 着手ごと竜巻が内環を2マス進み、周囲8マスの石を2マス分旋回させる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

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
                const pos = orbit[(history.length * 2) % orbit.length];
                const tx = pos[0], ty = pos[1];
                const sur = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
                const cells = sur.map(([dx, dy]) => [tx + dx, ty + dy])
                    .filter(([x, y]) => x >= 0 && x < N && y >= 0 && y < N);
                const vals = cells.map(([x, y]) => board[y * N + x]);
                cells.forEach(([x, y], k) => {
                    board[y * N + x] = vals[(k - 2 + vals.length) % vals.length];
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

            turn = opponent;`],
        // 竜巻の描画: 現在位置に渦巻きマーク
        K.CUE_STARS(`            // 竜巻: 現在位置に渦のマーク
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
                const pos = orbit[(history.length * 2) % orbit.length];
                const cx = padding + pos[0] * cellSize, cy = padding + pos[1] * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(90,90,120,0.85)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, Math.PI * 0.2, Math.PI * 1.7);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.16, Math.PI * 1.1, Math.PI * 2.6);
                ctx.stroke();
                ctx.restore();
            }`),
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
