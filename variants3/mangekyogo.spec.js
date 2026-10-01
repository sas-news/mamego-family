// MANGEKYOGO — 万華鏡碁: 置いた石は天元を中心に4重回転対称に写り、空いていれば自石が咲く
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
module.exports = {
    file: 'mangekyogo.html',
    en: 'MANGEKYOGO',
    jp: '万華鏡碁',
    prefix: 'mangekyogo',
    desc: '置いた石は中心で4重回転対称に写る。空いた位置に自石が咲いて模様になる。',
    kind: 'stone',
    icon: 'mangekyogo',
    spec: [
        ...K.rb('MANGEKYOGO', '万華鏡碁', 'mangekyogo'),
        // 万華鏡: 着地点を中心に90/180/270度回転した位置にも自石が写る (空点かつ呼吸できる場所のみ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 万華鏡碁: 配置が4重回転対称に写って模様になる
            {
                const bc = move.cells[0];
                const c = (BOARD_SIZE - 1) / 2;
                const dx = bc.x - c, dy = bc.y - c;
                const seen = new Set();
                [[-dy, dx], [-dx, -dy], [dy, -dx]].forEach(([rx, ry]) => {
                    const nx = c + rx, ny = c + ry;
                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                    const i0 = ny * BOARD_SIZE + nx;
                    if (seen.has(i0) || board[i0] !== 0) return;
                    seen.add(i0);
                    board[i0] = player;
                    if (getLiberties(board, i0) === 0) { board[i0] = 0; return; } // 写れない場所には写らない
                    fxGlow(i0, '#c084fc', 650);
                });
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            万華鏡碁: 置いた石は中心で4重回転対称に写る。空いた位置に自石が咲く<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は、天元を中心に90度ずつ回転した3つの対称位置にも写る。',
            '写り先が空いていて呼吸できる場所にだけ自石が咲く。対称軸上では重複して写らない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const c = (BOARD_SIZE - 1) / 2;
        executeMove({ cells: [{ x: c - 4, y: c - 3 }] }, 1); // (2,3) on 13路
        // 回転写り先: 90度=(c-dy, c+dx)=(c+3, c-4) / 180度=(c+4, c+3) / 270度=(c-3, c+4)
        assert('90度に写る', board[(c - 4) * BOARD_SIZE + (c + 3)] === 1);
        assert('180度に写る', board[(c + 3) * BOARD_SIZE + (c + 4)] === 1);
        assert('270度に写る', board[(c + 4) * BOARD_SIZE + (c - 3)] === 1);
        // 白の着手も同じく対称に写る
        executeMove({ cells: [{ x: c, y: 0 }] }, 2);
        assert('白の対称位置にも写る', board[(2 * c) * BOARD_SIZE + c] === 2);
    `,
};
