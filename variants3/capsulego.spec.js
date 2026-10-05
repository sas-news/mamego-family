// CAPSULEGO — カプセル碁: 敵石を取るとカプセルが弾け、自分色の「中身」が近くの空きに飛び出す
const K = require('../gen_kit.js');
module.exports = {
    file: 'capsulego.html',
    en: 'CAPSULEGO',
    jp: 'カプセル碁',
    prefix: 'capsulego',
    desc: '敵石を取るとカプセルが弾けて自分色の中身が近くの空きマスに飛び出す。',
    kind: 'stone',
    icon: 'capsulego',
    spec: [
        ...K.rb('CAPSULEGO', 'カプセル碁', 'capsulego'),
        K.params([
            { key: 'ring_dist', label: '中身の飛距離', min: 1, max: 4, def: 2, hint: '捕獲点からこの距離のリングに出る' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 400, def: 140, unit: '手' },
        ]),
        // 捕獲ごとに中身(自分色のコア)が飛び出す: 取られた各セルの距離2リングで最初の空きに配置
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // カプセルルール: 各捕獲セルから中身が飛び出す (距離2リングの最初の空き)
                captured.forEach(ci => {
                    const cx = ci % BOARD_SIZE, cy = Math.floor(ci / BOARD_SIZE);
                    let placed2 = false;
                    const rd = Math.max(1, P('ring_dist') || 2);
                    for (let dy = -rd; dy <= rd && !placed2; dy++) {
                        for (let dx = -rd; dx <= rd && !placed2; dx++) {
                            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rd) continue;
                            const nx = cx + dx, ny = cy + dy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === 0) {
                                board[ni] = player;
                                fxSlide(ci, ni, 380);
                                fxBurst(ni, '#4ade80', 6, 1.3);
                                placed2 = true;
                            }
                        }
                    }
                });
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵石を取るとカプセルが弾け、自分色の中身がその距離2リングの最初の空きマスに飛び出す。',
            '中身の石は普通の石として扱う (取られる・取れる)。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 2; // 白 (4,4) を包囲して取る
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1;
        const before = board.filter(v => v === 1).length;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('捕獲で中身が飛び出す', captures[1] === 1 && board.filter(v => v === 1).length === before + 2);
        assert('中身は距離2リングに出る', board[2 * BOARD_SIZE + 2] === 1 || board.some((v, i) => v === 1 && i !== 4 * BOARD_SIZE + 3 && i !== 4 * BOARD_SIZE + 5 && i !== 3 * BOARD_SIZE + 4 && i !== 5 * BOARD_SIZE + 4));
        assert('取られたセルは空く', board[4 * BOARD_SIZE + 4] === 0);
    `,
};
