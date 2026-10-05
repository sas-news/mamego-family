// ARCHERGO — 弓兵碁: 置いた石が矢を放つ: 4方向3マス以内の最初の敵石を射抜く。
const K = require('../gen_kit.js');
module.exports = {
    file: 'archergo.html',
    en: 'ARCHERGO',
    jp: '弓兵碁',
    prefix: 'archergo',
    desc: '置いた石が矢を放つ: 4方向3マス以内の最初の敵石を射抜く。',
    kind: 'stone',
    spec: [
        ...K.rb('ARCHERGO', '弓兵碁', 'archergo'),
        K.params([
            { key: 'arrow_range', label: '矢の射程', min: 1, max: 6, def: 3, unit: 'マス' },
            { key: 'win_captures', label: '先取勝ちのアゲハマ数', min: 8, max: 40, def: 20, unit: '個' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 弓兵: 置いた石から縦横4方向、3マス以内の最初の敵石を射抜く (自石は盾になる)
            {
                const p0 = move.cells[0];
                let shot = 0;
                [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
                    for (let d = 1; d <= (P('arrow_range') || 3); d++) {
                        const nx = p0.x + dx * d, ny = p0.y + dy * d;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                        const v = board[ny * BOARD_SIZE + nx];
                        if (v === 0) continue;
                        if (v === opponent) {
                            board[ny * BOARD_SIZE + nx] = 0; shot++;
                            // 矢の軌跡: 射手の発光と飛翔火花、着弾点で命中表示
                            const ti = ny * BOARD_SIZE + nx;
                            fxGlow(p0.y * BOARD_SIZE + p0.x, '#fbbf24', 500);
                            for (let t = 1; t <= d; t++) fxBurst((p0.y + dy * t) * BOARD_SIZE + (p0.x + dx * t), '#fbbf24', 3, 1.5);
                            fxText(ti, '射抜!', '#fbbf24', 900);
                        }
                        break;
                    }
                });
                if (shot > 0) {
                    captures[player] += shot;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 弓兵の決闘: 先にアゲハマ20個を取った側は即勝ち (射抜き合戦が無限に続かないよう)
            if (captures[player] >= (P('win_captures') || 20)) {
                winByRule(player, '先取勝ち', '20個のアゲハマを先に取りました'); return;
            }

            turn = opponent;`],
        [K.ONE, K.RV_BASE, K.rv(['置いた石は矢を放つ: 上下左右の4方向、3マス以内に最初に遇った敵石を1本ずつ射抜く。','途中に石 (自石含む) があれば矢はそこで止まる。射抜きは包囲取りと同じ手に両方起きる。','先にアゲハマ20個を取った側は即勝ち。'])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
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

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        board[2 * BOARD_SIZE + 5] = 2; // 敵石 (5,2)
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('3マス先の敵を射抜く', board[2 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        board.fill(0); captures[1] = 0;
        board[2 * BOARD_SIZE + 6] = 2; // 敵石 (6,2): 4マス先
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('4マス先は届かない', board[2 * BOARD_SIZE + 6] === 2);
        board.fill(0);
        board[2 * BOARD_SIZE + 3] = 1; board[2 * BOARD_SIZE + 5] = 2; // 自石が盾
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('自石が盾になり敵は無事', board[2 * BOARD_SIZE + 5] === 2);
        board.fill(0); captures = { 1: 19, 2: 0 }; gameOver = false;
        board[2 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('20アゲハマで先取勝ち', gameOver === true && captures[1] === 20);
    
    `,
};
