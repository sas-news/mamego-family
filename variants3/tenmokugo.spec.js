// TENMOKUGO — 天目碁: 天目の窯元点に着手すると曜変が起きる (呼吸+2/周囲の敵石弱化/+3目、等確率)
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
const ST_INIT = `{ yohen: { 1: 0, 2: 0 } }`;
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
    file: 'tenmokugo.html',
    en: 'TENMOKUGO',
    jp: '天目碁',
    prefix: 'tenmokugo',
    desc: '天目の窯元 (星位) への着手で曜変: 盤のどこかの敵石1個が消えるか即+3目。',
    kind: 'stone',
    icon: 'tenmokugo',
    spec: [
        ...K.rb('TENMOKUGO', '天目碁', 'tenmokugo'),
        K.params([
            { key: 'evap_prob', label: '敵石蒸発の確率', min: 0, max: 100, def: 50, unit: '%' },
            { key: 'score', label: '曜変の得点', min: 0, max: 10, def: 3, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 天目の窯元: 星の点 (天元を除く)
        function isTenmoku(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            const c = (BOARD_SIZE - 1) / 2;
            return getStarPoints(BOARD_SIZE).some(p => p.x === x && p.y === y) && !(x === c && y === c);
        }
        // 曜変: 敵石を1個蒸発させるか +3目 — 対象がなければ必ず+3目
        function yohen(player) {
            const opponent = player === 1 ? 2 : 1;
            const targets = [];
            for (let i = 0; i < board.length; i++) if (board[i] === opponent) targets.push(i);
            if (targets.length > 0 && Math.random() * 100 < (P('evap_prob') ?? 50)) {
                const t = targets[(Math.random() * targets.length) | 0];
                board[t] = 0;
                captures[player]++;
                cleanUpPieces();
                fxBurst(t, '#7c3aed', 12, 1.6);
                return '曜変: 敵石を蒸発';
            }
            captures[player] += (P('score') ?? 3);
            return '曜変: +3目';
        }`],
        // 着手が窯元なら曜変発動
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            const ti = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (isTenmoku(ti)) {
                const msg = yohen(player);
                st.yohen[player]++;
                fxText(ti, msg, '#7c3aed', 1300);
            }

            turn = opponent;`],
        // 窯元に天目の油滴を描く
        K.CUE_GRID(`            // 天目の窯元: 星位に油滴の虹輪
            {
                ctx.save();
                for (const p of getStarPoints(BOARD_SIZE)) {
                    const i = p.y * BOARD_SIZE + p.x;
                    if (!isTenmoku(i)) continue;
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.strokeStyle = 'rgba(124,58,237,0.5)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = 'rgba(124,58,237,0.35)';
                    ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.1, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'曜変 黒' + st.yohen[1] + ' / 白' + st.yohen[2]`),
        [K.ONE, K.INFO_BASE, `            天目碁: 星位の窯元 (天元を除く) へ着手すると曜変 — 敵石1個蒸発または+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星位 (天元を除く8点) は天目の窯元 — 虹の輪が目印。',
            '窯元に着手すると曜変が起きる: 敵石1個が蒸発 (アゲハマ化) か、即座に+3目。',
            '天目の神秘は双方平等 — 窯元を押さえて茶碗を焼け。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const sp = getStarPoints(BOARD_SIZE);
        const c = (BOARD_SIZE - 1) / 2;
        assert('星位は窯元', isTenmoku(I(sp[0].x, sp[0].y)) === true);
        assert('天元は窯元でない', isTenmoku(I(c, c)) === false);
        assert('星位以外は窯元でない', isTenmoku(I(0, 0)) === false);
        // 窯元への着手で曜変が発動する (敵石蒸発か+3目)
        board[I(6, 6)] = 2;
        const capBefore = captures[1] + captures[2];
        executeMove({ cells: [{ x: sp[0].x, y: sp[0].y }] }, 1);
        assert('曜変が発動した', st.yohen[1] === 1);
        assert('アゲハマか得点が増えた', captures[1] + captures[2] > capBefore || board[I(6, 6)] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 2) === true);
    `,
};
