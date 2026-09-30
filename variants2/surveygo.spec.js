// SURVEYGO — 測量碁: 自石で囲んだ最大の矩形がボーナス得点
const K = require('../gen_kit.js');
module.exports = {
    file: 'surveygo.html',
    en: 'SURVEYGO',
    jp: '測量碁',
    prefix: 'surveygo',
    desc: '自石の枠で囲んだ最大矩形の面積がボーナス。大きく測量せよ。',
    kind: 'survey',
    spec: [
        ...K.rb('SURVEYGO', '測量碁', 'surveygo'),
        // 測量矩形ヘルパー (終局時加算)
        [K.ONE, `        function endGameByScore() {`, `
        // 自石の辺で囲まれた最大矩形の面積 (外周の石が全て同色)
        function surveyRect(player) {
            const isP = (x, y) => board[y * BOARD_SIZE + x] === player;
            let best = 0;
            for (let r1 = 0; r1 < BOARD_SIZE; r1++) for (let r2 = r1 + 1; r2 < BOARD_SIZE; r2++) {
                for (let c1 = 0; c1 < BOARD_SIZE; c1++) for (let c2 = c1 + 1; c2 < BOARD_SIZE; c2++) {
                    const area = (r2 - r1 + 1) * (c2 - c1 + 1);
                    if (area <= best) continue;
                    let ok = true;
                    for (let x = c1; x <= c2 && ok; x++) ok = isP(x, r1) && isP(x, r2);
                    for (let y = r1; y <= r2 && ok; y++) ok = isP(c1, y) && isP(c2, y);
                    if (ok) best = area;
                }
            }
            return best;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + surveyRect(1);
            const whiteTotal = territory.white + captures[2] + komi + surveyRect(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の測量矩形:</span> <strong>\${surveyRect(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の測量矩形:</span> <strong>\${surveyRect(2)}</strong></div>`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が長方形の外周を全て占めると、その面積が終局時にボーナス得点になる。',
            '矩形の内部は空でも敵石でもよい。大きく囲うほど高得点の測量勝負。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        // 3×2の矩形の外周全てを黒で囲む: (1,1)-(3,2)
        const pts = [[1,1],[2,1],[3,1],[1,2],[2,2],[3,2]];
        pts.forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 1; });
        assert('矩形検出される', surveyRect(1) >= 6);
        assert('白は0', surveyRect(2) === 0);
        board.fill(0);
        assert('空盤は0', surveyRect(1) === 0);
        board[0] = 1; board[1] = 1;
        assert('1マス差では矩形なし', surveyRect(1) === 0);
    `,
};
