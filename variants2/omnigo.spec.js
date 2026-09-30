// OMNIGO — 全能碁: 6手ごとにイベントが周期的に襲来する (侵攻→流星→全反転)
const K = require('../gen_kit.js');
module.exports = {
    file: 'omnigo.html',
    en: 'OMNIGO',
    jp: '全能碁',
    prefix: 'omnigo',
    desc: '6手ごとにイベント襲来。侵攻ブロック→流星で石消滅→全石反転の周期。',
    kind: 'stone',
    spec: [
        ...K.rb('OMNIGO', '全能碁', 'omnigo'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白, 3:侵攻ブロック
        let moveCount = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 全能碁: 6手ごとにイベント襲来 (侵攻石→流星→全反転の周期)
            moveCount++;
            if (moveCount % 6 === 0) {
                const ev = Math.floor(moveCount / 6) % 3;
                if (ev === 0) {
                    // 侵攻: 上端の空点に敵ブロックが出現
                    const tops = [];
                    for (let x = 0; x < BOARD_SIZE; x++) if (board[x] === 0) tops.push(x);
                    if (tops.length > 0) board[tops[Math.floor(Math.random() * tops.length)]] = 3;
                } else if (ev === 1) {
                    // 流星: 盤上の石がランダムに1つ消える
                    const stones = [];
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] === 1 || board[i] === 2) stones.push(i);
                    }
                    if (stones.length > 0) {
                        board[stones[Math.floor(Math.random() * stones.length)]] = 0;
                        cleanUpPieces();
                    }
                } else {
                    // 反転: 盤上の全石が色を入れ替える
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] === 1) board[i] = 2;
                        else if (board[i] === 2) board[i] = 1;
                    }
                    pieces.forEach(pc => { pc.player = pc.player === 1 ? 2 : 1; });
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('moveCount % 6 >= 4 ? "イベント接近" : ""'),
        ...K.WALL_SPEC,
        [K.ONE, K.INFO_ALGO, `            全能碁: 6手ごとにイベントが周期的に襲来する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとに天変地異が襲来する。周期は 侵攻ブロック出現 → 流星で石1個消滅 → 全石の色反転。',
            '反転で優勢がひっくり返る大盤荒れの碁。イベントの手数を読んで布石せよ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; moveCount = 5;
        board[3] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('流星で石が減る', board.filter(v => v === 1 || v === 2).length === 1);
        board.fill(0); pieces = []; moveCount = 11;
        board[0] = 1; board[5] = 2;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2);
        assert('全石が反転する', board[0] === 2 && board[5] === 1 && board[6 * BOARD_SIZE + 6] === 1);
        board.fill(0); pieces = []; moveCount = 17;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('侵攻ブロックが上端に湧く', board.slice(0, BOARD_SIZE).includes(3));
    `,
};
