// OHARAIGO — 大祓碁: 18手ごとの大祓 — 呼吸点1以下の全ての連が穢れとして祓われる
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'oharaigo.html',
    en: 'OHARAIGO',
    jp: '大祓碁',
    prefix: 'oharaigo',
    desc: '18手ごとの大祓: 呼吸1以下の全ての連が穢れとして祓われる。',
    kind: 'stone',
    icon: 'oharaigo',
    spec: [
        ...K.rb('OHARAIGO', '大祓碁', 'oharaigo'),
        K.params([
            { key: 'oharai_interval', label: '大祓の間隔', min: 6, max: 40, def: 18, unit: '手' },
            { key: 'lib_max', label: '祓われる呼吸数', min: 1, max: 3, def: 1, unit: '以下' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.9, step: 0.05 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 大祓: 呼吸点1以下の連を全て取り除く
        function oharae() {
            const opponent = turn === 1 ? 2 : 1;
            let purged = 0;
            for (const pl of [1, 2]) {
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== pl || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, pl);
                    grp.forEach(g => seen.add(g));
                    if (getLiberties(board, i) <= (P('lib_max') || 1)) {
                        grp.forEach(g => { board[g] = 0; captures[pl === 1 ? 2 : 1]++; });
                        purged += grp.length;
                    }
                }
            }
            cleanUpPieces();
            return purged;
        }`],
        // 18手ごとに大祓 (着手解決後)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length > 0 && history.length % Math.max(2, P('oharai_interval') || 18) === 0) {
                const p = oharae();
                if (p > 0) {
                    fxShake(5, 400);
                    fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '大祓: ' + p + '石を浄化', '#059669', 1500);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'大祓まで' + ((P('oharai_interval') || 18) - (history.length % (P('oharai_interval') || 18))) + '手'`),
        [K.ONE, K.INFO_ALGO, `            大祓碁: 18手ごとの大祓 — 呼吸点1以下の連は全て穢れとして祓われる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '18手ごとの着手後に大祓が執り行われる: 呼吸点1以下の連は全て祓われて消滅 (相手のアゲハマに)。',
            '大祓に弱い連を残すな — 呼吸2以上に整えておけば清いまま残る。',
            '大祓のタイミングを読んで敵の弱連をあぶり出せ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 呼吸1の連 (5,5): 3方埋め → 呼吸1 → 祓われる
        board[I(5, 5)] = 1;
        board[I(4, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        // 呼吸4の健全連 (8,8)
        board[I(8, 8)] = 1;
        const n = oharae();
        assert('呼吸1の連は祓われる', board[I(5, 5)] === 0);
        assert('健全連は残る', board[I(8, 8)] === 1);
        assert('祓いは1石', n === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
