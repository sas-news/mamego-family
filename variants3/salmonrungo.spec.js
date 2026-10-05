// SALMONRUNGO — 鮭遡碁: 中央の川を遡る石。6手ごとに上流へ進み、源流に辿り着くと産卵して得点
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
const ST_INIT = `{ spawned: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'salmonrungo.html',
    en: 'SALMONRUNGO',
    jp: '鮭遡碁',
    prefix: 'salmonrungo',
    desc: '中央の川を石は遡る。6手ごとに上流へ進み、源流に着くと産卵+2目。',
    kind: 'stone',
    icon: 'salmonrungo',
    spec: [
        ...K.rb('SALMONRUNGO', '鮭遡碁', 'salmonrungo'),
        K.params([
            { key: 'run_interval', label: '遡上の間隔', min: 2, max: 12, def: 6, unit: '手' },
            { key: 'spawn_bonus', label: '産卵ボーナス', min: 0, max: 6, def: 2, unit: '目' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 川: 中央の横一列 (上流は x=0 側)
        const RIVER_Y = Math.floor(BOARD_SIZE / 2);`],
        // 遡上: 6手ごとに川の石が上流へ1つ進む。源流 (x=0) で産卵して消える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鮭の遡上: 6手ごとに川の石が上流へ。源流に着けば産卵+2目
            if (history.length > 0 && history.length % Math.max(1, P('run_interval') || 6) === 0) {
                let moved = 0;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = RIVER_Y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (x === 0) {
                        // 源流に到達: 産卵して川を去る
                        board[i] = 0;
                        st.spawned[v] += (P('spawn_bonus') ?? 2);
                        fxGlow(i, '#fb7185', 800);
                        fxText(i, '産卵!', '#f43f5e', 1100);
                        moved++;
                    } else if (board[i - 1] === 0) {
                        board[i - 1] = v;
                        board[i] = 0;
                        fxSlide(i, i - 1, 380);
                        moved++;
                    }
                }
                if (moved) cleanUpPieces();
            }

            turn = opponent;`],
        // 産卵集計
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 鮭遡ルール: 産卵した石は+2目ずつ加算済み
            territory.black += st.spawned[1];
            territory.white += st.spawned[2];`],
        // 川の描画: 中央の流れ
        K.CUE_GRID(`            // 川: 中央の流れ
            {
                const now = fxNow();
                const cy = padding + RIVER_Y * cellSize;
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const cx = padding + x * cellSize;
                    const ph = Math.sin(now / 500 - x * 0.9);
                    ctx.fillStyle = 'rgba(56, 189, 248,' + (0.15 + ph * 0.06) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                }
                // 源流の印
                ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
                ctx.beginPath();
                ctx.arc(padding, cy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'遡上まで ' + ((P('run_interval') || 6) - (history.length % (P('run_interval') || 6))) + ' 手 / 産卵 黒' + (st.spawned ? st.spawned[1] : 0) + ' 白' + (st.spawned ? st.spawned[2] : 0)`),
        [K.ONE, K.INFO_BASE, `            鮭遡碁: 中央の川の石は6手ごとに上流へ。源流に着くと産卵+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央は「川」。川の石は6手ごとに上流 (左) へ1つ進み、源流に辿り着くと産卵して盤を去り+2目。',
            '川の石も普通に取り合える。遡らせて稼ぐか、相手の鮭を獲るか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0; st.spawned = { 1: 0, 2: 0 };
        board[I(5, RIVER_Y)] = 1;
        history.push({}, {}, {}, {}, {});
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=6 → 遡上
        assert('川の石が上流へ進んだ', board[I(4, RIVER_Y)] === 1 && board[I(5, RIVER_Y)] === 0);
        history.push({}, {}, {}, {}, {});
        board[I(0, RIVER_Y)] = 2;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2); // 遡上 → 源流で産卵
        assert('源流で産卵した', st.spawned[2] === 2 && board[I(0, RIVER_Y)] === 0);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
    `,
};
