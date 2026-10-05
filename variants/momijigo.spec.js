// MOMIJIGO — 紅葉碁: 石は楓。時が経つほど紅く色づき、古い石ほど終局時の得点が高い
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
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
module.exports = {
    file: 'momijigo.html',
    en: 'MOMIJIGO',
    jp: '紅葉碁',
    prefix: 'momijigo',
    desc: '楓の石は時が経つほど紅く色づく — 古い石ほど終局時に高い得点。',
    kind: 'stone',
    icon: 'momijigo',
    spec: [
        ...K.rb('MOMIJIGO', '紅葉碁', 'momijigo'),
        K.params([
            { key: 'age1', label: '青→紅になる手数', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'age2', label: '深紅になる手数', min: 5, max: 30, def: 12, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST('{ born: {} }'),
        // 着手時に石の生成手を記録する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 紅葉碁: 石の生成手を記録し、色の階調を得点にする
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.born[mi] = history.length;
                for (const k in st.born) if (board[k] === 0 || board[k] === 3) delete st.born[k];
            }

            turn = opponent;`],
        // 色づき度合いで得点: 5手以上+1目、12手以上+2目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            for (const k in st.born) {
                const cell = +k;
                const age = history.length - st.born[k];
                const bonus = age >= (P('age2') || 12) ? 2 : age >= (P('age1') || 5) ? 1 : 0;
                if (board[cell] === 1) territory.black += bonus;
                else if (board[cell] === 2) territory.white += bonus;
            }`],
        // 紅葉は紅の輪で描く (古いほど深紅)
        ...K.STONE_MARKS_SPEC(`            // 紅葉: 石の色づき具合を紅の輪で描く
            {
                ctx.save();
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const age = history.length - st.born[k];
                    if (age < (P('age1') || 5)) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const deep = age >= (P('age2') || 12);
                    ctx.strokeStyle = deep ? 'rgba(153,27,27,0.95)' : 'rgba(239,68,68,0.8)';
                    ctx.lineWidth = Math.max(1.5, cellSize * (deep ? 0.09 : 0.06));
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.stroke();
                    if (deep) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.2, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            紅葉碁: 楓は時が経つほど紅く色づく — 古い石ほど終局時の得点が高い<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いた石は着手から5手で色づき始め、終局時+1目。12手以上で深紅となり+2目。',
            '色づく前に取られれば価値は残らない — 序盤の石を守り抜くことが得。',
            '長持ちするほど得る。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.born = {};
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('生まれた手が記録される', st.born[I(4, 4)] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('石が置かれる', board[I(4, 4)] === 1 && board[I(9, 9)] === 2);
        history.length = 20;
        board[I(4, 4)] = 0;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('取られた石の記録は消える', st.born[I(4, 4)] === undefined);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 2) === true);
    `,
};
