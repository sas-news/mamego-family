// EHOGO — 恵方碁: 恵方(北→東→南→西の外2列帯)が3手ごとに回る。恵方に置くと福+2点
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ ply: 0, fortune: { 1: 0, 2: 0 } }`;
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
    file: 'ehogo.html',
    en: 'EHOGO',
    jp: '恵方碁',
    prefix: 'ehogo',
    desc: '恵方 (北→東→南→西の外2列帯) が3手ごとに回る。恵方に向かって置くと福+2点。',
    kind: 'stone',
    icon: 'ehogo',
    spec: [
        ...K.rb('EHOGO', '恵方碁', 'ehogo'),
        ...ST(ST_INIT),
        // 恵方ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 恵方: 3手ごとに北→東→南→西の外2列帯が回る
        function ehoSide() { return Math.floor(st.ply / 3) % 4; }
        function ehoZoneCells() {
            const s = ehoSide(), cells = new Set();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const inZone =
                    (s === 0 && y < 2) || (s === 1 && x >= BOARD_SIZE - 2) ||
                    (s === 2 && y >= BOARD_SIZE - 2) || (s === 3 && x < 2);
                if (inZone) cells.add(y * BOARD_SIZE + x);
            }
            return cells;
        }

        function endGameByScore() {`],
        // 採点に福を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.fortune[1];
            const whiteTotal = territory.white + captures[2] + komi + st.fortune[2];`],
        // 恵方: 恵方帯への着手で福+2
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 恵方: 着手した点が今の恵方帯なら福+2
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (ehoZoneCells().has(cell)) {
                    st.fortune[player] += 2;
                    fxGlow(cell, '#fb923c', 800);
                    fxText(cell, '恵方 +2', '#fb923c', 1100);
                }
                st.ply++;
            }

            turn = opponent;`],
        // 恵方帯を淡く塗る
        K.CUE_GRID(`            // 恵方: 今の恵方帯 (外2列) を淡く塗る
            {
                ctx.save();
                ehoZoneCells().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    ctx.fillStyle = 'rgba(251,146,60,0.10)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'恵方: ' + ['北', '東', '南', '西'][ehoSide()]`),
        [K.ONE, K.INFO_ALGO, `            恵方碁: 恵方 (外2列帯) が3手ごとに北→東→南→西と回る。恵方に置くと福+2点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の外側2列の帯が恵方。3手ごとに北→東→南→西と時計回りに回る。',
            '自分の着手が今の恵方帯に入れば福+2点。福は採点に加算される蓄積点。',
            '恵方は双方共通 — 狙い所がぶつかりやすい辺を巡る争いになる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.ply = 0; st.fortune = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // 北帯
        assert('恵方着手で福+2', st.fortune[1] === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 中央は恵方ではない
        assert('帯の外は福なし', st.fortune[1] === 2);
        st.ply = 3; // これから東帯
        executeMove({ cells: [{ x: B - 1, y: 5 }] }, 2);
        assert('白も同条件で東帯に+2', st.fortune[2] === 2);
    `,
};
