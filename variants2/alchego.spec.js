// ALCHEGO — 錬成碁: 取ると最も危ない自石1個が錬成され、取跡へ転移する
const K = require('../gen_kit.js');
module.exports = {
    file: 'alchego.html',
    en: 'ALCHEGO',
    jp: '錬成碁',
    prefix: 'alchego',
    desc: '取ると最も危ない自石1個が取跡へ転移する。弱い石を錬成で救う。',
    kind: 'stone',
    spec: [
        ...K.rb('ALCHEGO', '錬成碁', 'alchego'),
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                // 錬成: 最も呼吸点の少ない自連の石1個が取跡へ転移する
                {
                    let src = -1, srcLib = 99;
                    const seen = new Set();
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== player || seen.has(i)) continue;
                        getConnectedGroup(i, player).forEach(g => seen.add(g));
                        const l = getLiberties(board, i);
                        if (l < srcLib) { srcLib = l; src = i; }
                    }
                    if (src >= 0) {
                        board[src] = 0;
                        board[captured[0]] = player;
                    }
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取ると、最も呼吸点の少ない自連の石1個が錬成されて取跡へ転移する。',
            '危ない石を自動で助けてくれるが、繋がりが断たれる隙も生まれる。',
        ])],
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
