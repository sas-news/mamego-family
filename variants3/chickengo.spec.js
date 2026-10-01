// CHICKENGO — 養鶏碁: 石は鶏。星の点 (餌場) に3手留まると卵を産み、卵は6手で孵化して新しい石になる
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
const ST_INIT = `{ sit: {}, eggs: {} }`;
module.exports = {
    file: 'chickengo.html',
    en: 'CHICKENGO',
    jp: '養鶏碁',
    prefix: 'chickengo',
    desc: '星の点は餌場。石が5手留まると隣に卵を産み、卵は6手で孵化して石になる。',
    kind: 'stone',
    icon: 'chickengo',
    spec: [
        ...K.rb('CHICKENGO', '養鶏碁', 'chickengo'),
        K.params([
            { key: 'sit_turns', label: '産卵までの滞留', min: 2, max: 10, def: 5, unit: '手' },
            { key: 'hatch_turns', label: '孵化までの手数', min: 2, max: 12, def: 6, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 卵のある空点への着手: 卵は食べられる (相手の卵なら+1取り)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const gi = p.y * BOARD_SIZE + p.x;
                if (st.eggs[gi]) {
                    if (st.eggs[gi].p !== player) {
                        captures[player]++; // 卵を食べた
                        fxText(gi, '卵ゲット!', '#fbbf24', 1000);
                    }
                    delete st.eggs[gi];
                }
                board[gi] = player;
            });`],
        // 餌場滞在カウント・産卵・孵化
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 餌場 (星の点): 同じ石が5手続けて留まると隣に卵を産む
            getStarPoints(BOARD_SIZE).forEach(pt => {
                const fi = pt.y * BOARD_SIZE + pt.x;
                const p = board[fi];
                if (p === 1 || p === 2) {
                    const s = st.sit[fi];
                    st.sit[fi] = { p, n: (s && s.p === p ? s.n + 1 : 1) };
                    if (st.sit[fi].n >= (P('sit_turns') || 5)) {
                        const free = getNeighbors(fi).filter(n => board[n] === 0 && !st.eggs[n]);
                        if (free.length > 0) {
                            st.eggs[free[0]] = { p, at: history.length };
                            fxGlow(fi, '#fbbf24', 1000);
                            fxText(fi, '産卵!', '#fbbf24', 1200);
                            st.sit[fi].n = 0;
                        }
                    }
                } else {
                    delete st.sit[fi];
                }
            });
            // 孵化: 産まれて6手で卵が石になる
            Object.keys(st.eggs).forEach(k => {
                const ei = +k;
                if (board[ei] !== 0) { delete st.eggs[k]; return; }
                if (history.length - st.eggs[k].at >= (P('hatch_turns') || 6)) {
                    board[ei] = st.eggs[k].p;
                    fxBurst(ei, '#fbbf24', 10, 1.6);
                    delete st.eggs[k];
                }
            });
            cleanUpPieces();

            turn = opponent;`],
        // 餌場リング + 卵の描画
        ...K.CUE_STARS(`
            // 餌場リング (星の点)
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
            getStarPoints(BOARD_SIZE).forEach(pt => {
                const cx = padding + pt.x * cellSize;
                const cy = padding + pt.y * cellSize;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                ctx.stroke();
            });
            // 卵
            Object.keys(st.eggs).forEach(k => {
                const ei = +k;
                const ex = padding + (ei % BOARD_SIZE) * cellSize;
                const ey = padding + Math.floor(ei / BOARD_SIZE) * cellSize;
                ctx.fillStyle = st.eggs[k].p === 1 ? 'rgba(60,60,60,0.9)' : 'rgba(255,255,240,0.95)';
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(ex, ey, cellSize * 0.2, cellSize * 0.26, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });`),
        ...K.EVENT_CHIP_SPEC(`'卵 ' + Object.keys(st.eggs).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            養鶏碁: 星の点は餌場。石が5手留まると卵を産み、6手で孵化して石になる<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点 (5箇所) は餌場。自分の石が餌場に5手続けて留まると、隣の空点に卵を産む。',
            '卵は6手で孵化してその色の石になる。',
            '卵のある空点に相手が着手すると卵を食べられる (+1取り)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.sit = {}; st.eggs = {};
        // 黒石を餌場 (3,3) に置き、別の点を打ち続ける
        board[3 * BOARD_SIZE + 3] = 1; pieces.push({ p: 1, cells: [{ x: 3, y: 3 }] });
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: 0, y: i }] }, (i % 2) + 1);
        assert('卵が産まれた', Object.keys(st.eggs).length === 1);
        const ei = +Object.keys(st.eggs)[0];
        assert('卵は餌場の隣', getNeighbors(3 * BOARD_SIZE + 3).includes(ei));
        // 相手が卵を食べる
        executeMove({ cells: [{ x: ei % BOARD_SIZE, y: Math.floor(ei / BOARD_SIZE) }] }, 2);
        assert('卵は食べられた', !st.eggs[ei] && captures[2] === 1);
        // 孵化を確認
        st.eggs[5 * BOARD_SIZE + 5] = { p: 1, at: history.length - 6 };
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('卵が孵化して石になる', board[5 * BOARD_SIZE + 5] === 1);
    `,
};
