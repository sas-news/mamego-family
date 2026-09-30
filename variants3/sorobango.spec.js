// SOROBANGO — 算盤碁: 一列に自石が5つ並ぶと繰上り、全部取り除かれ桁点+5
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ carry: { 1: 0, 2: 0 } }`;
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
    file: 'sorobango.html',
    en: 'SOROBANGO',
    jp: '算盤碁',
    prefix: 'sorobango',
    desc: '石は算盤の珠。同じ列に自石が5つ並ぶと繰上り、その5石を払って桁点+5。',
    kind: 'stone',
    icon: 'sorobango',
    spec: [
        ...K.rb('SOROBANGO', '算盤碁', 'sorobango'),
        ...ST(ST_INIT),
        // 採点に桁点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.carry[1];
            const whiteTotal = territory.white + captures[2] + komi + st.carry[2];`],
        // 繰上り: 同じ列に自石5つで全て払って桁点+5
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 繰上り: 着手後、同じ列に自石が5つあれば全て払い桁点+5
            {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const col = [];
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        const i = y * BOARD_SIZE + x;
                        if (board[i] === player) col.push(i);
                    }
                    if (col.length >= 5) {
                        col.slice(0, 5).forEach(i => {
                            board[i] = 0;
                            fxBurst(i, '#fbbf24', 8);
                        });
                        st.carry[player] += 5;
                        cleanUpPieces();
                        fxText(col[2], '繰上り +5', '#fbbf24', 1300);
                        break; // 1手につき1列だけ繰上る
                    }
                }
            }

            turn = opponent;`],
        // 桁点をチップに
        ...K.EVENT_CHIP_SPEC(`'桁: 黒' + st.carry[1] + ' 白' + st.carry[2]`),
        [K.ONE, K.INFO_ALGO, `            算盤碁: 石は算盤の珠。同じ列に自石が5つ並ぶと繰上り、その5石を払って桁点+5<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手の直後、同じ縦列に自分の石が5つ以上並んでいれば、そのうち5つが払い出されて桁点+5。',
            '払い出された石は取り石にならず盤から消える — 列を開ける効果としても使える。',
            '繰上りは1手につき1列まで。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.carry = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        for (let y = 0; y < 4; y++) board[y * B + 3] = 1; // 3列目に黒4つ
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1); // 5つ目
        assert('5つで繰上り', st.carry[1] === 5);
        assert('珠は払い出される', board[3] === 0 && board[4 * B + 3] === 0);
        assert('取り石にならない', captures[2] === 0);
        for (let y = 0; y < 4; y++) board[y * B + 7] = 2;
        executeMove({ cells: [{ x: 7, y: 4 }] }, 2);
        assert('白も同条件で繰上る', st.carry[2] === 5);
    `,
};
