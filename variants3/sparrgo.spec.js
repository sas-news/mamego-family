// SPARRGO — 対打碁: 着手が敵連に接すると「対打」— 連の大きさ比較で敗者が消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'sparrgo.html',
    en: 'SPARRGO',
    jp: '対打碁',
    prefix: 'sparrgo',
    desc: '敵連に接する着手は対打になる。連の大きい方が勝ち、敗連は全滅。互角なら打ち込み石が弾かれる。',
    kind: 'stone',
    icon: 'sparrgo',
    spec: [
        ...K.rb('SPARRGO', '対打碁', 'sparrgo'),
        K.params([
            { key: 'move_cap', label: '打ち切り手数', min: 60, max: 280, def: 140, step: 10, unit: '手' },
        ]),
        // 連取得ヘルパー
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // idx を含む同色連の idx 列 (BFS, 先頭=最小idxで一意化に使う)
        function groupOf(idx) {
            const color = board[idx];
            const seen = new Set([idx]);
            const queue = [idx];
            const out = [];
            while (queue.length) {
                const cur = queue.shift();
                out.push(cur);
                getNeighbors(cur).forEach(n => {
                    if (board[n] === color && !seen.has(n)) { seen.add(n); queue.push(n); }
                });
            }
            return out.sort((a, b) => a - b);
        }

        function isValidPlacement(cells, player) {`],
        // 手番交代直前: 対打解決 & 長期戦打ち切り
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 対打: 着手した連 vs 隣接する最大の敵連
            {
                const gi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[gi] === player) {
                    const mine = groupOf(gi);
                    const seen = new Set();
                    let foe = null;
                    mine.forEach(i => getNeighbors(i).forEach(n => {
                        if (board[n] !== opponent) return;
                        const g = groupOf(n);
                        const key = g[0];
                        if (seen.has(key)) return;
                        seen.add(key);
                        if (!foe || g.length > foe.length) foe = g;
                    }));
                    if (foe) {
                        fxText(gi, '対打!', '#fbbf24', 1000);
                        fxShake(4, 260);
                        if (mine.length > foe.length) {
                            foe.forEach(i => { board[i] = 0; captures[player]++; fxBurst(i, '#ef4444', 8, 1.5); });
                            fxText(foe[0], '撃破', '#ef4444', 900);
                        } else if (mine.length < foe.length) {
                            mine.forEach(i => { board[i] = 0; captures[opponent]++; fxBurst(i, '#64748b', 8, 1.5); });
                            fxText(gi, '返り討ち', '#94a3b8', 900);
                        } else {
                            board[gi] = 0; captures[opponent]++;
                            fxBurst(gi, '#94a3b8', 8, 1.4);
                        }
                        cleanUpPieces();
                    }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('move_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した連が敵連に接すると「対打」発生: 連の石数が多い側が勝ち、敗者の連は全て消える。',
            '互角 (同数) の対打は打ち込んだ石だけが弾かれて相手のアゲハマになる。',
            '対打は大きい敵連1組とだけ行う。140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 1対1の対打 → 互角 → 白の着手石が弾かれる
        assert('互角の対打は着手側が弾かれる', board[5*BOARD_SIZE+4] === 0 && board[4*BOARD_SIZE+4] === 1);
        assert('弾かれた石はアゲハマに', captures[1] === 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2); // 白の独立石
        executeMove({ cells: [{ x: 7, y: 5 }] }, 1);
        executeMove({ cells: [{ x: 7, y: 6 }] }, 1); // 黒連2 vs 白連1 → 対打で白全滅
        assert('大きい連が対打に勝つ', board[7*BOARD_SIZE+7] === 0);
        assert('対打の勝者がアゲハマ獲得', captures[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('非隣接なら対打なし', board[0] === 2 && board[4*BOARD_SIZE+4] === 1);
    `,
};
