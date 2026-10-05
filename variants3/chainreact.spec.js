// CHAINREACT — 連鎖碁: 敵石を取ると、その8近傍の敵石も連鎖して爆発する (最大2波)
const K = require('../gen_kit.js');
module.exports = {
    file: 'chainreact.html',
    en: 'CHAINREACT',
    jp: '連鎖碁',
    prefix: 'chainreact',
    desc: '敵石を取ると爆発: 8近傍の敵石も連鎖して取られる。連鎖は最大2波まで。',
    kind: 'stone',
    icon: 'chainreact',
    spec: [
        ...K.rb('CHAINREACT', '連鎖碁', 'chainreact'),
        K.params([
            { key: 'chain_waves', label: '連鎖の最大波数', min: 0, max: 5, def: 2, unit: '波', hint: '0=連鎖なし' },
            { key: 'chain_dirs', label: '連鎖の届く範囲', options: [{ v: 8, l: '8近傍 (斜めも)' }, { v: 4, l: '4近傍のみ' }], def: 8 },
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 300, def: 140, unit: '手' },
        ]),
        // 捕獲後の連鎖爆発: 取られた石の8近傍にある敵石が連鎖して消える (最大2波)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // 連鎖ルール: 爆発した石の近傍の敵石も連鎖して消える (波数・近傍は設定で調整)
                const _waves = P('chain_waves') ?? 2;
                const _dirs = (P('chain_dirs') || 8) === 4
                    ? [[1,0],[-1,0],[0,1],[0,-1]]
                    : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
                let frontier = [...captured];
                for (let wave = 0; wave < _waves; wave++) {
                    const blast = new Set();
                    frontier.forEach(ci => {
                        const cx = ci % BOARD_SIZE, cy = Math.floor(ci / BOARD_SIZE);
                        _dirs.forEach(([dx, dy]) => {
                            const nx = cx + dx, ny = cy + dy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === opponent) blast.add(ni);
                        });
                    });
                    if (blast.size === 0) break;
                    frontier = [];
                    blast.forEach(i => {
                        board[i] = 0; captures[player]++; frontier.push(i);
                        fxBurst(i, '#fb923c', 7, 1.6);
                    });
                }
                if (frontier.length >= 2) fxShake(4, 280);
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 長期戦防止: 既定の手数経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵石を取ると爆発し、取られた石の8近傍にある敵石も連鎖して取られる (最大2波)。',
            '斜め繋がりの敵石塊は連鎖に巻き込まれやすい。自分の石は巻き込まれない。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 2; // 捕獲対象の白 (4,4)
        board[5 * BOARD_SIZE + 5] = 2; // 斜め隣の白 (5,5) (1波目)
        board[6 * BOARD_SIZE + 6] = 2; // (6,6) 2波目
        board[7 * BOARD_SIZE + 7] = 2; // (7,7) 3波目は届かず生存
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1; // (3,4)(5,4)(4,3) の黒
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // (4,4) を捕獲して連鎖発火
        assert('通常の捕獲', board[4 * BOARD_SIZE + 4] === 0);
        assert('1波目の連鎖', board[5 * BOARD_SIZE + 5] === 0);
        assert('2波目の連鎖', board[6 * BOARD_SIZE + 6] === 0);
        assert('3波目は届かない', board[7 * BOARD_SIZE + 7] === 2);
        assert('連鎖分もアゲハマに', captures[1] === 3);
    `,
};
