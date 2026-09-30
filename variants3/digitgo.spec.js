// DIGITGO — 位取碁: 取った石はその列の「位」(x座標を3で割った余り+1) の目数になる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'digitgo.html',
    en: 'DIGITGO',
    jp: '位取碁',
    prefix: 'digitgo',
    desc: '取った石はその列の位取り値 (1・2・3目) になる。高位の石ほど取る価値が大きい。',
    kind: 'stone',
    icon: 'digitgo',
    spec: [
        ...K.rb('DIGITGO', '位取碁', 'digitgo'),
        // 位取り: 捕獲した石1つにつき 列の位 (x%3+1) 目を得る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let gain = 0;
                captured.forEach(idx => {
                    board[idx] = 0;
                    const v = (idx % BOARD_SIZE) % 3 + 1; // 位取り値: 列を3で割った余り+1
                    gain += v;
                    if (v >= 3) fxText(idx, '+' + v + '目', '#facc15', 1100);
                });
                captures[player] += gain;
                fxShake(3, 240);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 列の位を色分け (高位ほど濃い琥珀色)
        K.CUE_GRID(`            // 位取り: x%3==2 の高位列を琥珀色に染める
            {
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = x % 3 + 1;
                    if (v < 2) continue;
                    const cx = padding + x * cellSize;
                    ctx.fillStyle = v === 3 ? 'rgba(250,204,21,0.16)' : 'rgba(250,204,21,0.07)';
                    ctx.fillRect(cx - cellSize / 2, padding - cellSize * 0.5, cellSize, BOARD_SIZE * cellSize);
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            位取碁: 取った石はその列の位 (1・2・3目) の値になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各列に「位」がある — x座標を3で割った余り+1 (1・2・3) がその列の石の目数。',
            '琥珀に染まった高位列の石を取ると1つ3目。低位列は1つ1目。高位の攻防が勝敗を分ける。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 高位列 (x=2: 2%3+1=3目) の白石を囲んで取る
        board[I(2, 4)] = 2;
        board[I(1, 4)] = 1; board[I(3, 4)] = 1; board[I(2, 3)] = 1;
        executeMove({ cells: [{ x: 2, y: 5 }] }, 1);
        assert('高位の石は3目', captures[1] === 3 && board[I(2, 4)] === 0);
        // 低位列 (x=0: 1目)
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[I(0, 4)] = 2;
        board[I(1, 4)] = 1; board[I(0, 3)] = 1;
        executeMove({ cells: [{ x: 0, y: 5 }] }, 1);
        assert('低位の石は1目', captures[1] === 1);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
