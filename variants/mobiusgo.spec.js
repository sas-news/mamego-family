// MOBIUSGO — 帯環碁: 盤の左右端が半回転して繋がるメビウスの帯。
// 左端 (0,y) の隣は右端 (N-1, N-1-y)。表裏のない盤で戦う。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x係数を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'mobiusgo.html',
    en: 'MOBIUSGO',
    jp: '帯環碁',
    prefix: 'mobiusgo',
    desc: '左右の端が半回転して繋がるメビウス盤。端の先は反対側の端。',
    kind: 'stone',
    icon: 'mobiusgo',
    spec: [
        ...K.rb('MOBIUSGO', '帯環碁', 'mobiusgo'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // メビウス接続: 左端の外は右端の反転位置、右端の外は左端の反転位置
        [K.ONE, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`,
`        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];

            if (x > 0) neighbors.push(idx - 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE + (BOARD_SIZE - 1)); // メビウス: 左端の外は反転して右端
            if (x < BOARD_SIZE - 1) neighbors.push(idx + 1);
            else neighbors.push((BOARD_SIZE - 1 - y) * BOARD_SIZE); // メビウス: 右端の外は反転して左端
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`],
        // 端同士が反転接続する印
        ...K.WRAP_MARKS_SPEC(`                chev(padding, midC, -1, 0);
                chev(width - padding, midC, 1, 0);`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            帯環碁: 盤の左右端は半回転して繋がっている。左端の外は右端の反対側に出る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の左右端はメビウスの帯状に「半回転」で接続: (0,y) の外は (右端, N-1-y)。',
            '端を跨ぐ連・呼吸・取りはすべてこの接続で計算される。隅に逃げても回り込まれる。',
            'シェブロン印は左右端が繋がる目印。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const N = BOARD_SIZE;
        // (0,0) の隣は (N-1, N-1) に反転接続される
        assert('メビウス接続: 左端→反転右端', getNeighbors(0).includes((N - 1) * N + (N - 1)));
        assert('メビウス接続: 右端→反転左端', getNeighbors(N - 1).includes((N - 1) * N));
        // 端を跨ぐ連: (0,0)と(N-1,N-1)は連結する
        board[0] = 1; board[(N - 1) * N + (N - 1)] = 1;
        assert('端を跨いで連結', getConnectedGroup(0, 1).length === 2);
        // 端を跨ぐ取り: (N-1,N-1)の白を (0,0)側からも殺せる
        board.fill(0);
        board[(N - 1) * N + (N - 1)] = 2;
        board[(N - 2) * N + (N - 1)] = 1; board[(N - 1) * N + (N - 2)] = 1; board[0] = 1;
        assert('メビウス越しの捕捉', getCapturedStones(board, 2).includes((N - 1) * N + (N - 1)));
    `,
};
