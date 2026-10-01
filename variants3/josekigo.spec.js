// JOSEKIGO — 定石碁: 序盤 (先着24手) に隅の定石域 (4線以内) へ置くと +1目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 } }`;
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
module.exports = {
    file: 'josekigo.html',
    en: 'JOSEKIGO',
    jp: '定石碁',
    prefix: 'josekigo',
    desc: '序盤24手のうちに隅の定石域へ置くと +1目。定石をなぞると互角に進む。',
    kind: 'stone',
    icon: 'josekigo',
    spec: [
        ...K.rb('JOSEKIGO', '定石碁', 'josekigo'),
        K.params([
            { key: 'joseki_turns', label: '定石域の有効手数', min: 8, max: 60, def: 24, unit: '手' },
            { key: 'joseki_pts', label: '定石ボーナス', min: 0, max: 4, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        // 定石域 (隅4線以内) への序盤着手 → +1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 定石碁: 序盤 (24手まで) に隅4線以内へ置くと定石ボーナス +1目
            {
                const __p = move.cells[0];
                const __e = BOARD_SIZE - 1;
                const __corner = (__p.x <= 3 || __p.x >= __e - 3) && (__p.y <= 3 || __p.y >= __e - 3);
                if (__corner && history.length <= (P('joseki_turns') || 24)) {
                    const __pi = __p.y * BOARD_SIZE + __p.x;
                    st.bonus[player] = (st.bonus[player] || 0) + (P('joseki_pts') ?? 1);
                    fxText(__pi, '定石 +' + (P('joseki_pts') ?? 1), '#f59e0b', 1000);
                    fxGlow(__pi, '#f59e0b', 700);
                }
            }

            turn = opponent;`],
        // 定石域の薄い帯 (隅のL字ゾーン)
        K.CUE_GRID(`            // 定石域: 四隅の4線ゾーンを薄い帯で示す
            {
                ctx.save();
                ctx.fillStyle = 'rgba(245,158,11,0.05)';
                const __w4 = 4 * cellSize;
                const __x0 = padding - cellSize / 2, __y0 = padding - cellSize / 2;
                const __x1 = padding + (BOARD_SIZE - 1) * cellSize + cellSize / 2;
                const __y1 = padding + (BOARD_SIZE - 1) * cellSize + cellSize / 2;
                ctx.fillRect(__x0, __y0, __w4, __w4);
                ctx.fillRect(__x1 - __w4, __y0, __w4, __w4);
                ctx.fillRect(__x0, __y1 - __w4, __w4, __w4);
                ctx.fillRect(__x1 - __w4, __y1 - __w4, __w4, __w4);
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`history.length <= (P('joseki_turns') || 24) ? '定石 +' + ((st.bonus && st.bonus[turn]) || 0) + '目' : ''`),
        [K.ONE, K.INFO_ALGO, `            定石碁: 序盤24手で隅の定石域に置くと +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '序盤 (全局24手まで) に四隅4線以内の「定石域」へ置くと +1目。',
            '定石をなぞるように隅から打つと互角以上に進む。中央への早期進出は無得点。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 隅の定石域
        assert('定石域で+1目', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 中央は対象外
        assert('中央はボーナスなし', st.bonus[2] === 0);
        executeMove({ cells: [{ x: BOARD_SIZE - 2, y: 2 }] }, 2); // 反対側の隅も対象
        assert('白も隅で+1目', st.bonus[2] === 1);
    `,
};
