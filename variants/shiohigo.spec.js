// SHIOHIGO — 潮干碁: 干潮の間だけ浜 (下2列) に置ける。満潮になると浜の石は拾われて持ち主+1目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ dug: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'shiohigo.html',
    en: 'SHIOHIGO',
    jp: '潮干碁',
    prefix: 'shiohigo',
    desc: '干潮 (12手周期) の間だけ浜に置ける。満潮で浜の石は拾われ持ち主+1目。',
    kind: 'stone',
    icon: 'shiohigo',
    spec: [
        ...K.rb('SHIOHIGO', '潮干碁', 'shiohigo'),
        K.params([
            { key: 'tide_cycle', label: '潮の周期', min: 4, max: 24, def: 12, step: 2, unit: '手' },
            { key: 'low_tide', label: '干潮の長さ', min: 1, max: 12, def: 6, unit: '手' },
            { key: 'dug_pts', label: '拾い得点', min: 0, max: 5, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 浜: 下2列 (潮の満ち引きで置けたり拾われたりする)
        const HAMA_SET = new Set();
        {
            for (let x = 0; x < BOARD_SIZE; x++) {
                HAMA_SET.add((BOARD_SIZE - 2) * BOARD_SIZE + x);
                HAMA_SET.add((BOARD_SIZE - 1) * BOARD_SIZE + x);
            }
        }
        // 12手周期: 0-5=干潮 (浜に置ける)、6-11=満潮 (置けない)
        function shiohigariOpen() { return history.length % (P('tide_cycle') || 12) < (P('low_tide') || 6); }`],
        // 満潮時は浜に置けない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 満潮時は浜に立ち入れない
                if (HAMA_SET.has(p.y * BOARD_SIZE + p.x) && !shiohigariOpen()) return false;
            }`],
        // 満潮の上げ潮: 浜の石は拾われて持ち主+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 潮干狩り: 満潮 (周期6) になった瞬間、浜の石は拾われて持ち主+1目
            if (history.length % (P('tide_cycle') || 12) === (P('low_tide') || 6)) {
                let dug = 0;
                HAMA_SET.forEach(i => {
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        st.dug[v] += (P('dug_pts') ?? 1);
                        board[i] = 0;
                        fxSplash(i, '#7dd3fc', 8);
                        fxText(i, '拾った!', '#0ea5e9', 1000);
                        dug++;
                    }
                });
                if (dug) {
                    cleanUpPieces();
                    fxShake(3, 260);
                }
            }

            turn = opponent;`],
        // 拾った貝を得点へ
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 潮干ルール: 拾った貝は+1目ずつ加算済み
            territory.black += st.dug[1];
            territory.white += st.dug[2];`],
        // 浜の描画: 湿った砂と引き波
        K.CUE_GRID(`            // 浜: 砂色の帯 (満潮時は水色に)
            {
                const open = shiohigariOpen();
                ctx.save();
                ctx.fillStyle = open ? 'rgba(222, 197, 140, 0.22)' : 'rgba(56, 189, 248, 0.22)';
                HAMA_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`shiohigariOpen() ? '干潮 (浜に置ける)' : '満潮 (浜は立入禁止)'`),
        [K.ONE, K.INFO_BASE, `            潮干碁: 干潮の間だけ浜に置ける。満潮で浜の石は拾われ持ち主+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '下2列は「浜」。12手周期で干潮 (置ける) と満潮 (置けない) が繰り返す。',
            '満潮になった瞬間、浜の石は全て拾われて持ち主に+1目ずつ。拾わせる石を蒔くか、相手の貝を獲るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('浜は2列分', HAMA_SET.size === BOARD_SIZE * 2);
        board.fill(0); pieces = []; history.length = 0; st.dug = { 1: 0, 2: 0 };
        const beach = [...HAMA_SET][0];
        const bx = beach % BOARD_SIZE, by = (beach / BOARD_SIZE) | 0;
        assert('干潮時は浜に置ける', isValidPlacement([{ x: bx, y: by }], 1) === true);
        board[beach] = 1;
        history.push({}, {}, {}, {}, {}); // length=5 → まだ干潮
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // history=6 → 満潮: 拾う
        assert('満潮で貝が拾われた', board[beach] === 0 && st.dug[1] === 1);
        assert('満潮時は浜に置けない', isValidPlacement([{ x: bx, y: by }], 1) === false);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
