// ALCHEGO — 錬成碁: 取ると最も危ない自石1個が錬成され、取跡へ転移する
const K = require('../gen_kit.js');
module.exports = {
    file: 'alchego.html',
    en: 'ALCHEGO',
    jp: '錬成碁',
    prefix: 'alchego',
    desc: '取ると最も危ない自石1個が取跡へ転移する。弱い石を錬成で救う。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('ALCHEGO', '錬成碁', 'alchego'),
        K.params([
            { key: 'trans_count', label: '錬成する石の数', min: 1, max: 3, def: 1, unit: '個' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 錬成: 最も呼吸点の少ない自連の石が取跡へ転移する (個数は設定で調整)
                {
                    const nTrans = Math.min(Math.max(1, P('trans_count') || 1), captured.length);
                    for (let tk = 0; tk < nTrans; tk++) {
                        let src = -1, srcLib = 99;
                        const seen = new Set();
                        for (let i = 0; i < board.length; i++) {
                            if (board[i] !== player || seen.has(i)) continue;
                            getConnectedGroup(i, player).forEach(g => seen.add(g));
                            const l = getLiberties(board, i);
                            if (l < srcLib) { srcLib = l; src = i; }
                        }
                        if (src < 0) break;
                        board[src] = 0;
                        board[captured[tk]] = player;
                        // 錬成転移: 最弱の自石が取跡へ滑る
                        fxSlide(src, captured[tk], 460);
                        fxGlow(captured[tk], 'rgba(192,132,252,0.95)', 820);
                        fxText(captured[tk], '錬成', '#c084fc', 1000);
                    }
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
            '敵連を取ると、最も呼吸点の少ない自連の石1個が錬成されて取跡へ転移する。',
            '危ない石を自動で助けてくれるが、繋がりが断たれる隙も生まれる。',
        ])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[0] = 1; // 隅の危ない黒 (呼吸点2)
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', captures[1] === 1);
        assert('最弱の自石が取跡へ転移', board[5 * BOARD_SIZE + 5] === 1);
        assert('転移元は空く', board[0] === 0);
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('取りなしなら転移なし', board[3 * BOARD_SIZE + 3] === 1);
    `,
};
