// URUUGO — 閏年碁: 4手ごとに閏が入り、打った側がもう一手打てる (閏は白黒交互に巡る)
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
const ST_INIT = `{ pcnt: 0 }`;
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
    file: 'uruugo.html',
    en: 'URUUGO',
    jp: '閏年碁',
    prefix: 'uruugo',
    desc: '4手ごとに閏が入り、打った側がそのままもう一手打てる。閏は白黒交互に巡る。',
    kind: 'stone',
    icon: 'uruugo',
    spec: [
        ...K.rb('URUUGO', '閏年碁', 'uruugo'),
        K.params([
            { key: 'uruu_interval', label: '閏の間隔', min: 2, max: 12, def: 4, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 閏: 4手ごとに同じ側がもう一手 (pcntは全着手を数え、閏自身も数えるので閏は白黒交互)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 閏: 4手ごとに打った側がもう一手打てる
            st.pcnt++;
            if (st.pcnt % Math.max(1, P('uruu_interval') || 4) === 0) {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(cell, '#a3e635', 800);
                fxText(cell, '閏!', '#a3e635', 1200);
                turn = player;
            } else {
                turn = opponent;
            }`],
        ...K.EVENT_CHIP_SPEC(`'閏まで: ' + (Math.max(1, P('uruu_interval') || 4) - st.pcnt % Math.max(1, P('uruu_interval') || 4)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            閏年碁: 4手ごとに閏が入り、打った側がそのままもう一手打てる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手を数えて4手ごとに「閏」が入る。閏の手を打った側は、そのままもう一手打てる。',
            '閏の手も手数に数えるため、閏の権利は白と黒に交互に巡る — どちらか一方だけ得をしない。',
            '閏で取り・コウの処理は通常通り。連続2手は大きな攻めの機会。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.pcnt = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // p1
        assert('通常は手番交代', turn === 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2); // p2
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1); // p3
        executeMove({ cells: [{ x: 3, y: 0 }] }, 2); // p4 → 閏
        assert('4手目は閏で同一手番', turn === 2);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 2); // p5 閏の追着手
        assert('閏の後は交代', turn === 1);
        st.pcnt = 7;
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // p8 → 黒に閏
        assert('次の閏は黒側', turn === 1);
    `,
};
