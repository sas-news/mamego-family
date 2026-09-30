// COLLIDEGO — 衝突碁: 置いた石は中央へ向かって滑り、敵石に衝突するとそれを破壊してその場に止まる
const K = require('../gen_kit.js');
module.exports = {
    file: 'collidego.html',
    en: 'COLLIDEGO',
    jp: '衝突碁',
    prefix: 'collidego',
    desc: '置いた石は中央へ向かう長軸方向に最大5マス滑る。敵石に衝突すると破壊してその場に止まる。',
    kind: 'stone',
    icon: 'collidego',
    spec: [
        ...K.rb('COLLIDEGO', '衝突碁', 'collidego'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 衝突ルール: 着手石は中央へ向かう長軸方向に滑走 (最大5マス)
            {
                const c = Math.floor(BOARD_SIZE / 2);
                let px = move.cells[0].x, py = move.cells[0].y;
                let ci = py * BOARD_SIZE + px;
                if (board[ci] === player) {
                    const ddx = c - px, ddy = c - py;
                    let sx = 0, sy = 0;
                    if (Math.abs(ddx) >= Math.abs(ddy)) sx = Math.sign(ddx);
                    else sy = Math.sign(ddy);
                    if (sx || sy) {
                        let cur = ci, steps = 0;
                        while (steps < 5) {
                            const nx = (cur % BOARD_SIZE) + sx, ny = Math.floor(cur / BOARD_SIZE) + sy;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === 0) { cur = ni; steps++; continue; }
                            if (board[ni] === opponent) {
                                // 敵に衝突: 破壊してその場に止まる
                                board[ni] = 0; captures[player]++;
                                fxBurst(ni, '#f87171', 9, 1.8);
                                cur = ni; steps++;
                                break;
                            }
                            break; // 味方の前で停止
                        }
                        if (cur !== ci) {
                            board[cur] = player; board[ci] = 0;
                            fxSlide(ci, cur, 380);
                            cleanUpPieces();
                        }
                    }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は中央へ向かう長軸方向に最大5マス滑る。',
            '敵石に衝突するとその敵石を破壊してその場に止まる。味方の前では手前で停止。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: 0, y: c }] }, 1); // 右へ滑走
        assert('空きがあれば滑る', board[c * BOARD_SIZE + (c - 1)] === 1 || board[c * BOARD_SIZE + (c - 0)] === 1 || board[c * BOARD_SIZE + 5] === 1);
        assert('着手地点は空く', board[c * BOARD_SIZE + 0] === 0);
        // 敵衝突: (3,c) に白を置くと、左端からの滑走で衝突
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[c * BOARD_SIZE + 3] = 2;
        executeMove({ cells: [{ x: 0, y: c }] }, 1);
        assert('敵に衝突して破壊', board[c * BOARD_SIZE + 3] === 1 && captures[1] === 1);
    `,
};
