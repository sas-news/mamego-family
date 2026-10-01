// CHANNELGO — 媒介碁: 同行・同列で間が全て空いた最初の石とも霊的に連なる
const K = require('../gen_kit.js');
module.exports = {
    file: 'channelgo.html',
    en: 'CHANNELGO',
    jp: '媒介碁',
    prefix: 'channelgo',
    desc: '石は媒介。同行・同列で視線の通った石同士は遠くても一つの連。',
    kind: 'stone',
    icon: 'channelgo',
    spec: [
        ...K.rb('CHANNELGO', '媒介碁', 'channelgo'),
        K.params([
            { key: 'link_range', label: '媒介の届く距離', min: 0, max: 15, def: 0, unit: 'マス', hint: '0=無制限' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);
            // 媒介: 同行・同列で間が全て空いた先に見える最初の石とも結ばれる (届く距離は設定で調整)
            const _maxR = P('link_range') || 0; // 0=無制限
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
                let dist = 1, cx = x + dx, cy = y + dy;
                while (cx >= 0 && cy >= 0 && cx < BOARD_SIZE && cy < BOARD_SIZE && (_maxR === 0 || dist <= _maxR)) {
                    const ci = cy * BOARD_SIZE + cx;
                    if (board[ci] !== 0) { if (dist > 1) neighbors.push(ci); break; }
                    cx += dx; cy += dy; dist++;
                }
            });
            return neighbors;
        }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の一定割合を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 媒介: 視線で繋がった同色の石同士を薄い線で結ぶ
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(168,85,247,0.28)';
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                for (let i = 0; i < board.length; i++) {
                    const p = board[i];
                    if (p !== 1 && p !== 2) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                        let cx = x + dx, cy = y + dy;
                        while (cx < BOARD_SIZE && cy < BOARD_SIZE) {
                            const ci = cy * BOARD_SIZE + cx;
                            if (board[ci] !== 0) {
                                if (board[ci] === p && (cx !== x + dx || cy !== y + dy)) {
                                    ctx.beginPath();
                                    ctx.moveTo(padding + x * cellSize, padding + y * cellSize);
                                    ctx.lineTo(padding + cx * cellSize, padding + cy * cellSize);
                                    ctx.stroke();
                                }
                                break;
                            }
                            cx += dx; cy += dy;
                        }
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は媒介。同行・同列の間が全て空いていれば、遠くの石とも霊的に連なって呼吸を共有する。',
            '間に石を置かれると繋がりは遮断される。視線の確保と遮断の攻防 — 両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 4 }] }, 1);
        assert('同列で視線の通る石は繋がる', getNeighbors(0).includes(4 * BOARD_SIZE));
        executeMove({ cells: [{ x: 0, y: 2 }] }, 2); // 遮断
        assert('間に石を置くと繋がりが切れる', !getNeighbors(0).includes(4 * BOARD_SIZE));
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2); // (0,0) の呼吸を塞ぐ
        assert('遮断された単石は取れる', board[0] === 0 && captures[2] === 1);
    `,
};
