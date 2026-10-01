// OMENEGO — 面隠碁: 各側4手ごとの着手はお面石。盤上は自分の石として振る舞うが終局時に敵色へ化ける
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 }, masks: { 1: [], 2: [] } }`;
module.exports = {
    file: 'omenego.html',
    en: 'OMENEGO',
    jp: '面隠碁',
    prefix: 'omenego',
    desc: '4手ごとの着手はお面石 — 自分の石として動くが、終局時に敵色へ化けて正体を現す。',
    kind: 'stone',
    icon: 'omenego',
    spec: [
        ...K.rb('OMENEGO', '面隠碁', 'omenego'),
        K.params([
            { key: 'mask_interval', label: 'お面石の周期', min: 2, max: 10, def: 4, unit: '手ごと' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),

        // お面石: 各側4手ごとの着手は正体隠し (終局で敵色に化ける)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 面隠碁: 4手ごとの自石はお面を被る (終局時に敵色へ化ける)
            st.pcnt[player]++;
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (st.pcnt[player] % Math.max(2, P('mask_interval') || 4) === 0) {
                    st.masks[player].push(pi);
                    fxText(pi, 'お面?', '#a78bfa', 1000);
                    fxGlow(pi, '#a78bfa', 700);
                }
            }

            turn = opponent;`],
        // 終局時: お面石が正体を現す (置いた側の敵の色に化ける)
        [K.ONE, `        function endGameByScore() {
            gameOver = true;`,
`        function endGameByScore() {
            // 面隠: お面石は正体を現す — 置いた側の敵の石になる
            [1, 2].forEach(pl => {
                (st.masks[pl] || []).forEach(i => {
                    if (board[i] === pl) {
                        board[i] = 3 - pl;
                        fxGlow(i, '#a78bfa', 900);
                    }
                });
            });
            cleanUpPieces();
            gameOver = true;`],
        // お面石にはお面の印
        ...K.STONE_MARKS_SPEC(`            // お面石には仮面マーク
            [1, 2].forEach(pl => {
                (st.masks[pl] || []).forEach(i => {
                    if (board[i] !== pl) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(167,139,250,0.85)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, cellSize * 0.22, cellSize * 0.16, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(30,20,50,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.09, cy, cellSize * 0.035, 0, Math.PI * 2);
                    ctx.arc(cx + cellSize * 0.09, cy, cellSize * 0.035, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            });`),
        ...K.EVENT_CHIP_SPEC(`'お面まで ' + ((P('mask_interval') || 4) - (st.pcnt[turn] || 0) % (P('mask_interval') || 4)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            面隠碁: 各側4手ごとの着手はお面石 — 盤上は自分の石だが終局時に敵色へ化ける<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各側4手ごとの着手は「お面石」。盤上では普通に自分の石として呼吸・連結する。',
            '終局 (パス・打ち切り) の瞬間、お面石は正体を現して相手の石に化ける — 地計算は化けた後。',
            'お面石を敵陣深くに置くと裏切りの楔になる。自陣に置けば化けても被害は小さい。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 3, 2: 0 }; st.masks = { 1: [], 2: [] };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 黒4手目 → お面石
        assert('お面石が記録される', st.masks[1].includes(6 * BOARD_SIZE + 6));
        assert('盤上では黒石のまま', board[6 * BOARD_SIZE + 6] === 1);
        endGameByScore(); // 終局で正体を現す
        assert('お面が化けて白石に', board[6 * BOARD_SIZE + 6] === 2);
        assert('終局する', gameOver === true);
    `,
};
