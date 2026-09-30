// THREELEGGO — 二人三碁: 自分の石がある限り、着手は既存の自分の石に必ず隣接しなければならない
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
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
    file: 'threeleggo.html',
    en: 'THREELEGGO',
    jp: '二人三碁',
    prefix: 'threeleggo',
    desc: '自分の石がある限り、着手は必ず既存の石に隣接。繋がって歩く碁。',
    kind: 'stone',
    icon: 'threeleggo',
    spec: [
        ...K.rb('THREELEGGO', '二人三碁', 'threeleggo'),
        // 連動着手: 盤上に自分の石がある限り、新しい石は既存の石に隣接必須
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 二人三碁: 自分の石が1つでもあれば、新しい着手は既存の石に隣接必須
            if (board.includes(player)
                && !cells.some(p => getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player))) return false;`],
        ...K.EVENT_CHIP_SPEC(`board.includes(turn) ? '既存の石に隣接して打て' : '初手は自由'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            二人三碁: 自分の石がある限り、着手は必ず既存の自分の石に隣接する (二人三脚のように連動)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上に自分の石が1つでもあれば、新しい着手は既存の石に隣接した点に限られる。',
            '全ての石が繋がって伸びていく二人三脚の碁。全滅すれば再び自由に打てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('初手はどこでも可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('非隣接は不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('隣接は可', isValidPlacement([{ x: 5, y: 6 }], 1) === true);
        assert('白は未着手なので自由', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('白も2手目は隣接必須', isValidPlacement([{ x: 8, y: 8 }], 2) === false);
        assert('白も隣接なら可', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
    `,
};
