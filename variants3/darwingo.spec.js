// DARWINGO — 淘汰碁: 8手ごとの自然選択で、2個以下かつ呼吸2以下の弱い連は死滅する
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'darwingo.html',
    en: 'DARWINGO',
    jp: '淘汰碁',
    prefix: 'darwingo',
    desc: '8手ごとの自然選択で、2個以下かつ呼吸2以下の弱い連は死滅して相手のアゲハマになる。',
    kind: 'stone',
    icon: 'darwingo',
    spec: [
        ...K.rb('DARWINGO', '淘汰碁', 'darwingo'),
        // 自然選択: 8手ごとに弱い連 (2個以下 & 呼吸2以下) が死滅 — 両者対象
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 淘汰碁: 8手ごとの自然選択 — 弱い連は死滅する
            if (history.length % 8 === 0) {
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] !== 1 && board[i] !== 2) || seen.has(i)) continue;
                    const col = board[i];
                    const stack = [i], g = [];
                    while (stack.length) {
                        const c = stack.pop();
                        if (seen.has(c) || board[c] !== col) continue;
                        seen.add(c); g.push(c);
                        getNeighbors(c).forEach(n => { if (board[n] === col && !seen.has(n)) stack.push(n); });
                    }
                    let libs = 0;
                    const libSet = new Set();
                    g.forEach(c => getNeighbors(c).forEach(n => { if (board[n] === 0) libSet.add(n); }));
                    libs = libSet.size;
                    if (g.length <= 2 && libs <= 2) {
                        g.forEach(c => { board[c] = 0; fxBurst(c, '#a3a3a3', 6, 1.2); });
                        captures[col === 1 ? 2 : 1] += g.length;
                        fxText(g[0], '死滅', '#d4d4d4', 900);
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            淘汰碁: 8手ごとの自然選択で、2個以下かつ呼吸2以下の弱い連は死滅する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自然選択: 着手の8手ごとに、石2個以下かつ呼吸2以下の連は全て死滅して相手のアゲハマになる (両者対象)。',
            '小さな連は放置できない。大きく育てて環境に適応させよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 2; // 白の孤石: 呼吸4 → 生き残る
        board[6 * BOARD_SIZE + 6] = 2; board[7 * BOARD_SIZE + 6] = 2;
        board[5 * BOARD_SIZE + 6] = 1; board[8 * BOARD_SIZE + 6] = 1;
        board[6 * BOARD_SIZE + 5] = 1; board[7 * BOARD_SIZE + 5] = 1; // 白2連を黒で狭める → 呼吸2
        for (let i = 0; i < 7; i++) executeMove({ cells: [{ x: 12, y: i }] }, 1);
        assert('7手目までは選択なし', board[6 * BOARD_SIZE + 6] === 2);
        executeMove({ cells: [{ x: 12, y: 7 }] }, 1); // 8手目 → 自然選択
        assert('呼吸2の弱い連は死滅', board[6 * BOARD_SIZE + 6] === 0 && board[7 * BOARD_SIZE + 6] === 0);
        assert('死滅は相手のアゲハマ', captures[1] === 2);
        assert('呼吸4の石は生き残る', board[4 * BOARD_SIZE + 4] === 2);
    `,
};
