// CHESSGO — 騎士碁: 初手の石が王。王が取られた側の負け (王手=チェック)
const K = require('../gen_kit.js');
module.exports = {
    file: 'chessgo.html',
    en: 'CHESSGO',
    jp: '騎士碁',
    prefix: 'chessgo',
    desc: '初手の石が王冠を被る王。王の連が取られたら即負けのチェック碁。',
    kind: 'crown',
    spec: [
        ...K.rb('CHESSGO', '騎士碁', 'chessgo'),
        K.params([
            { key: 'check_warn', label: 'チェック警告の呼吸点', min: 1, max: 4, def: 1, unit: '点', hint: 'この呼吸点以下の王に警告' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let kingIdx = { 1: -1, 2: -1 }; // 各プレイヤーの王の位置`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 騎士碁: 初手の石が王になる。王が取られれば即負け
            if (kingIdx[player] < 0 && move.cells.length > 0) {
                kingIdx[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                // 戴冠式: 王の誕生を金の輪で告げる
                fxGlow(kingIdx[player], '#f5d060', 1000);
                fxText(kingIdx[player], '王', '#f5d060', 1300);
            }
            if (kingIdx[opponent] >= 0 && board[kingIdx[opponent]] !== opponent) {
                fxBurst(kingIdx[opponent], '#f5d060', 18, 2.0);
                fxShake(8, 440);
                fxText(kingIdx[opponent], '王手詰み!', '#ef4444', 1500);
                winByRule(player, '王手詰み勝ち', '相手の王を捕らえました');
                return;
            }

            turn = opponent;`],
        // チェック表示チップ
        ...K.EVENT_CHIP_SPEC('kingIdx[turn] >= 0 && board[kingIdx[turn]] === turn && getLiberties(board, kingIdx[turn]) <= (P(\'check_warn\') || 1) ? "チェック!" : ""'),
        // チェック警報: 呼吸点1の王は赤く脈動し続ける
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            [1, 2].forEach(pl => {
                const ki = kingIdx[pl];
                if (ki < 0 || board[ki] !== pl || gameOver) return;
                if (getLiberties(board, ki) > (P('check_warn') || 1)) return;
                const cx = pad + (ki % BOARD_SIZE) * cs, cy = pad + Math.floor(ki / BOARD_SIZE) * cs;
                ctx2.save();
                ctx2.globalAlpha = 0.35 + 0.3 * Math.sin(now / 230);
                ctx2.strokeStyle = '#ef4444';
                ctx2.lineWidth = Math.max(1.6, cs * 0.07);
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * 0.44, 0, Math.PI * 2);
                ctx2.stroke();
                ctx2.restore();
            });
        });`],
        // 王冠マーク
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(pl => {
                const ki = kingIdx[pl];
                if (ki < 0 || board[ki] !== pl) return;
                const kx = ki % BOARD_SIZE, ky = Math.floor(ki / BOARD_SIZE);
                const cx = padding + kx * cellSize, cy = padding + ky * cellSize;
                ctx.save();
                ctx.strokeStyle = pl === 1 ? '#f5d060' : '#b09020';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.15, cy + cellSize * 0.12);
                ctx.lineTo(cx - cellSize * 0.12, cy - cellSize * 0.1);
                ctx.lineTo(cx - cellSize * 0.05, cy + cellSize * 0.01);
                ctx.lineTo(cx, cy - cellSize * 0.12);
                ctx.lineTo(cx + cellSize * 0.05, cy + cellSize * 0.01);
                ctx.lineTo(cx + cellSize * 0.12, cy - cellSize * 0.1);
                ctx.lineTo(cx + cellSize * 0.15, cy + cellSize * 0.12);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            });`),
        [K.ONE, K.INFO_ALGO, `            騎士碁: 初手の石が王。王の連が取られたら即負け<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの初手の石が王冠を被った王になる。',
            '王を含む連が取られた側は即負け。王の呼吸点が1になるとチェック警告が出る。',
            '王を守りつつ敵の王を追い詰めろ — ただし普通の地取り決着もあり得る。',
        ])],
        // 打ち切り手数: 設定で有効化した場合のみ長期戦を強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; kingIdx = { 1: -1, 2: -1 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('初手の石が王', kingIdx[1] === 0);
        board.fill(0); pieces = []; kingIdx = { 1: 0, 2: -1 };
        board[0] = 1; board[1] = 2; board[BOARD_SIZE] = 2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('王を取れば勝ち', gameOver === true);
        assert('結果は王手詰み', !!gameResultData && gameResultData.title.includes('王'));
    `,
};
