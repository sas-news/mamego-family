// FORMATIONGO — 密集碁: 着手は必ず既存の自石に直交隣接させる (隊形は1つの塊として育つ)
const K = require('../gen_kit.js');
module.exports = {
    file: 'formationgo.html',
    en: 'FORMATIONGO',
    jp: '密集碁',
    prefix: 'formationgo',
    desc: '自石に隣接する点にしか置けない。全軍が1つの密集隊形で戦う碁。',
    kind: 'stone',
    icon: 'formationgo',
    spec: [
        ...K.rb('FORMATIONGO', '密集碁', 'formationgo'),
        // 密集隊形: 自石が1つでも盤にあれば、着手は自石への直交隣接に限る
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 密集隊形: 自石が盤上にある間は、着手は自石の直交隣接に限る
            {
                let own = false;
                for (let i = 0; i < board.length; i++) if (board[i] === player) { own = true; break; }
                if (own) {
                    const ok = cells.some(p =>
                        getNeighbors(p.y * BOARD_SIZE + p.x).some(n => board[n] === player));
                    if (!ok) return false;
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.INFO_ALGO, `            密集碁: 自石に隣接する点にしか置けない (隊形は常に1つの塊)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自石が1つでも盤にあれば、着手は自分の石に直交隣接する点に限られる。',
            '全軍が1つの密集隊形として育つ。隊形が全滅すれば再び任意の点に布陣できる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('初手は任意点に置ける', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
        board[2 * BOARD_SIZE + 2] = 1;
        assert('自石隣接は合法', isValidPlacement([{ x: 3, y: 2 }], 1) === true);
        assert('非隣接は違法 (密集隊形)', isValidPlacement([{ x: 7, y: 7 }], 1) === false);
        assert('斜めは隣接とみなさない', isValidPlacement([{ x: 3, y: 3 }], 1) === false);
        // 全滅すれば再び自由配置
        board[2 * BOARD_SIZE + 2] = 0;
        assert('隊形全滅で自由配置に戻る', isValidPlacement([{ x: 7, y: 7 }], 1) === true);
    `,
};
