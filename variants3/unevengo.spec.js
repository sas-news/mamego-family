// UNEVENGO — 非対称碁: 先手(黒)は毎手+1石の「数」で、後手(白)は1石連が取られない「強さ」で戦う
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
module.exports = {
    file: 'unevengo.html',
    en: 'UNEVENGO',
    jp: '非対称碁',
    prefix: 'unevengo',
    desc: '非対称ルール: 黒は毎手+1石の数で、白は1石連が不屈の強さで戦う。コミなし。',
    kind: 'stone',
    icon: 'unevengo',
    spec: [
        ...K.rb('UNEVENGO', '非対称碁', 'unevengo'),
        // 非対称: コミなし
        [K.ONE, 'let komi = 6.5;', 'let komi = 0;'],
        // 黒は毎手+1石 (数の勢力)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 非対称: 黒は着手ごとに隣の空点へ+1石 (数で押す勢力)
            if (player === 1) {
                const bi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                for (const nb of getNeighbors(bi)) {
                    if (board[nb] !== 0) continue;
                    board[nb] = 1;
                    if (getCapturedStones(board, 1).length === 0) {
                        pieces.push({ id: Date.now() + Math.random(), player: 1, type: move.type, rot: move.rot, cells: [{ x: nb % BOARD_SIZE, y: Math.floor(nb / BOARD_SIZE) }] });
                        break;
                    }
                    board[nb] = 0;
                }
            }`],
        // 白は1石連が取られない (不屈の強さ)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 白の1石連はどう囲んでも取られない (盤面を変える前に連の大きさを確定する)
                const keepSet = new Set();
                if (opponent === 2) {
                    captured.forEach(idx => {
                        const g = new Set([idx]);
                        const q = [idx];
                        while (q.length) {
                            const c2 = q.pop();
                            getNeighbors(c2).forEach(n2 => {
                                if (board[n2] === 2 && !g.has(n2)) { g.add(n2); q.push(n2); }
                            });
                        }
                        if (g.size === 1) keepSet.add(idx);
                    });
                }
                captured.forEach(idx => {
                    if (keepSet.has(idx)) return;
                    board[idx] = 0;
                    captures[player]++;
                });
                if (keepSet.size) {
                    keepSet.forEach(i2 => fxText(i2, '不屈!', '#fbbf24', 1000));
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`turn === 1 ? '黒:毎手+1石' : '白:1石連は不屈'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            非対称碁: 黒は毎手+1石の「数」、白は1石連が取られない「強さ」。コミなし<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '非対称ルール: 黒は着手ごとに隣の空点へ+1石。広がる速度は倍。',
            '白は「1石連の石は決して取られない」不屈の強さを持つ。',
            '数の黒か質の白か。コミはなし。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒の着手は2石になる
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('黒は毎手2石', board.filter(v => v === 1).length === 2);
        // 白の1石連は取られない
        board[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('白の1石連は不屈', board[4 * BOARD_SIZE + 4] === 2);
        assert('取られなかったのでアゲハマ0', captures[1] === 0);
        // 白の2石連は普通に取れる
        board[8 * BOARD_SIZE + 8] = 2; board[8 * BOARD_SIZE + 9] = 2; // 白2石連 (8,8)-(9,8)
        board[7 * BOARD_SIZE + 8] = 1; board[7 * BOARD_SIZE + 9] = 1; // 上側 (8,7)-(9,7)
        board[8 * BOARD_SIZE + 7] = 1; board[8 * BOARD_SIZE + 10] = 1; // 左右 (7,8)-(10,8)
        board[9 * BOARD_SIZE + 8] = 1; // 下側 (8,9)
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 最後の呼吸点 (9,9)
        assert('白の連は取れる', board[8 * BOARD_SIZE + 8] === 0 && captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
