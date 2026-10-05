// NASHGO — ナッシュ碁: 双方にとって最も得な「均衡点」が常に公開される。均衡点に置くと +2目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 }, nash: -1, nashFor: 0 }`;
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
// 均衡点スキャン: 石に隣接する空点のうち、両者の rateMove 合計が最大の点
const NASH_SCAN = `            // 均衡点: 両プレイヤーの評価合計が最大の空点 (石に隣接する点のみ走査)
            {
                const __cand = [];
                let __anyStone = false;
                for (let __i = 0; __i < board.length; __i++) {
                    if (board[__i] !== 1 && board[__i] !== 2) continue;
                    __anyStone = true;
                    const __x = __i % BOARD_SIZE, __y = (__i / BOARD_SIZE) | 0;
                    for (let __dy = -1; __dy <= 1; __dy++) for (let __dx = -1; __dx <= 1; __dx++) {
                        const __nx = __x + __dx, __ny = __y + __dy;
                        if (__nx < 0 || __ny < 0 || __nx >= BOARD_SIZE || __ny >= BOARD_SIZE) continue;
                        const __ni = __ny * BOARD_SIZE + __nx;
                        if (board[__ni] === 0) __cand.push(__ni);
                    }
                }
                if (!__anyStone) {
                    const __c = Math.floor(BOARD_SIZE / 2);
                    __cand.push(__c * BOARD_SIZE + __c);
                }
                let __best = -1, __bestScore = -Infinity;
                for (const __ci of __cand) {
                    const __cell = { x: __ci % BOARD_SIZE, y: (__ci / BOARD_SIZE) | 0 };
                    if (!isValidPlacement([__cell], opponent)) continue;
                    const __sc = rateMove([__cell], 1) + rateMove([__cell], 2);
                    if (__sc > __bestScore) { __bestScore = __sc; __best = __ci; }
                }
                st.nash = __best;
                st.nashFor = opponent;
            }`;
module.exports = {
    file: 'nashgo.html',
    en: 'NASHGO',
    jp: 'ナッシュ碁',
    prefix: 'nashgo',
    desc: '両者の評価が最大の「均衡点」が常時公開。その点に置くと +2目。',
    kind: 'stone',
    icon: 'nashgo',
    spec: [
        ...K.rb('NASHGO', 'ナッシュ碁', 'nashgo'),
        K.params([
            { key: 'nash_bonus', label: '均衡点ボーナス', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 均衡点に置いたら+2。その後、次の手番の均衡点を再計算して公開
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ナッシュ碁: 公開された均衡点への着手は +2目ボーナス
            {
                const __pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (__pi === st.nash && st.nashFor === player) {
                    st.bonus[player] = (st.bonus[player] || 0) + (P('nash_bonus') || 2);
                    fxText(__pi, '均衡点 +' + (P('nash_bonus') || 2), '#fbbf24', 1100);
                    fxGlow(__pi, '#fbbf24', 900);
                }
            }

${NASH_SCAN}

            turn = opponent;`],
        // 均衡点マーカー
        ...K.STONE_MARKS_SPEC(`            if (st.nash >= 0 && board[st.nash] === 0) {
                const __x = st.nash % BOARD_SIZE, __y = (st.nash / BOARD_SIZE) | 0;
                const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize;
                ctx.save();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(__cx, __cy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        [K.ONE, K.INFO_BASE, `            ナッシュ碁: 両者にとって最善の「均衡点」が ◎ で公開される。置くと +2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤上で両プレイヤーの評価合計が最大の点が「均衡点」として ◎ 表示される (毎手再計算)。',
            '均衡点に置いた側は +2目ボーナス。相手も同じ点を見ている — 読み合いが均衡に収束する碁。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, nash: -1, nashFor: 0 };
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('着手後に均衡点が計算される', st.nash >= 0 && st.nashFor === 2);
        // 均衡点を強制的に既知の点にして白が置く
        st.nash = 3 * BOARD_SIZE + 3; st.nashFor = 2;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('均衡点への着手は+2目', st.bonus[2] === 2);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('均衡点以外はボーナスなし', st.bonus[1] === 0);
    `,
};
