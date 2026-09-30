// REVERSIGO — 裏返碁: 打った石と自石で挟んだ敵石が全て裏返る
const K = require('../gen_kit.js');
module.exports = {
    file: 'reversigo.html',
    en: 'REVERSIGO',
    jp: '裏返碁',
    prefix: 'reversigo',
    desc: '着手石と自石で直線挟みした敵石が全て自分の色に返る。',
    kind: 'stone',
    spec: [
        ...K.rb('REVERSIGO', '裏返碁', 'reversigo'),
        // 裏返し処理を通常捕獲の前に挿入
        [K.ONE, K.CAPTURE_BLOCK, `            // 裏返碁: 打った石から4方向に走査し、自石で挟んだ敵石列を全て裏返す
            move.cells.forEach(p => {
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    const run = [];
                    let nx = p.x + dx, ny = p.y + dy;
                    while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE
                           && board[ny * BOARD_SIZE + nx] === opponent) {
                        run.push(ny * BOARD_SIZE + nx);
                        nx += dx; ny += dy;
                    }
                    if (run.length > 0 && nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE
                        && board[ny * BOARD_SIZE + nx] === player) {
                        run.forEach(i => { board[i] = player; });
                    }
                });
            });

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.INFO_ALGO, `            裏返碁: 打った石と自分の石で直線に挟んだ敵石が全て自分の色に返る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石から上下左右の4方向を見て、自分の石で挟んだ敵石の列は全て自分の色に裏返る。',
            '裏返しの後にも通常の呼吸・取り判定は働く。盤面が激しく入れ替わる高速な陣取り合戦。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[5] = 1; board[6] = 2;
        executeMove({ cells: [{ x: 7, y: 0 }] }, 1);
        assert('挟んだ敵石が返る', board[6] === 1);
        assert('交互着手は維持', turn === 2);
        board.fill(0); pieces = [];
        board[5] = 2; board[6] = 2;
        executeMove({ cells: [{ x: 7, y: 0 }] }, 1);
        assert('先が空なら返らない', board[5] === 2 && board[6] === 2);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
