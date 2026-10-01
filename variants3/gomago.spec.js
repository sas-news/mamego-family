// GOMAGO — 護摩碁: 中央3x3の護摩壇に自石(護摩木)を3本置くと焚き上がり+4点
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
const ST_INIT = `{ goma: { 1: 0, 2: 0 } }`;
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
    file: 'gomago.html',
    en: 'GOMAGO',
    jp: '護摩碁',
    prefix: 'gomago',
    desc: '中央3x3は護摩壇。自分の護摩木(石)が3本たまると焚き上がって+4点。',
    kind: 'stone',
    icon: 'gomago',
    spec: [
        ...K.rb('GOMAGO', '護摩碁', 'gomago'),
        K.params([
            { key: 'dan_radius', label: '護摩壇の広さ (半径)', min: 0, max: 2, def: 1 },
            { key: 'goma_need', label: '点火に必要な護摩木', min: 1, max: 9, def: 3, unit: '本' },
            { key: 'goma_bonus', label: '焚き上げ得点', min: 0, max: 12, def: 4, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 護摩壇一覧ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 護摩壇: 天元を囲む3x3
        function gomaDan() {
            const c = Math.floor(BOARD_SIZE / 2);
            const r = Math.max(0, P('dan_radius') ?? 1);
            const cells = [];
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                const x = c + dx, y = c + dy;
                if (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) cells.push(y * BOARD_SIZE + x);
            }
            return cells;
        }

        function endGameByScore() {`],
        // 採点に願い点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.goma[1];
            const whiteTotal = territory.white + captures[2] + komi + st.goma[2];`],
        // 焚き上げ: 着手後に護摩壇の自石が3本以上あれば全て焚いて+4
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 護摩の焚き上げ: 護摩壇の自分の護摩木が3本以上で点火、全て焼けて願い+4
            {
                const dan = gomaDan();
                const mine = dan.filter(i => board[i] === player);
                if (mine.length >= (P('goma_need') || 3)) {
                    mine.forEach(i => {
                        board[i] = 0;
                        fxBurst(i, '#fb923c', 9, 1.4);
                        fxSplash(i, '#fbbf24', 5);
                    });
                    const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                    fxGlow(cc, '#fdba74', 800);
                    fxText(cc, '護摩焚き +' + (P('goma_bonus') || 4), '#fb923c', 1300);
                    fxShake(4, 300);
                    st.goma[player] += (P('goma_bonus') || 4);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 護摩壇を壇色で塗る
        K.CUE_GRID(`            // 護摩壇: 中央3x3を朱色の壇として塗る
            {
                ctx.save();
                gomaDan().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    ctx.fillStyle = 'rgba(154,52,18,0.14)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.strokeStyle = 'rgba(194,65,12,0.6)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.strokeRect(cx - cellSize * 1.5, cy - cellSize * 1.5, cellSize * 3, cellSize * 3);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'願い点 黒' + st.goma[1] + ' 白' + st.goma[2]`),
        [K.ONE, K.INFO_ALGO, `            護摩碁: 中央3x3は護摩壇。自分の護摩木(石)が3本たまると焚き上がって消え、+4点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の3x3は護摩壇。自分の着手後に壇の中の自分の石(護摩木)が3本以上あれば点火する。',
            '焚き上がった護摩木は全て燃えて盤から消え (アゲハマにはならない)、願いが叶って+4点。',
            '壇は中央1か所だけ。相手に焼かれる前に割り込まれてもよい。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        st.goma = { 1: 0, 2: 0 };
        assert('護摩壇は9マス', gomaDan().length === 9);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[(c - 1) * B + c] = 1; board[c * B + c] = 1; // 壇に黒2本
        executeMove({ cells: [{ x: c + 1, y: c }] }, 1); // 3本目 → 焚き上げ
        assert('護摩木は燃え尽きる', board[(c - 1) * B + c] === 0 && board[c * B + c] === 0 && board[c * B + c + 1] === 0);
        assert('願いが叶って+4', st.goma[1] === 4);
        board[(c - 1) * B + (c - 1)] = 2; // 白は2本では足りない
        board[c * B + (c - 1)] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('2本では焚き上がらない', st.goma[2] === 0 && board[(c - 1) * B + (c - 1)] === 2);
    `,
};
