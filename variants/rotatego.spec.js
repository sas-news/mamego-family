// ROTATEGO — 環流碁: 外リングは時計回り、内リングは反時計回りに環流する
const K = require('../gen_kit.js');
module.exports = {
    file: 'rotatego.html',
    en: 'ROTATEGO',
    jp: '環流碁',
    prefix: 'rotatego',
    desc: '外周リングは時計回り、内周リングは反時計回りに1手ごと1マス環流。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('ROTATEGO', '環流碁', 'rotatego'),
        K.params([
            { key: 'spin_speed', label: '環流の速さ', min: 1, max: 4, def: 1, unit: 'マス/手' },
            { key: 'cap_extra', label: '打ち切り余分', min: 0, max: 8, def: 2, unit: '行分', hint: '交点数+この行数×盤サイズの手数で強制終局' },
        ]),
        // 着手ごと、外リングCW・内リングCCWに石が1マス環流
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 環流ルール: 外周リングは時計回り、内周リングは反時計回りに石が1マス回る
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
                const spin = (cs, dir) => {
                    const vals = cs.map(([x, y]) => board[y * N + x]);
                    cs.forEach(([x, y], k) => {
                        board[y * N + x] = vals[(k - dir + vals.length) % vals.length];
                        // 移動した石を出発点→到着点のスライドで表示 (実際の流れを可視化)
                        const [sx, sy] = cs[(k - dir + vals.length) % vals.length];
                        if (board[y * N + x] !== 0) fxSlide(sy * N + sx, y * N + x, 420);
                    });
                };
                const spd = Math.max(1, P('spin_speed') || 1);
                spin(ring(0), spd);
                if (N >= 5) spin(ring(1), -spd);
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
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_extra') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 環流方向の表示
        K.CUE_STARS(`            // 環流: 外↻内↺ の回転記号
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.7);
                ctx.font = 'bold ' + Math.round(cellSize * 0.8) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const c = (BOARD_SIZE - 1) / 2;
                ctx.fillText('↻', padding - cellSize * 0.8, padding + c * cellSize);
                ctx.fillText('↺', padding + c * cellSize, padding + c * cellSize);
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '外周リングは時計回り、内周リングは反時計回りに、着手ごと全石が1マス環流する。',
            '中央部は動かない。環流で石が運ばれ、囲いも崩れもする。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('外環は時計回りに回る', board[0 * BOARD_SIZE + 1] === 1 && board[0] === 0);
        board.fill(0);
        board[1 * BOARD_SIZE + 1] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('内環は反時計回りに回る', board[2 * BOARD_SIZE + 1] === 1 && board[1 * BOARD_SIZE + 1] === 0);
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('中央の石は環流しない', board[c * BOARD_SIZE + c] === 1);
    `,
};
