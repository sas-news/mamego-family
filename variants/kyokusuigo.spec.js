// KYOKUSUIGO — 曲水碁: 曲水 (川筋) を盃 (石) が流れる。岸の味方石と歌を結べば+2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
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
const ST_INIT = `{ uta: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'kyokusuigo.html',
    en: 'KYOKUSUIGO',
    jp: '曲水碁',
    prefix: 'kyokusuigo',
    desc: '曲水を盃が流れる。岸の味方石に触れれば歌が成り+2目。流れ着けば沈む。',
    kind: 'stone',
    icon: 'kyokusuigo',
    spec: [
        ...K.rb('KYOKUSUIGO', '曲水碁', 'kyokusuigo'),
        K.params([
            { key: 'uta_interval', label: '歌会の間隔', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'uta_pts', label: '歌成の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 曲水: 中央の1つ上の横一列 (下流は x 大側)
        const NAGARE_Y = Math.floor(BOARD_SIZE / 2) - 1;`],
        // 歌会始: 5手ごとに盃が歌を結び、残りは流れる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 曲水の宴: N手ごと — 盃が岸の味方石に触れれば歌が成り+N目で去る
            if (history.length > 0 && history.length % Math.max(1, P('uta_interval') || 5) === 0) {
                const sung = new Set();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = NAGARE_Y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2 || sung.has(i)) continue;
                    // 岸 (川以外) にいる同じ色の石と隣接していれば歌が成る
                    const shore = getNeighbors(i).find(n =>
                        Math.floor(n / BOARD_SIZE) !== NAGARE_Y && board[n] === v);
                    if (shore !== undefined) {
                        st.uta[v] += (P('uta_pts') ?? 2);
                        board[i] = 0;
                        board[shore] = 0;
                        sung.add(i); sung.add(shore);
                        fxGlow(i, '#f0abfc', 800);
                        fxText(i, '歌成!', '#d946ef', 1100);
                        fxGlow(shore, '#f0abfc', 800);
                    }
                }
                // 歌わなかった盃は下流へ (端に着けば沈む)
                for (let x = BOARD_SIZE - 1; x >= 0; x--) {
                    const i = NAGARE_Y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (x === BOARD_SIZE - 1) {
                        board[i] = 0; // 流れ着いて沈む
                    } else if (board[i + 1] === 0) {
                        board[i + 1] = v;
                        board[i] = 0;
                        fxSlide(i, i + 1, 380);
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 歌の加点
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 曲水ルール: 歌が成った盃は+2目ずつ加算済み
            territory.black += st.uta[1];
            territory.white += st.uta[2];`],
        // 川の描画: 緩やかな水流
        K.CUE_GRID(`            // 曲水: 薄紫の流れ
            {
                const now = fxNow();
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize;
                    const cy = padding + NAGARE_Y * cellSize;
                    const ph = Math.sin(now / 600 + x * 0.7);
                    ctx.fillStyle = 'rgba(192, 132, 252,' + (0.14 + ph * 0.05) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'歌会まで ' + (Math.max(1, P('uta_interval') || 5) - (history.length % Math.max(1, P('uta_interval') || 5))) + ' 手 / 歌 黒' + (st.uta ? st.uta[1] : 0) + ' 白' + (st.uta ? st.uta[2] : 0)`),
        [K.ONE, K.INFO_BASE, `            曲水碁: 曲水の盃は5手ごとに流れる。岸の味方石に触れれば歌が成り+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '中央の川筋は「曲水」。5手ごとに盃 (川の石) が下流へ流れ、岸にいる同色の石と隣り合えば歌が成り、両方消えて+2目。',
            '歌えず流れ着いた盃は沈むだけ。岸に詠み手を据えて盃を流せ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; st.uta = { 1: 0, 2: 0 };
        board[I(4, NAGARE_Y)] = 1;
        board[I(4, NAGARE_Y + 1)] = 1; // 岸の味方石
        history.push({}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=5 → 歌会
        assert('歌が成って両者消えた', board[I(4, NAGARE_Y)] === 0 && board[I(4, NAGARE_Y + 1)] === 0);
        assert('歌成+2目', st.uta[1] === 2);
        board.fill(0); pieces = []; history.length = 0;
        board[I(2, NAGARE_Y)] = 2;
        history.push({}, {}, {}, {});
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // history=5 → 流れ
        assert('歌えない盃は流れた', board[I(3, NAGARE_Y)] === 2 && board[I(2, NAGARE_Y)] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
