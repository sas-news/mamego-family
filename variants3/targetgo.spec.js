// TARGETGO — 的当碁: 天元は射的台。天元に置くと十字に弾が飛び、各方角最初の敵石を撃墜
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
    file: 'targetgo.html',
    en: 'TARGETGO',
    jp: '的当碁',
    prefix: 'targetgo',
    desc: '天元は射的台。天元に置くと十字に弾が飛び、各方角最初の敵石を撃墜。',
    kind: 'stone',
    icon: 'targetgo',
    spec: [
        ...K.rb('TARGETGO', '的当碁', 'targetgo'),
        // 的当て: 天元への着手で十字方向に弾を発射 — 各方角最初の敵石を撃墜
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 的当て: 天元から十字に射撃。各方角で最初に見つかる敵石を撃墜
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const bc = move.cells[0];
                if (bc.x === cc && bc.y === cc) {
                    const ti = cc * BOARD_SIZE + cc;
                    let hits = 0;
                    fxGlow(ti, '#fde047', 900);
                    fxShake(5, 300);
                    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                        for (let d = 1; d < BOARD_SIZE; d++) {
                            const nx = cc + dx * d, ny = cc + dy * d;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                            const ni = ny * BOARD_SIZE + nx;
                            if (board[ni] === player) break; // 自石は盾になる
                            if (board[ni] === opponent) {
                                board[ni] = 0;
                                captures[player]++;
                                hits++;
                                fxBurst(ni, '#ef4444', 12, 1.8);
                                fxText(ni, '命中!', '#f87171', 900);
                                break;
                            }
                        }
                    }
                    if (hits > 0) cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 天元に照準を描く
        K.CUE_STARS(`            // 射的台: 天元に十字照準
            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const cx = padding + cc * cellSize, cy = padding + cc * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.55)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.85, 0, Math.PI * 2);
                ctx.stroke();
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    ctx.beginPath();
                    ctx.moveTo(cx + dx * cellSize * 0.62, cy + dy * cellSize * 0.62);
                    ctx.lineTo(cx + dx * cellSize * 0.80, cy + dy * cellSize * 0.80);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'天元=射的台: 十字に狙い撃ち'`),
        [K.ONE, K.INFO_ALGO, `            的当碁: 天元は射的台。天元に置くと十字に弾が飛び、各方角最初の敵石を撃墜<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元に石を置くと射的台から十字に弾が飛ぶ。',
            '各方角で最初に見つかる敵石を撃墜する (自石は盾になって弾を止める)。',
            '撃墜は両者同じ条件。射的台を巡る牽制が勝負の鍵。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const cc = Math.floor(BOARD_SIZE / 2);
        board[I(cc, cc - 3)] = 2; board[I(cc + 4, cc)] = 2; board[I(cc - 2, cc)] = 1;
        executeMove({ cells: [{ x: cc, y: cc }] }, 1); // 黒が射的台へ
        assert('上方の敵石を撃墜', board[I(cc, cc - 3)] === 0);
        assert('右方の敵石も撃墜', board[I(cc + 4, cc)] === 0);
        assert('自石の向こうは撃たない', board[I(cc - 2, cc)] === 1);
        assert('2つのアゲハマ', captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
