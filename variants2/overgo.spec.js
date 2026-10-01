// OVERGO — 大差碁: 勢力差(盤上の石数+アゲハマ)が10以上開いた時点で即終局
const K = require('../gen_kit.js');
module.exports = {
    file: 'overgo.html',
    en: 'OVERGO',
    jp: '大差碁',
    prefix: 'overgo',
    desc: '勢力差(盤上の石+アゲハマ)が10以上開いた時点で即勝負あり。',
    kind: 'over',
    spec: [
        ...K.rb('OVERGO', '大差碁', 'overgo'),
        K.params([
            { key: 'diff', label: '決着となる勢力差', min: 4, max: 30, def: 10, unit: '点' },
        ]),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 勢力値: 盤上の自石数 + アゲハマ (終局を待たない大まかな強さの指標)
        function forceScore(player) {
            let stones = 0;
            for (let i = 0; i < board.length; i++) if (board[i] === player) stones++;
            return stones + captures[player];
        }
        function scoreDiff() { return forceScore(1) - forceScore(2); }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 大差ルール: 勢力差が設定値以上なら即決着
            {
                const d = scoreDiff();
                if (Math.abs(d) >= (P('diff') || 10)) {
                    const w = d > 0 ? 1 : 2;
                    fxShake(8, 420);
                    if (lastMove && lastMove.cells[0]) {
                        const oi = lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x;
                        fxGlow(oi, '#facc15', 900);
                        fxText(oi, '大差決着!', '#facc15', 1400);
                    }
                    winByRule(w, '大差勝ち', '勢力差が' + (P('diff') || 10) + '以上開きました (' + Math.abs(d) + ')'); return;
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'勢力差:' + scoreDiff()`),
        [K.ONE, K.RV_ALGO, K.rv([
            '勢力 = 盤上の自石数 + アゲハマ数。毎手後に勢力差を計算し、10以上開けば即決着。',
            '大敗を早々に見切るレフリー制。追いつくなら早いうちに。',
        ])],
        // 勢力差が7を超えると盤の縁が警告色で脈動
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const d = Math.abs(scoreDiff());
            if (d < (P('diff') || 10) - 3) return;
            const ph = (Math.sin(now / 420) + 1) / 2;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(220,60,60,' + (0.09 + ph * 0.11).toFixed(3) + ')';
            ctx2.lineWidth = cs * 0.16;
            ctx2.strokeRect(pad - cs * 0.55, pad - cs * 0.55, w + cs * 0.1, w + cs * 0.1);
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        captures[1] = 0; captures[2] = 0;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('互角なら続行', gameOver === false);
        captures[1] = 10; // 勢力差10を作る
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('10差で即決着', gameOver === true && gameResultData.title.includes('大差'));
    `,
};
