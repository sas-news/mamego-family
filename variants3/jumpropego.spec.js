// JUMPROPEGO — 縄跳碁: 石は縄跳び。敵石を跳び越えて着地できる (跳んだ先が空なら)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'jumpropego.html',
    en: 'JUMPROPEGO',
    jp: '縄跳碁',
    prefix: 'jumpropego',
    desc: '石は縄跳び。敵石を跳び越えてその先の空点に着地する。',
    kind: 'stone',
    icon: 'jumpropego',
    spec: [
        ...K.rb('JUMPROPEGO', '縄跳碁', 'jumpropego'),
        K.params([
            { key: 'rope_dist', label: '跳越距離', min: 2, max: 4, def: 2, hint: '敵石からの着地先' },
        ]),
        // 縄跳び: 隣に敵石、その先が空なら、置いた石が敵石を跳び越えて着地
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 縄跳び: 直交方向に敵石 + その先が空点 → 跳び越えて着地
            {
                const bc = move.cells[0];
                const from = bc.y * BOARD_SIZE + bc.x;
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const mx = bc.x + dx, my = bc.y + dy;
                    const lx = bc.x + dx * (P('rope_dist') || 2), ly = bc.y + dy * (P('rope_dist') || 2);
                    if (lx < 0 || ly < 0 || lx >= BOARD_SIZE || ly >= BOARD_SIZE) continue;
                    if (board[my * BOARD_SIZE + mx] !== opponent) continue;
                    const land = ly * BOARD_SIZE + lx;
                    if (board[land] !== 0) continue;
                    // 着地: 跳んだ先で自分の連が窒息しない時のみ成立
                    board[from] = 0;
                    board[land] = player;
                    if (getCapturedStones(board, player).length > 0) {
                        board[from] = player;
                        board[land] = 0;
                        continue;
                    }
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: [{ x: lx, y: ly }] });
                    fxSlide(from, land, 420);
                    fxText(land, 'ジャンプ!', '#38bdf8', 900);
                    break;
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'敵石の先が空なら跳び越える'`),
        [K.ONE, K.INFO_ALGO, `            縄跳碁: 敵石の直上に置くと、その先が空いていれば跳び越えて着地<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石の隣に敵石があり、その向こう側が空いていれば敵石を跳び越えて着地する。',
            '跳び先で自分の連が窒息する場合は跳べない (置いた場所に残る)。',
            '跳び越えは両プレイヤーが使える位置取りの技。縄の隙間を見極めよう。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 白石を置き、その下に黒が置く → 黒は白石を跳び越えて上へ
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('敵石を跳び越えた', board[I(4, 3)] === 1);
        assert('元の場所は空く', board[I(4, 5)] === 0);
        // 跳び先が塞がっていれば跳ばない
        board[I(7, 6)] = 2; board[I(7, 7)] = 1;
        executeMove({ cells: [{ x: 7, y: 5 }] }, 1);
        assert('跳び先が塞がれば跳ばない', board[I(7, 5)] === 1 && board[I(7, 7)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
