// OKAGEGO — お陰碁: 中央5x5の神域に参拝(着手)するたび福が+2点たまる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ fortune: { 1: 0, 2: 0 } }`;
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
module.exports = {
    file: 'okagego.html',
    en: 'OKAGEGO',
    jp: 'お陰碁',
    prefix: 'okagego',
    desc: '中央5x5は神域。神域へ参拝(着手)するたび福が+2点たまる。',
    kind: 'stone',
    icon: 'okagego',
    spec: [
        ...K.rb('OKAGEGO', 'お陰碁', 'okagego'),
        K.params([
            { key: 'okage_bonus', label: 'おかげ参りの得点', min: 0, max: 6, def: 2, unit: '点' },
            { key: 'zone_r', label: '神域の広さ (半径)', min: 1, max: 4, def: 2, unit: 'マス' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 神域一覧ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 神域: 天元を囲む5x5
        function okageZone() {
            const c = Math.floor(BOARD_SIZE / 2);
            const r = Math.max(1, P('zone_r') || 2);
            const cells = new Set();
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                const x = c + dx, y = c + dy;
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) cells.add(y * BOARD_SIZE + x);
            }
            return cells;
        }

        function endGameByScore() {`],
        // 採点に福を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.fortune[1];
            const whiteTotal = territory.white + captures[2] + komi + st.fortune[2];`],
        // おかげ参り: 神域への着手ごとに福+2
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // おかげ参り: 着手点が神域なら福が+2
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (okageZone().has(cell)) {
                    st.fortune[player] += (P('okage_bonus') || 2);
                    fxGlow(cell, '#f0abfc', 800);
                    fxText(cell, 'おかげ +' + (P('okage_bonus') || 2), '#f0abfc', 1000);
                }
            }

            turn = opponent;`],
        // 神域を淡い社色で塗る
        K.CUE_GRID(`            // お陰: 中央5x5の神域を淡く塗る
            {
                ctx.save();
                okageZone().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    ctx.fillStyle = 'rgba(192,38,211,0.08)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                const c = Math.floor(BOARD_SIZE / 2);
                const rr = Math.max(1, P('zone_r') || 2) + 0.5;
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.strokeStyle = 'rgba(192,38,211,0.45)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.strokeRect(cx - cellSize * rr, cy - cellSize * rr, cellSize * rr * 2, cellSize * rr * 2);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'福: 黒' + st.fortune[1] + ' 白' + st.fortune[2]`),
        [K.ONE, K.INFO_BASE, `            お陰碁: 中央5x5は神域。神域に着手 (おかげ参り) するたび福が+2点たまる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央の5x5は神域。自分の着手が神域の中に入るたび、福が+2点たまる。',
            '福は盤面が変わっても減らない蓄積点。参るほど徳が積む。双方同じ条件。',
            '神域の石自体は普通に取られ得る — 参るだけでは守れない。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        st.fortune = { 1: 0, 2: 0 };
        assert('神域は25マス', okageZone().size === 25);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('神域参拝で福+2', st.fortune[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('神域外は福なし', st.fortune[1] === 2);
        executeMove({ cells: [{ x: c + 2, y: c }] }, 2);
        assert('白も同条件で+2', st.fortune[2] === 2);
    `,
};
