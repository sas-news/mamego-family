// SHRINKGO — 縮小碁: 10手ごとに外周1マスが崩落して盤が縮む
const K = require('../gen_kit.js');
module.exports = {
    file: 'shrinkgo.html',
    en: 'SHRINKGO',
    jp: '縮小碁',
    prefix: 'shrinkgo',
    desc: '10手ごとに盤の外周が崩落して縮む。縁の石は奈落に呑まれる。',
    kind: 'stone',
    icon: 'shrinkgo',
    spec: [
        ...K.rb('SHRINKGO', '縮小碁', 'shrinkgo'),
        K.params([
            { key: 'collapse_interval', label: '崩落の間隔', min: 4, max: 24, def: 10, unit: '手' },
        ]),
        // 10手ごとに外周が崩落
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length % (P('collapse_interval') || 10) === 0) {
                const d = history.length / (P('collapse_interval') || 10) - 1;
                let fell = 0;
                for (let i = 0; i < board.length; i++) {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const dist = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                    if (dist === d && board[i] !== 3) {
                        const v = board[i];
                        if (v === 1 || v === 2) { captures[v === 1 ? 2 : 1]++; fell++; fxBurst(i, '#78716c', 8); }
                        board[i] = 3;
                    }
                }
                cleanUpPieces();
                if (fell > 0) fxShake(6, 400);
                fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '崩落!', '#f97316', 1100);
            }
            turn = opponent;`],
        // 崩落予告チップ
        ...K.EVENT_CHIP_SPEC(`'崩落まで ' + ((P('collapse_interval') || 10) - (history.length % (P('collapse_interval') || 10))) + ' 手'`),
        [K.ONE, K.INFO_BASE, `            縮小碁: 10手ごとに盤の外周が1マスずつ崩落して縮む。縁の石は奈落に呑まれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '10手ごとに盤の外周が1マス崩落する。崩落したマスの石は相手のアゲハマになる。',
            '盤はだんだん縮んでいく。中央に逃げるか、縁で時間を稼ぐか。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 }; history = [];
        board[I(3, 0)] = 1; // 外周の黒石
        for (let m = 0; m < 10; m++) {
            const p = m % 2 + 1;
            let put = false;
            for (let y = 2; y < BOARD_SIZE - 2 && !put; y++) for (let x = 2; x < BOARD_SIZE - 2 && !put; x++) {
                if (isValidPlacement([{ x, y }], p)) { executeMove({ cells: [{ x, y }] }, p); put = true; }
            }
            if (!put) executeMove({ cells: [{ x: 1, y: 1 }] }, p); // フォールバック
        }
        assert('10手で外周が崩落', board[I(3, 0)] === 3 && board[I(0, 0)] === 3);
        assert('外周の石はアゲハマになった', captures[2] === 1);
        assert('内部はまだ生きている', board[I(6, 6)] !== 3);
    `,
};
