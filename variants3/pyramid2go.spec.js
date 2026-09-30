// PYRAMID2GO — 三角碁: 直角二等辺の3頂点を自分の石で作ると三角形内部の敵石を全取り
const K = require('../gen_kit.js');
module.exports = {
    file: 'pyramid2go.html',
    en: 'PYRAMID2GO',
    jp: '三角碁',
    prefix: 'pyramid2go',
    desc: '直角二等辺三角形の3頂点に石を置くと、その内部の敵石を全て取る。',
    kind: 'stone',
    icon: 'pyramid2go',
    spec: [
        ...K.rb('PYRAMID2GO', '三角碁', 'pyramid2go'),
        // 三角形検出: 着手石が3頂点のいずれかになる直角二等辺三角形 (脚長d>=2, 軸平行)
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // (px,py) の石を頂点の1つとする自分色の直角二等辺三角形を探す
        function findTriangle(px, py, player) {
            for (let d = 2; d < BOARD_SIZE; d++) {
                for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
                    const cands = [
                        [px, py],          // 直角頂点が着手石
                        [px - d * sx, py], // 着手石がx脚端
                        [px, py - d * sy], // 着手石がy脚端
                    ];
                    for (const [rx, ry] of cands) {
                        const ax = rx + d * sx, ay = ry;
                        const bx = rx, by = ry + d * sy;
                        if (rx < 0 || ry < 0 || rx >= BOARD_SIZE || ry >= BOARD_SIZE) continue;
                        if (ax < 0 || ay < 0 || ax >= BOARD_SIZE || ay >= BOARD_SIZE) continue;
                        if (bx < 0 || by < 0 || bx >= BOARD_SIZE || by >= BOARD_SIZE) continue;
                        if (board[ry * BOARD_SIZE + rx] !== player) continue;
                        if (board[ay * BOARD_SIZE + ax] !== player) continue;
                        if (board[by * BOARD_SIZE + bx] !== player) continue;
                        return { rx, ry, sx, sy, d };
                    }
                }
            }
            return null;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 三角ルール: 完成した三角形の内部の敵石を全取り
            {
                const px = move.cells[0].x, py = move.cells[0].y;
                const tri = findTriangle(px, py, player);
                if (tri) {
                    const { rx, ry, sx, sy, d } = tri;
                    let hit = 0;
                    for (let i = 0; i <= d; i++) {
                        for (let j = 0; i + j <= d; j++) {
                            const isV = (i === 0 && j === 0) || (i === d && j === 0) || (i === 0 && j === d);
                            if (isV) continue;
                            const vx = rx + i * sx, vy = ry + j * sy;
                            if (vx < 0 || vy < 0 || vx >= BOARD_SIZE || vy >= BOARD_SIZE) continue;
                            const vi = vy * BOARD_SIZE + vx;
                            if (board[vi] === opponent) {
                                board[vi] = 0; captures[player]++; hit++;
                                fxBurst(vi, '#f472b6', 8, 1.5);
                            }
                        }
                    }
                    fxGlow(py * BOARD_SIZE + px, '#f9a8d4', 900);
                    fxText(py * BOARD_SIZE + px, '三角!', '#ec4899', 1300);
                    if (hit) { fxShake(5, 320); cleanUpPieces(); }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で「直角二等辺三角形」の3頂点 (軸平行・脚長2以上) を作ると、その内部の敵石を全て取る。',
            '内部に自分の石があってもそのまま残る (三角形内は安全地帯)。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[3*BOARD_SIZE+4] = 2; board[4*BOARD_SIZE+3] = 2; board[4*BOARD_SIZE+4] = 2; // 三角内部の敵石
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1);
        assert('2頂点では発動しない', board[3*BOARD_SIZE+4] === 2);
        executeMove({ cells: [{ x: 3, y: 5 }] }, 1); // (3,3)-(5,3)-(3,5) の三角完成
        assert('三角内部の敵石を全取り', board[3*BOARD_SIZE+4] === 0 && board[4*BOARD_SIZE+3] === 0 && board[4*BOARD_SIZE+4] === 0);
        assert('取った敵石はアゲハマに', captures[1] === 3);
    `,
};
