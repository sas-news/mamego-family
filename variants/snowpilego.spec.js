// SNOWPILEGO — 積雪碁: 30手ごとに雪で全石が埋まり (地形化)、15手後の春に解けて復活する
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ snow: {} }`;
module.exports = {
    file: 'snowpilego.html',
    en: 'SNOWPILEGO',
    jp: '積雪碁',
    prefix: 'snowpilego',
    desc: '30手ごとの大雪で全石が埋まり地形化。15手後の春に解けて復活する。',
    kind: 'stone',
    icon: 'snowpilego',
    spec: [
        ...K.rb('SNOWPILEGO', '積雪碁', 'snowpilego'),
        K.params([
            { key: 'snow_cycle', label: '雪の周期', min: 10, max: 80, def: 30, step: 2, unit: '手', hint: '半分で雪解け' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 雪による埋没と春の復活
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 大雪: 30手ごとに全石が雪に埋まる (1個だけ残る)
            if (history.length > 0 && history.length % (P('snow_cycle') || 30) === 0) {
                const stones = [];
                board.forEach((v, i) => { if (v === 1 || v === 2) stones.push(i); });
                stones.forEach((i, k) => {
                    if (k === 0) return; // 先頭の1個は残る
                    st.snow[i] = board[i];
                    board[i] = 4; // 雪に埋もれた地形
                });
                if (stones.length > 1) {
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '大雪!', '#93c5fd', 1400);
                    cleanUpPieces();
                }
            }
            // 春: 埋まった石が解けて復活
            if (history.length > 0 && history.length % (P('snow_cycle') || 30) === Math.floor((P('snow_cycle') || 30) / 2)) {
                let revived = 0;
                Object.keys(st.snow).forEach(k => {
                    const i = +k;
                    if (board[i] === 4) { board[i] = st.snow[k]; revived++; }
                    delete st.snow[k];
                });
                if (revived > 0) {
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '雪解け!', '#86efac', 1400);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`history.length % (P('snow_cycle') || 30) < Math.floor((P('snow_cycle') || 30) / 2) ? '雪期' : '雪予報' + ((P('snow_cycle') || 30) - (history.length % (P('snow_cycle') || 30)))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            積雪碁: 30手毎に大雪で全石が埋まり (打てなくなる)、15手後に解けて復活<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '30手ごとに大雪: 全ての石が雪に埋まり、埋まった所には打てなくなる (先頭の1石だけ残る)。',
            '雪が積もってから15手後に解け、埋まっていた石が元の色で復活する。',
            '埋まる前に取り切るか、春の復活を見越して布石するかの季節ゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.snow = {};
        [[5, 5], [6, 5], [10, 10]].forEach(([x, y]) => {
            board[y * BOARD_SIZE + x] = 1;
            pieces.push({ p: 1, cells: [{ x, y }] });
        });
        history.length = 29;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('先頭以外の石が埋まる', board[5 * BOARD_SIZE + 6] === 4);
        assert('埋まった石はst.snowに', st.snow[5 * BOARD_SIZE + 6] === 1);
        assert('埋まった所は打てない', !isValidPlacement([{ x: 6, y: 5 }], 1));
        history.length = 44; // 30周期の15 (雪解け)
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('春に復活', board[5 * BOARD_SIZE + 6] === 1);
    `,
};
