// UCHIAGEGO — 花火碁: 各側8手目の着手は花火玉。打ち上がって4斜めの空点に開く (領地になる)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
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
const ST_INIT = `{ cnt: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'uchiagego.html',
    en: 'UCHIAGEGO',
    jp: '花火碁',
    prefix: 'uchiagego',
    desc: '各側8手目は打ち上げ花火。石が上空で開き、4斜めの空点に自石が咲く。',
    kind: 'stone',
    icon: 'uchiagego',
    spec: [
        ...K.rb('UCHIAGEGO', '花火碁', 'uchiagego'),
        ...ST(ST_INIT),
        // 各側8手目の着手は花火玉: 打ち上がって4斜めの空点に自石が開く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 花火碁: 8手ごとの着手は花火玉 — 打ち上がり4斜めに開く
            st.cnt[player] = (st.cnt[player] || 0) + 1;
            if (st.cnt[player] % 8 === 0) {
                const bc = move.cells[0];
                const ci = bc.y * BOARD_SIZE + bc.x;
                board[ci] = 0; // 玉は打ち上がって消える
                pieces = pieces.filter(pc => !(pc.cells.length === 1 && pc.cells[0].x === bc.x && pc.cells[0].y === bc.y));
                fxGlow(ci, '#fbbf24', 800);
                fxText(ci, '打ち上げ!', '#fbbf24', 1100);
                fxShake(4, 300);
                [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
                    const nx = bc.x + dx, ny = bc.y + dy;
                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                    const i0 = ny * BOARD_SIZE + nx;
                    if (board[i0] !== 0) return;
                    board[i0] = player;
                    if (getLiberties(board, i0) === 0) { board[i0] = 0; return; } // 開けない場所では散る
                    fxBurst(i0, '#f472b6', 8, 1.4);
                    fxBurst(i0, '#fbbf24', 4, 1.0);
                });
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'花火まで ' + (8 - ((st.cnt[turn] || 0) % 8)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            花火碁: 各側8手目の着手は花火玉。打ち上がって4斜めの空点に自石が咲く<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの8手目ごとの着手は「花火玉」。石は上空に打ち上がって消え、',
            '着地点の4斜めの空点に自石が開いて咲く (呼吸点のない場所には開かない)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.cnt = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 8手目 = 花火玉
        assert('玉は打ち上がって消える', board[5 * BOARD_SIZE + 5] === 0);
        assert('4斜めに自石が咲く', board[4 * BOARD_SIZE + 4] === 1 && board[4 * BOARD_SIZE + 6] === 1
            && board[6 * BOARD_SIZE + 4] === 1 && board[6 * BOARD_SIZE + 6] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('通常着手も動く', board[9 * BOARD_SIZE + 9] === 2);
    `,
};
