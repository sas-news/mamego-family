// BOREGO — 削岩碁: 盤の外周は岩盤。岩に隣接する着手で削り取り、新しい空点を掘り開く
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
const ST_INIT = `{ bored: 0 }`;
module.exports = {
    file: 'borego.html',
    en: 'BOREGO',
    jp: '削岩碁',
    prefix: 'borego',
    desc: '盤の外周は岩盤で置けない。岩に隣接して置くと削り取られ、新しい着手点が掘れる。',
    kind: 'stone',
    icon: 'borego',
    spec: [
        ...K.rb('BOREGO', '削岩碁', 'borego'),
        K.params([
            { key: 'rock_layers', label: '岩盤の厚さ', min: 1, max: 4, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),

        // 初期盤: 外周を岩盤(3)で塞ぐ
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        const boreRock = () => {
            const rl = Math.max(1, Math.min(4, P('rock_layers') || 1));
            for (let k = 0; k < rl; k++) {
                for (let i = k; i < BOARD_SIZE - k; i++) {
                    board[k * BOARD_SIZE + i] = 3; board[(BOARD_SIZE - 1 - k) * BOARD_SIZE + i] = 3;
                    board[i * BOARD_SIZE + k] = 3; board[i * BOARD_SIZE + BOARD_SIZE - 1 - k] = 3;
                }
            }
        };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            boreRock();`],
        // 削岩: 岩に隣接した着手は岩を削る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 削岩碁: 置いた石に隣接する岩盤を削り取って空点にする
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(pi).forEach(n => {
                    if (board[n] === 3) {
                        board[n] = 0;
                        st.bored++;
                        fxBurst(n, '#a8a29e', 9, 1.5);
                        fxText(n, '削岩!', '#d6d3d1', 900);
                    }
                });
            }

            turn = opponent;`],
        // 岩盤の専用テクスチャ
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_ROCK('#57504a', '#2c2620'))],
        ...K.WALL_GUARD_SPEC,
        ...K.EVENT_CHIP_SPEC(`'削岩 ' + (st.bored || 0) + '箇所'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            削岩碁: 盤の外周は岩盤。岩に隣接して置くと削り取られ、新しい着手点が掘り開ける<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の外周は岩盤で最初は置けない (呼吸点にもならない)。',
            '石を岩に隣接して置くと削岩機が岩を削り、その点は以後普通の空点になる。',
            '掘るほど盤が広がる。縁取りの序列が掘り進みで変わる開拓の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        boreRock();
        assert('外周は岩盤', board[0] === 3 && board[BOARD_SIZE - 1] === 3 && board[BOARD_SIZE] === 3);
        assert('岩には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 岩(1,0),(0,1)を削る
        assert('岩が削られて空点に', board[1] === 0 && board[BOARD_SIZE] === 0);
        assert('掘った点には置ける', isValidPlacement([{ x: 0, y: 1 }], 1) === true);
    `,
};
