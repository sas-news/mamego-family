// ABYSSGO — 海底碁: 盤は深海の海嶺。熱水噴出孔の温もりの届く点だけが呼吸点になる
const K = require('../gen_kit.js');
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'abyssgo.html',
    en: 'ABYSSGO',
    jp: '海底碁',
    prefix: 'abyssgo',
    desc: '深海の海嶺。熱水噴出孔の温もりの届く点 (チェビシェフ2以内) だけが呼吸点。',
    kind: 'stone',
    icon: 'abyssgo',
    spec: [
        ...K.rb('ABYSSGO', '海底碁', 'abyssgo'),
        K.params([
            { key: 'warm_radius', label: '温もり範囲', min: 1, max: 5, def: 2, hint: '噴出孔からのチェビシェフ距離' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 熱水噴出孔: 5つの噴出孔。温もりが届くのは周囲2マス — そこだけが呼吸点になる
        const VENT_F = [[0.5, 0.5], [0.22, 0.22], [0.78, 0.22], [0.22, 0.78], [0.78, 0.78]];
        const VENTS = VENT_F.map(([fx, fy]) =>
            [Math.round(fx * (BOARD_SIZE - 1)), Math.round(fy * (BOARD_SIZE - 1))]);
        let WARM = new Set();
        // 温もり範囲は設定で調整可能 (変更時に区域を即時再構成)
        function rebuildWarm() {
            WARM = new Set();
            const wr = Math.max(1, P('warm_radius') || 2);
            VENTS.forEach(([vx, vy]) => {
                for (let dy = -wr; dy <= wr; dy++) for (let dx = -wr; dx <= wr; dx++) {
                    const x = vx + dx, y = vy + dy;
                    if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE
                        && Math.max(Math.abs(dx), Math.abs(dy)) <= wr) WARM.add(y * BOARD_SIZE + x);
                }
            });
        }
        rebuildWarm();
        function onVariantParam(p) {
            if (p.key === 'warm_radius') rebuildWarm();
        }`],
        // 呼吸点は「温もりの届く空点」のみ — 寒い深海の空点は呼吸にならない
        [K.ONE, `                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {`,
`                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n] && WARM.has(n)) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {`],
        [K.ONE, `                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {`,
`                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n] && WARM.has(n)) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {`],
        // 着手のたび両色の窒息連を掃く (温もりを失った連も取りこぼさない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 深海の掃討: 温もりの届く呼吸点を全て失った連は (どちらの色でも) 崩壊する
            {
                let swept = 0;
                [1, 2].forEach(cp => {
                    const dead = getCapturedStones(board, cp);
                    if (dead.length) {
                        dead.forEach(i => { board[i] = 0; fxSplash(i, '#38bdf8', 6); });
                        captures[cp === 1 ? 2 : 1] += dead.length;
                        swept += dead.length;
                    }
                });
                if (swept) cleanUpPieces();
            }

            turn = opponent;`],
        // 噴出孔と温もりの描画
        K.CUE_GRID(`            // 海嶺: 深海の闇と噴出孔の温もり
            {
                ctx.save();
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.fillStyle = 'rgba(4, 16, 34, 0.30)';
                ctx.fillRect(0, 0, w, w);
                WARM.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillStyle = 'rgba(240, 138, 60, 0.07)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        K.CUE_STARS(`            // 噴出孔: 煙を上げる黒い煙突
            {
                const now = fxNow();
                VENTS.forEach(([vx, vy]) => {
                    const cx = padding + vx * cellSize, cy = padding + vy * cellSize;
                    ctx.save();
                    ctx.fillStyle = '#1f2937';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.22, cy + cellSize * 0.3);
                    ctx.lineTo(cx - cellSize * 0.1, cy - cellSize * 0.25);
                    ctx.lineTo(cx + cellSize * 0.1, cy - cellSize * 0.25);
                    ctx.lineTo(cx + cellSize * 0.22, cy + cellSize * 0.3);
                    ctx.closePath();
                    ctx.fill();
                    const fl = 0.5 + Math.sin(now / 300 + vx * 3 + vy) * 0.3;
                    ctx.fillStyle = 'rgba(251, 146, 60,' + fl + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.3, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 深海: 上がる泡と揺れる微光
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let k = 0; k < 12; k++) {
                const t = ((now / 4200) + k * 0.37) % 1;
                const bx = pad + ((k * 2.7) % BOARD_SIZE) * cs + Math.sin(now / 900 + k) * cs * 0.2;
                const by = pad + (BOARD_SIZE - 1) * cs * (1 - t);
                ctx2.globalAlpha = 0.12 + 0.1 * Math.sin(k * 2.1);
                ctx2.strokeStyle = '#7dd3fc';
                ctx2.lineWidth = Math.max(1, cs * 0.03);
                ctx2.beginPath();
                ctx2.arc(bx, by, cs * (0.05 + (k % 3) * 0.02), 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.INFO_ALGO, `            海底碁: 熱水噴出孔の温もりの届く点 (周囲2マス) だけが呼吸点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は深海。5つの熱水噴出孔の温もりの届く点 (周囲2マス) だけが「呼吸点」になる。',
            '温もりの届かない空点は呼吸に数えられない — 噴出孔の周りでしか連は生きられない。',
            '温もり圏を塞がれた連は崩壊する。深海への遠征は自殺行。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const vc = VENTS[0];
        assert('噴出孔の温もり圏がある', WARM.size >= 20);
        assert('噴出孔の中心は温もり圏', WARM.has(I(vc[0], vc[1])));
        // 温もり圏の近くは合法手がある
        let ok = false;
        WARM.forEach(i => { if (isValidPlacement([{ x: i % BOARD_SIZE, y: (i / BOARD_SIZE) | 0 }], 1)) ok = true; });
        assert('温もり圏に着手可', ok);
        // 深海の孤立点は呼吸ゼロ → 自殺手で置けない
        const far = I(0, BOARD_SIZE - 1);
        assert('温もりの届かない点は置けない', WARM.has(far) || isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === false);
    `,
};
