// ICICLEGO — 氷柱碁: 石は氷柱。盤上を巡る陽射しに二度晒されると溶けて消える
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
const ST_INIT = `{ melt: {} }`; // idx -> 陽射しを浴びた回数
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
    file: 'iciclego.html',
    en: 'ICICLEGO',
    jp: '氷柱碁',
    prefix: 'iciclego',
    desc: '陽射しが盤を西から東へ巡る。二度日に晒された氷柱の石は溶けて消える。',
    kind: 'stone',
    icon: 'iciclego',
    spec: [
        ...K.rb('ICICLEGO', '氷柱碁', 'iciclego'),
        K.params([
            { key: 'melt_hits', label: '溶解までの日射回数', min: 1, max: 5, def: 2, unit: '回' },
            { key: 'sun_step', label: '陽射しの進み', min: 1, max: 3, def: 1, hint: '1手で進む列数' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 陽射し: 手数とともに盤を西から東へ巡る光の列
        function iciSunX() { return (history.length * (P('sun_step') || 1)) % BOARD_SIZE; }
        const ICI_MELT = 2; // 二度晒されると溶ける (日射回数は設定で調整)`],
        // 毎手、日の当たる列の石が熱を浴びる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 氷柱碁: 陽射しの列の石が熱を浴び、二度目で溶ける
            {
                const sx = iciSunX();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const i = y * BOARD_SIZE + sx;
                    if (board[i] !== 1 && board[i] !== 2) { if (st.melt[i]) delete st.melt[i]; continue; }
                    st.melt[i] = (st.melt[i] || 0) + 1;
                    if (st.melt[i] >= (P('melt_hits') || 2)) {
                        board[i] = 0;
                        delete st.melt[i];
                        fxSplash(i, '#7dd3fc', 10);
                        fxText(i, '溶解', '#7dd3fc', 900);
                    } else {
                        fxGlow(i, '#fef08a', 500);
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 陽射しの列の描画
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 陽射し: 盤を巡る光の帯
        fxAmbient((ctx2, now, pad, cs) => {
            const sx = iciSunX();
            const cx = pad + sx * cs;
            ctx2.save();
            const g = ctx2.createLinearGradient(cx - cs, 0, cx + cs, 0);
            g.addColorStop(0, 'rgba(254, 240, 138, 0)');
            g.addColorStop(0.5, 'rgba(254, 240, 138, 0.16)');
            g.addColorStop(1, 'rgba(254, 240, 138, 0)');
            ctx2.fillStyle = g;
            ctx2.fillRect(cx - cs, pad - cs, cs * 3, cs * (BOARD_SIZE + 1));
            ctx2.restore();
        });`],
        // 溶けかけの石の雫
        ...K.STONE_MARKS_SPEC(`            // 溶けかけの氷柱: 雫の輪郭
            Object.keys(st.melt).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(125, 211, 252, 0.7)';
                ctx.beginPath();
                ctx.moveTo(cx, cy + cellSize * 0.1);
                ctx.quadraticCurveTo(cx + cellSize * 0.12, cy + cellSize * 0.32, cx, cy + cellSize * 0.38);
                ctx.quadraticCurveTo(cx - cellSize * 0.12, cy + cellSize * 0.32, cx, cy + cellSize * 0.1);
                ctx.fill();
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`'日射し x=' + (iciSunX() + 1)`),
        [K.ONE, K.INFO_ALGO, `            氷柱碁: 盤を巡る陽射しに二度晒されると石は溶ける<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '陽射しが盤を西から東へ1列ずつ巡る (光の帯が現在位置)。',
            '日の当たる列の氷柱は熱を浴び、二度晒されると溶けて消える — アゲハマにはならない。',
            '陽の巡りを読んで置くか、日陰側に連を逃がすか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        st.melt = {};
        assert('日は巡る', iciSunX() === history.length % BOARD_SIZE);
        // 陽の列の石は熱を浴びる (初手後の陽列は x=1)
        board.fill(0); pieces = []; history.length = 0; st.melt = {};
        board[I(1, 3)] = 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: 0 }] }, 2);
        assert('一度晒される', (st.melt[I(1, 3)] || 0) === 1 && board[I(1, 3)] === 1);
        // 二度目で溶ける
        history.length = BOARD_SIZE; // 次の手で再び x=1 が陽の列
        executeMove({ cells: [{ x: BOARD_SIZE - 2, y: 0 }] }, 2);
        assert('二度晒されると溶ける', board[I(1, 3)] === 0);
    `,
};
