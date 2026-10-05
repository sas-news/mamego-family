// RETREATGO — 退避碁: アタリになった孤立石は最後の呼吸点へ自動的に退避する
const K = require('../gen_kit.js');
module.exports = {
    file: 'retreatgo.html',
    en: 'RETREATGO',
    jp: '退避碁',
    prefix: 'retreatgo',
    desc: 'アタリの孤立石は最後の呼吸点へ自動退避。追いかけっこの碁。',
    kind: 'stone',
    icon: 'retreatgo',
    spec: [
        ...K.rb('RETREATGO', '退避碁', 'retreatgo'),
        K.params([
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 400, def: 140, step: 10, unit: '手' },
        ]),
        // 退避: 着手後、両軍の「孤立石かつ呼吸点1個」の石がその呼吸点へ滑り込む
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 退避: 孤立した石がアタリ (呼吸点1個) なら最後の呼吸点へ自動移動
            {
                const moved = [];
                for (let i = 0; i < board.length; i++) {
                    const c = board[i];
                    if (c !== 1 && c !== 2) continue;
                    const nbs = getNeighbors(i);
                    if (nbs.some(n => board[n] === c)) continue; // 連の一部は退避しない
                    const libs = nbs.filter(n => board[n] === 0);
                    if (libs.length !== 1) continue;
                    const to = libs[0];
                    board[i] = 0; board[to] = c;
                    moved.push([i, to]);
                }
                moved.forEach(([a, b]) => { fxSlide(a, b, 380); fxGlow(b, '#7dd3fc', 500); });
                if (moved.length) cleanUpPieces();
            }

            // 打ち切り終局
            if (history.length >= Math.max(10, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.INFO_BASE, `            退避碁: 孤立石がアタリになると自動で最後の呼吸点へ逃げる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '孤立した石 (同色と隣接していない石) がアタリになると、最後の呼吸点へ自動的に退避する。',
            '退避は両軍同じルール。連に組み込まれた石は退避しない — 単騎の石だけが逃げる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 白孤立石をアタリ状態にする: (2,2) を黒で囲み呼吸点は (2,1) のみ
        board[2 * BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 2] = 1;
        board[2 * BOARD_SIZE + 2] = 2;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 黒の他点着手 → 退避解決
        assert('アタリの孤立石が退避', board[2 * BOARD_SIZE + 2] === 0 && board[1 * BOARD_SIZE + 2] === 2);
        // 連の石は退避しない: 白の2連をアタリに
        board.fill(0); turn = 1;
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        board[3 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 5] = 1; // (6,4)のみ呼吸点
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // (6,4)を塞ぐと通常捕獲
        assert('連は退避せず取られる', board[4 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 5] === 0);
    `,
};
