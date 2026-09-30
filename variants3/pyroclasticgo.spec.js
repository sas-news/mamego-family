// PYROCLASTICGO — 火砕碁: 20手ごとに火砕流が斜面を駆け下り、通路上の石を全て焼く
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
const ST_INIT = `{ ply: 0 }`;
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
    file: 'pyroclasticgo.html',
    en: 'PYROCLASTICGO',
    jp: '火砕碁',
    prefix: 'pyroclasticgo',
    desc: '山頂から火砕流が斜面を駆け下りる。20手ごとの噴火で通路上の石は全て焼かれる。',
    kind: 'stone',
    icon: 'pyroclasticgo',
    spec: [
        ...K.rb('PYROCLASTICGO', '火砕碁', 'pyroclasticgo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 火砕流の通路: 山頂(中央)から両裾野へ蛇行しながら下る1マス幅の道
        let PYRO = [];
        function pyroPath(n) {
            const c = Math.floor(n / 2), path = [];
            let x = c;
            for (let y = 0; y < n; y++) {
                path.push(y * n + x);
                if (y % 3 === 2) x += (x <= c ? 1 : -1); // 蛇行
            }
            return path;
        }
        function rebuildPyro() {
            PYRO = pyroPath(BOARD_SIZE);
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildPyro();`],
        // 噴火: 20手ごとに火砕流が通路上の石を焼く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 噴火: 20手ごとに火砕流が斜面を駆け下りる
            st.ply++;
            if (st.ply % 20 === 0) {
                let burnt = 0;
                PYRO.forEach(i => {
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        captures[v === 1 ? 2 : 1]++;
                        board[i] = 0;
                        burnt++;
                        fxBurst(i, '#f97316', 10, 1.6);
                    }
                });
                pieces = pieces.filter(pc => pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                fxShake(6, 500);
                const top = PYRO[0];
                fxText(top, burnt > 0 ? '噴火! ' + burnt + '石が焼かれた' : '噴火!', '#fb923c', 1600);
            }

            turn = opponent;`],
        // 火砕流通路の描画: 中央を縦に走る暗い火山灰帯
        K.CUE_GRID(`            // 火砕流の予告線: 山頂から下る暗い火山灰の帯
            {
                ctx.save();
                const now = fxNow();
                PYRO.forEach((i, k) => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const a = 0.16 + 0.10 * Math.sin(now / 500 - k * 0.6);
                    ctx.fillStyle = 'rgba(120,60,30,' + Math.max(0.08, a).toFixed(3) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                // 山頂の火口
                const t0 = PYRO[0];
                if (t0 != null) {
                    const cx = padding + (t0 % BOARD_SIZE) * cellSize, cy = padding + ((t0 / BOARD_SIZE) | 0) * cellSize;
                    ctx.fillStyle = 'rgba(249,115,22,0.75)';
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'噴火まで ' + (20 - (st.ply % 20)) + '手'`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_MIST('249,115,22')],
        [K.ONE, K.INFO_ALGO, `            火砕碁: 中央の火山灰帯は火砕流の通路。20手ごとの噴火で通路上の石は全て焼かれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の中央を縦に走る暗い帯は火砕流の予告線 — 20手ごとに噴火が起きる。',
            '噴火で通路上の石は色に関わらず全て焼かれ、相手のアゲハマになる。',
            '通路を跨ぐ連は噴火で寸断される。噴火のタイミングはチップで読める。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('火砕流通路がある', PYRO.length === BOARD_SIZE);
        const mid = PYRO[Math.floor(BOARD_SIZE / 2)];
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[mid] = 1;
        st.ply = 19;
        const safe = PYRO.indexOf(I(0, 0)) >= 0 ? I(1, 0) : I(0, 0);
        executeMove({ cells: [{ x: safe % BOARD_SIZE, y: (safe / BOARD_SIZE) | 0 }] }, 2);
        assert('噴火で通路上の石が焼かれる', board[mid] === 0 && captures[2] === 1);
        assert('置いた石は通路外で無事', board[safe] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
