// PHOENIXGO — 不死鳥碁: 取られた連は半分だけ散り、残り半分がその場で即復活する
const K = require('../gen_kit.js');
module.exports = {
    file: 'phoenixgo.html',
    en: 'PHOENIXGO',
    jp: '不死鳥碁',
    prefix: 'phoenixgo',
    desc: '取られた連は半分だけ散り、残り半分がその場で即復活する。',
    kind: 'stone',
    spec: [
        ...K.rb('PHOENIXGO', '不死鳥碁', 'phoenixgo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 不死鳥: 取られた連は半分だけ散り、残り半分が即復活する
                const keep = captured.length === 1 ? 0 : Math.ceil(captured.length / 2);
                const gone = [];
                captured.forEach((idx, k) => { if (k >= keep) { board[idx] = 0; gone.push(idx); } });
                if (gone.length > 0) {
                    captures[player] += gone.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた連は不死鳥のように半分だけ散り、残り半分がその場で即復活する。',
            '大きな連ほど復活力が高い。1石の連は復活できず通常通り散る。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        // 白の4連を包囲
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        board[6 * BOARD_SIZE + 5] = 2; board[6 * BOARD_SIZE + 6] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        board[4 * BOARD_SIZE + 6] = 1; board[7 * BOARD_SIZE + 5] = 1;
        board[7 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 7] = 1; board[6 * BOARD_SIZE + 7] = 1;
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1); // 残り1呼吸点 (4,6) を着手で埋めて取る
        assert('半分が即復活', board.filter(v => v === 2).length === 2);
        assert('散った分だけ取り', captures[1] === 2);
        // 1石連は復活しない
        board.fill(0); pieces = []; captures[1] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('1石は復活せず散る', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
