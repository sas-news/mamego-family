// MATCHGO — 三消碁: 同色3連以上の並びが消えて着手者の得点になる
const K = require('../gen_kit.js');
module.exports = {
    file: 'matchgo.html',
    en: 'MATCHGO',
    jp: '三消碁',
    prefix: 'matchgo',
    desc: '同色3連の並びが消えて得点に。連を伸ばしすぎると自分も消える。',
    kind: 'stone',
    spec: [
        ...K.rb('MATCHGO', '三消碁', 'matchgo'),
        K.params([
            { key: 'match_len', label: '消滅する連の長さ', min: 2, max: 6, def: 3, hint: 'この長さ以上の同色連が消える' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.7, max: 2.5, def: 1.4, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 三消: 縦横の同色3連以上が全て消え、消えた数だけ着手者の得点に
            {
                const vanish = new Set();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    let run = 1;
                    for (let x = 1; x <= BOARD_SIZE; x++) {
                        const cur = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : -1;
                        const prv = board[y * BOARD_SIZE + x - 1];
                        if (x < BOARD_SIZE && cur === prv && (cur === 1 || cur === 2)) { run++; }
                        else {
                            if (run >= (P('match_len') || 3)) for (let k = x - run; k < x; k++) vanish.add(y * BOARD_SIZE + k);
                            run = 1;
                        }
                    }
                }
                for (let x = 0; x < BOARD_SIZE; x++) {
                    let run = 1;
                    for (let y = 1; y <= BOARD_SIZE; y++) {
                        const cur = y < BOARD_SIZE ? board[y * BOARD_SIZE + x] : -1;
                        const prv = board[(y - 1) * BOARD_SIZE + x];
                        if (y < BOARD_SIZE && cur === prv && (cur === 1 || cur === 2)) { run++; }
                        else {
                            if (run >= (P('match_len') || 3)) for (let k = y - run; k < y; k++) vanish.add(k * BOARD_SIZE + x);
                            run = 1;
                        }
                    }
                }
                if (vanish.size > 0) {
                    vanish.forEach(i => {
                        const c = board[i];
                        board[i] = 0;
                        fxBurst(i, c === 1 ? '#6b7280' : '#f9fafb', 10, 1.6);
                        fxBurst(i, c === 1 ? '#374151' : '#e5e7eb', 6, 1.1);
                    });
                    captures[player] += vanish.size;
                    cleanUpPieces();
                    const vi = vanish.values().next().value;
                    fxText(vi, vanish.size + '連消!', '#f472b6', 1200);
                    fxShake(Math.min(6, 2 + vanish.size), 300);
                }
            }

            turn = opponent;`],
        [K.ONE, K.INFO_ALGO, `            三消碁: 同色3連以上の並びが消えて着手者の得点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手後、縦横に3連以上つながった同色の石は全て消滅し、着手者のアゲハマ得点になる。',
            '相手の列を伸ばして消すか、自分の3連を収穫して得点にするか — 長い連は危険な財産。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // 打ち切り手数は設定で調整可能
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 新規対局 (履歴空) で打ち切りを再武装
            if (moveCapFired && history.length === 0) moveCapFired = false;
            // 打ち切り手数: 交点数の1.4倍を超える長期戦は死に石選択へ移行して自動終局
            // (1局につき1回のみ発火。死に石選択を取り消して続行する場合は再発火しない)
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.4))) {
                moveCapFired = true;
                startDeadStoneSelectionPhase();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[0] = 1; board[1] = 1;
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('3連は消滅', board[0] === 0 && board[1] === 0 && board[2] === 0);
        assert('消えた分は得点', captures[1] === 3);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[0] = 1; board[1] = 1;
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        assert('2連は残る', board[0] === 1 && board[1] === 1 && captures[1] === 0);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
