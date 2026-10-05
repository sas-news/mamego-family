// MARTYRGO — 殉教碁: 取られた連は道連れに、取跡に接する敵石を全て散らす
const K = require('../gen_kit.js');
module.exports = {
    file: 'martyrgo.html',
    en: 'MARTYRGO',
    jp: '殉教碁',
    prefix: 'martyrgo',
    desc: '取られた連は道連れを出す。取跡に接する敵石は全て散る。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('MARTYRGO', '殉教碁', 'martyrgo'),
        K.params([
            { key: 'martyr_range', label: '道連れの範囲', min: 1, max: 3, def: 1, hint: '取跡から何マス先まで道連れにするか' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.7, max: 2.5, def: 1.4, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 殉教: 取られた連の怨念で、取跡に接する敵石は全て道連れに散る
                const martyred = new Set();
                // 道連れ範囲: 取跡からチェビシェフ距離 martyr_range 以内の敵石
                const mr = Math.max(1, P('martyr_range') || 1);
                {
                    const ring = new Set(captured);
                    let fr = [...captured];
                    for (let r = 0; r < mr; r++) {
                        const nxt = [];
                        fr.forEach(idx => getNeighbors(idx).forEach(n => {
                            if (!ring.has(n)) { ring.add(n); nxt.push(n); }
                        }));
                        fr = nxt;
                    }
                    ring.forEach(n => { if (board[n] === player) martyred.add(n); });
                }
                if (martyred.size > 0) {
                    martyred.forEach(i => {
                        board[i] = 0;
                        // 道連れに散る演出: 怨嗟の紫煙
                        fxBurst(i, '#c084fc', 8, 1.4);
                        fxBurst(i, '#e9d5ff', 4, 0.9);
                    });
                    fxText(captured[0], '殉教', '#d8b4fe', 1000);
                    captures[opponent] += martyred.size;
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた連は殉教する: 取跡に接していた敵石は全て道連れに散る。',
            '囲んで取るたび囲んだ石も散る — 孤立した石ほど犠牲が小さい。',
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
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', board[5 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('接した敵石は全て道連れ', board[5 * BOARD_SIZE + 4] === 0 && board[5 * BOARD_SIZE + 6] === 0);
        assert('道連れ分は被害側の取り', captures[2] === 4);
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('通常着手は変化なし', board[3 * BOARD_SIZE + 3] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
