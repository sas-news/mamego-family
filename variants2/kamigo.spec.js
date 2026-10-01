// KAMIGO — 特攻碁: 敵に完全に囲まれた点への自殺手で敵連を爆破できる
const K = require('../gen_kit.js');
module.exports = {
    file: 'kamigo.html',
    en: 'KAMIGO',
    jp: '特攻碁',
    prefix: 'kamigo',
    desc: '敵に完全に囲まれた点へ特攻。自分の石は散るが隣接敵連も爆破する。',
    kind: 'stone',
    spec: [
        ...K.rb('KAMIGO', '特攻碁', 'kamigo'),
        K.params([
            { key: 'blast_radius', label: '爆破の届く距離', min: 1, max: 3, def: 1, hint: '散った石からこの距離内の敵連を道連れ' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, `        function executeMove(move, player) {`,
`        let kamiCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (kamiCapFired && history.length === 0) kamiCapFired = false;
            if (!kamiCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                kamiCapFired = true;
                endGameByScore();
                return;
            }`],
        // 自自殺手を緩和: 全近傍が敵石の点への自殺手のみ許可 (特攻点)
        [K.ONE, `            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;`,
`            // 自殺手チェック (特攻碁): 全近傍が敵石の点への自殺手のみ特攻として許可
            if (getCapturedStones(after, player).length > 0) {
                const kamiOk = cells.every(p => {
                    const ni = p.y * BOARD_SIZE + p.x;
                    const ns = getNeighbors(ni);
                    return ns.length > 0 && ns.every(n => tempBoard[n] === opponent);
                });
                if (!kamiOk) return false;
            }`],
        // 自殺状態の自連は隣接する敵連を全て道連れに爆破する
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 特攻: 呼吸点0で散った自石は、隣接する敵連を全て爆破する
            {
                const suicidal = getCapturedStones(board, player);
                if (suicidal.length > 0) {
                    const doomed = new Set();
                    const seen = new Set();
                    // 散った石から一定距離内の敵連を道連れ (距離は設定で調整)
                    const __br = Math.max(1, P('blast_radius') || 1);
                    const __inRange = new Set();
                    suicidal.forEach(si => {
                        let frontier = [si];
                        const visited = new Set([si]);
                        for (let d = 0; d < __br; d++) {
                            const next = [];
                            frontier.forEach(p => getNeighbors(p).forEach(n => {
                                if (!visited.has(n)) { visited.add(n); __inRange.add(n); next.push(n); }
                            }));
                            frontier = next;
                        }
                    });
                    __inRange.forEach(n => {
                        if (board[n] === opponent && !seen.has(n)) {
                            getConnectedGroup(n, opponent).forEach(g => { seen.add(g); doomed.add(g); });
                        }
                    });
                    // 特攻演出: 突入点の大爆発 + 連鎖する火花 + 画面揺れ
                    suicidal.forEach(i => {
                        fxGlow(i, '#fbbf24', 800);
                        fxBurst(i, '#ef4444', 12, 1.9);
                        fxBurst(i, '#fbbf24', 6, 1.2);
                    });
                    doomed.forEach(i => { board[i] = 0; fxBurst(i, '#f97316', 7, 1.3); });
                    suicidal.forEach(i => { board[i] = 0; });
                    fxText(suicidal[0], '特攻!', '#fbbf24', 1100);
                    fxShake(8, 400);
                    captures[player] += doomed.size;
                    captures[opponent] += suicidal.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                }
            }`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '全ての近傍が敵石の点へは自殺手 (特攻) が打てる。',
            '特攻した石は散るが、隣接する敵連は全て爆破されてアゲハマになる。',
            '敵の厚みのど真ん中に突っ込んで壊す一発必殺の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        // 白のリングで囲まれた (4,4) へ特攻
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2;
        board[3 * BOARD_SIZE + 4] = 2; board[5 * BOARD_SIZE + 4] = 2;
        assert('特攻点は着手可能', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('隣接敵連が爆破される', board[4 * BOARD_SIZE + 3] === 0 && board[5 * BOARD_SIZE + 4] === 0);
        assert('特攻石も散る', board[4 * BOARD_SIZE + 4] === 0);
        assert('爆破分は自分の取り', captures[1] === 4);
        board.fill(0); pieces = [];
        assert('呼吸のある点は通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
        board.fill(0); pieces = [];
        board[1] = 2; board[BOARD_SIZE] = 2;
        assert('隅も全近傍が敵なら特攻可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board.fill(0); pieces = [];
        board[0] = 1; board[1] = 2; board[2 * BOARD_SIZE] = 2; board[BOARD_SIZE + 1] = 2;
        assert('自石が混ざる自殺点は不可', isValidPlacement([{ x: 0, y: 1 }], 1) === false);
    `,
};
