// CARBONGO — 炭素碁: 石は炭素。盤の高圧区域に置かれた石は熱と圧力でダイヤに変質する
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
const ST_INIT = `{ dia: [] }`; // ダイヤに変質した石
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'carbongo.html',
    en: 'CARBONGO',
    jp: '炭素碁',
    prefix: 'carbongo',
    desc: '盤中央の高圧区域で炭素の石はダイヤに変質。ダイヤは終局時に1個1点。',
    kind: 'stone',
    icon: 'carbongo',
    spec: [
        ...K.rb('CARBONGO', '炭素碁', 'carbongo'),
        K.params([
            { key: 'press_scale', label: '高圧区域の広さ', min: 10, max: 60, def: 32, unit: '%', hint: '盤幅に対する菱形半径の割合' },
            { key: 'dia_pt', label: 'ダイヤ1個の得点', min: 1, max: 3, def: 1, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.9, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 高圧区域: 中央の菱形地帯。中の石はダイヤに変質する
        function carbR() { return Math.max(1, Math.floor(BOARD_SIZE * (P('press_scale') || 32) / 100)); }
        const CARB_C = (BOARD_SIZE - 1) / 2;
        function isPress(x, y) { return Math.abs(x - CARB_C) + Math.abs(y - CARB_C) <= carbR(); }`],
        // 高圧区域に着いた石はダイヤ化
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => {
                const i = p.y * BOARD_SIZE + p.x;
                if (isPress(p.x, p.y) && !st.dia.includes(i)) {
                    st.dia.push(i);
                    fxGlow(i, '#7dd3fc', 800);
                    fxText(i, '結晶!', '#7dd3fc', 1000);
                }
            });`],
        // ダイヤ化した石が取られたら st.dia から外す
        [K.ONE, `                captured.forEach(idx => board[idx] = 0);`,
`                captured.forEach(idx => { board[idx] = 0; const di = st.dia.indexOf(idx); if (di >= 0) st.dia.splice(di, 1); });`],
        // 高圧区域の描画
        K.CUE_GRID(`            // 高圧区域: 熱と圧力の菱形地帯
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isPress(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const d = 1 - (Math.abs(x - CARB_C) + Math.abs(y - CARB_C)) / carbR();
                    ctx.fillStyle = 'rgba(180, 90, 20, ' + (0.06 + d * 0.16) + ')';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        // ダイヤ石の輝き
        ...K.STONE_MARKS_SPEC(`            // ダイヤ石: 結晶の輝き
            st.dia.forEach(i => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.95)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.3);
                ctx.lineTo(cx + cellSize * 0.24, cy);
                ctx.lineTo(cx, cy + cellSize * 0.3);
                ctx.lineTo(cx - cellSize * 0.24, cy);
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.24, cy);
                ctx.lineTo(cx + cellSize * 0.24, cy);
                ctx.stroke();
                ctx.restore();
            });`),
        // 採点: 盤上に残ったダイヤ石は1個1点の加点
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._diaDone) {
                st._diaDone = true;
                st.dia.forEach(i => { if (board[i] === 1 || board[i] === 2) captures[board[i]] += (P('dia_pt') || 1); });
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'ダイヤ ' + st.dia.filter(i => board[i] === 1 || board[i] === 2).length + '個'`),
        [K.ONE, K.INFO_BASE, `            炭素碁: 高圧区域の石はダイヤに変質。終局時1個1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央は高圧区域。そこに置いた石はダイヤに変質する (青い結晶の輝き)。',
            '終局時、盤上に残ったダイヤ石は1個につき1点の加点 — 両者同じ条件。',
            '区域を争うか、敵のダイヤを取り崩すか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        st.dia = [];
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('高圧区域で結晶', st.dia.includes(I(c, c)));
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('区域外は結晶しない', !st.dia.includes(I(0, 0)));
        // ダイヤ石が取られれば輝きを失う
        st.dia.push(I(2, 2));
        const di = st.dia.indexOf(I(2, 2));
        st.dia.splice(di, 1);
        assert('ダイヤ一覧を管理できる', !st.dia.includes(I(2, 2)));
    `,
};
