// CARTGO — 荷車碁: 荷車(2石の横並び連)は積載量が大きいが遅い。荷車は隣接する味方の荷を抱えて運ぶ
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'cartgo.html',
    en: 'CARTGO',
    jp: '荷車碁',
    prefix: 'cartgo',
    desc: '荷車 (横に並んだ自石2連) は荷を運ぶ — 荷車の連が取られる時、積荷は相手に渡るが車は逃げる。',
    kind: 'stone',
    icon: 'cartgo',
    spec: [
        ...K.rb('CARTGO', '荷車碁', 'cartgo'),
        K.params([
            { key: 'cart_len', label: '荷車になる連長', min: 2, max: 4, def: 2, unit: '連' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 荷車: 横に丁度2つ並んだ連は荷車。荷車が取られるとき、両側の「車輪」は転がって逃げる (端の1石だけアゲハマ)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured0 = getCapturedStones(board, opponent);
            const real = [];
            const seenG = {};
            captured0.forEach(i => {
                if (seenG[i]) return;
                const g = getConnectedGroup(i, opponent);
                g.forEach(j => { seenG[j] = true; });
                // 荷車: 丁度2石で横一列の連は車 — 轢かれても荷物(端の1石)だけ渡り、車体は残る
                const coords = g.map(j => [j % BOARD_SIZE, Math.floor(j / BOARD_SIZE)]);
                const cartLen = Math.max(2, P('cart_len') || 2);
                const isCart = g.length === cartLen && coords.every(c => c[1] === coords[0][1]) && Math.abs(coords[0][0] - coords[cartLen - 1][0]) === cartLen - 1;
                if (isCart) {
                    const minX = Math.min(coords[0][0], coords[1][0]);
                    const wheel = g.find(j => j % BOARD_SIZE === minX); // 片側の車輪は逃げる
                    real.push(g.find(j => j !== wheel));
                    fxText(wheel, '車は逃げた!', '#fbbf24', 1200);
                    fxGlow(wheel, '#fbbf24', 700);
                } else {
                    real.push(...g);
                }
            });
            const captured = real;
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'横2連は荷車 — 半分しか取れない'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            荷車碁: 横に丁度2つ並んだ連は荷車。荷車が取られるとき半分 (荷物) しか渡らず、車輪側は盤上に残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '横一列に丁度2石の連は「荷車」。荷車が取られそうになると荷物 (端の1石) だけが渡り、車輪側の1石は転がって盤に残る。',
            '荷車は捕まりにくい半値の連。縦2連や3連以上は普通の連。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 荷車 (4,4)-(5,4) を敵で囲む
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        board[3 * BOARD_SIZE + 4] = 2; board[3 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 6] = 2;
        board[5 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 最後の呼吸点を埋める
        // 荷車は1石だけ渡る
        assert('荷車は半分しか取れない', captures[2] === 1);
        const remain = board[4 * BOARD_SIZE + 4] + board[4 * BOARD_SIZE + 5];
        assert('車輪は盤に残る', remain === 1);
        captures = { 1: 0, 2: 0 };
        // 縦2連は普通に取れる
        board.fill(0);
        board[8 * BOARD_SIZE + 8] = 1; board[9 * BOARD_SIZE + 8] = 1;
        board[8 * BOARD_SIZE + 7] = 2; board[8 * BOARD_SIZE + 9] = 2;
        board[7 * BOARD_SIZE + 8] = 2; board[9 * BOARD_SIZE + 7] = 2; board[9 * BOARD_SIZE + 9] = 2;
        executeMove({ cells: [{ x: 8, y: 10 }] }, 2);
        assert('縦連はまるごと取れる', captures[2] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
