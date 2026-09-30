// BULLETGO — 弾丸碁: 各側5手目の石は弾丸。最も近い敵石へ弾を放ち、直線上を最大3個貫通
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
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
    file: 'bulletgo.html',
    en: 'BULLETGO',
    jp: '弾丸碁',
    prefix: 'bulletgo',
    desc: '各側5手目の石は弾丸。最も近い敵石へ弾を放ち、直線上を最大3個貫通。',
    kind: 'stone',
    icon: 'bulletgo',
    spec: [
        ...K.rb('BULLETGO', '弾丸碁', 'bulletgo'),
        // 弾丸: そのプレイヤーの5手ごとの着手が弾を放つ (最近方角の敵石を最大3個貫通)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 弾丸: 5手ごとに発射 — 4方角で最も近い敵石へ向かって撃ち、最大3個を貫通
            {
                const cnt = player === 1 ? (history.length + 1) >> 1 : history.length >> 1;
                if (cnt % 5 === 0) {
                    const bc = move.cells[0];
                    const si = bc.y * BOARD_SIZE + bc.x;
                    let bestDir = null, bestDist = Infinity;
                    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                        for (let d = 1; d < BOARD_SIZE; d++) {
                            const nx = bc.x + dx * d, ny = bc.y + dy * d;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === player) break;
                            if (board[ni] === opponent) {
                                if (d < bestDist) { bestDist = d; bestDir = [dx, dy]; }
                                break;
                            }
                        }
                    }
                    if (bestDir) {
                        let pierced = 0;
                        for (let d = 1; d < BOARD_SIZE && pierced < 3; d++) {
                            const nx = bc.x + bestDir[0] * d, ny = bc.y + bestDir[1] * d;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === player) break;
                            if (board[ni] === opponent) {
                                board[ni] = 0;
                                captures[player]++;
                                pierced++;
                                fxBurst(ni, '#fbbf24', 8, 1.6);
                            }
                        }
                        fxGlow(si, '#fde047', 800);
                        fxText(si, 'バーン!', '#fbbf24', 1000);
                        fxShake(4, 260);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { const c = turn === 1 ? (history.length + 1) >> 1 : history.length >> 1; const r = 5 - c % 5; return r === 5 ? '弾丸装填済' : '弾丸まで ' + r + '手'; })()`),
        [K.ONE, K.INFO_ALGO, `            弾丸碁: 各側5手目の石は弾丸。最も近い敵石へ弾を放ち直線上を最大3個貫通<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの5手ごとの着手は「弾丸石」— 置くと弾を放つ。',
            '4方角で最も近い敵石が見える方向へ撃ち、直線上の敵石を最大3個まで貫通する。',
            '自石は盾となって弾道を止める。発射周期は両者同じ5手。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒の5手目: 弾丸が射線上の白を貫通 (最大3)
        for (let k = 0; k < 8; k++) executeMove({ cells: [{ x: k, y: 0 }] }, k % 2 === 0 ? 1 : 2);
        board[I(4, 6)] = 2; board[I(4, 7)] = 2; board[I(4, 9)] = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒5手目 → 弾丸 (下へ発射)
        assert('直線上を貫通', board[I(4, 6)] === 0 && board[I(4, 7)] === 0 && board[I(4, 9)] === 0);
        assert('3個のアゲハマ', captures[1] === 3);
        // 貫通は空点も通り越す
        board[I(8, 8)] = 2;
        for (let k = 0; k < 9; k++) executeMove({ cells: [{ x: k, y: 2 }] }, k % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 8, y: 5 }] }, 1); // 黒10手目 → 弾丸
        assert('遠くの敵石も撃つ', board[I(8, 8)] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 11, y: 11 }], 1) === true);
    `,
};
