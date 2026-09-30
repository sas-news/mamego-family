// POISONGO — 毒碁: 取った連は猛毒。取跡に接した自分の連も全て毒死する
const K = require('../gen_kit.js');
module.exports = {
    file: 'poisongo.html',
    en: 'POISONGO',
    jp: '毒碁',
    prefix: 'poisongo',
    desc: '取った連は猛毒。取跡に接した自分の連も全て毒死する。',
    kind: 'stone',
    spec: [
        ...K.rb('POISONGO', '毒碁', 'poisongo'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 毒碁: 取跡に接している自分の連は全て毒に冒されて死ぬ
                const doomed = new Set();
                const seen = new Set();
                captured.forEach(idx => getNeighbors(idx).forEach(n => {
                    if (board[n] === player && !seen.has(n)) {
                        getConnectedGroup(n, player).forEach(g => { seen.add(g); doomed.add(g); });
                    }
                }));
                if (doomed.size > 0) {
                    doomed.forEach(i => { board[i] = 0; });
                    captures[opponent] += doomed.size;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        K.CUE_STARS(`            // 毒の気配: 呼吸点1以下の連に毒の滲み
            {
                ctx.save();
                ctx.fillStyle = 'rgba(120, 200, 60, 0.30)';
                const seenG = new Set();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if ((v !== 1 && v !== 2) || seenG.has(i)) continue;
                    getConnectedGroup(i, v).forEach(g => seenG.add(g));
                    if (getLiberties(board, i) <= 1) {
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '取った連は猛毒: 敵連を取ると、その取跡に接していた自分の連が全て毒死する。',
            '大きな連で囲むと道連れが甚大。小さな石で切り離して取るのが安全。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('取った側の連も毒死', board[4 * BOARD_SIZE + 5] === 0 && board[5 * BOARD_SIZE + 6] === 0);
        assert('毒死分は相手のアゲハマへ', captures[2] === 4);
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('通常着手は毒なし', board[3 * BOARD_SIZE + 3] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
