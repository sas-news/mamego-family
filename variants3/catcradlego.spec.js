// CATCRADLEGO — あやと碁: 自石2つ以上と敵石2つ以上に同時に触れる着手で「あやとり」の形ができて+1目
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
    file: 'catcradlego.html',
    en: 'CATCRADLEGO',
    jp: 'あやと碁',
    prefix: 'catcradlego',
    desc: '自石2つ+敵石2つに触れる交差着手であやとり完成、+1目。',
    kind: 'stone',
    icon: 'catcradlego',
    spec: [
        ...K.rb('CATCRADLEGO', 'あやと碁', 'catcradlego'),

        // あやとり: 2色の糸が交差する点に置くと形になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // あやと碁: 自石2つ以上と敵石2つ以上に触れる着手で+1目
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                let own = 0, foe = 0;
                getNeighbors(pi).forEach(n => {
                    if (board[n] === player) own++;
                    else if (board[n] === opponent) foe++;
                });
                if (own >= 2 && foe >= 2) {
                    captures[player] += 1;
                    fxGlow(pi, '#e879f9', 800);
                    fxText(pi, 'あやとり!', '#e879f9', 1200);
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            あやと碁: 自石2つ以上と敵石2つ以上に同時に触れる着手で「あやとり」完成、+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石が自分の石2つ以上と敵の石2つ以上に同時に触れると、糸が絡んだ「あやとり」の形になり+1目。',
            '両者同じ条件なので、相手の近くに形を作るほど相手にも糸口を渡す。',
            '密集した接触線で得点を重ねる綱引きの碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 十字の交差: 上下に黒、左右に白 → 中央に黒を置くとあやとり
        board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('あやとり完成で+1目', captures[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('絡まない着手は得点なし', captures[2] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
