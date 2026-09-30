// MIKOSHIGO — 神輿碁: 大連は神輿。6手ごとの揺れで各側の最大連の先端石が1つこぼれ落ちる
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
    file: 'mikoshigo.html',
    en: 'MIKOSHIGO',
    jp: '神輿碁',
    prefix: 'mikoshigo',
    desc: '大連は神輿。6手ごとの揺れで各側の最大連の先端石が1つこぼれ落ちる。',
    kind: 'stone',
    icon: 'mikoshigo',
    spec: [
        ...K.rb('MIKOSHIGO', '神輿碁', 'mikoshigo'),
        // 神輿の揺れ: 6手ごとに各側の最大連 (3石以上) の先端石がこぼれ落ちる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 神輿の揺れ: 6手ごとに各側の最大連の先端 (最も薄い繋がりの石) が1つこぼれる
            if (history.length % 6 === 0) {
                fxShake(6, 400);
                [1, 2].forEach(pl => {
                    const seen = new Set();
                    let biggest = [], tip = -1;
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== pl || seen.has(i)) continue;
                        const grp = getConnectedGroup(i, pl);
                        grp.forEach(g => seen.add(g));
                        if (grp.length > biggest.length) biggest = grp;
                    }
                    if (biggest.length < 3) return;
                    // 先端 = 連内の味方近傍が最も少ない石
                    let minBond = Infinity;
                    biggest.forEach(g => {
                        const bond = getNeighbors(g).filter(n => board[n] === pl).length;
                        if (bond < minBond) { minBond = bond; tip = g; }
                    });
                    if (tip >= 0) {
                        board[tip] = 0;
                        fxSplash(tip, '#fbbf24', 10);
                        fxText(tip, 'ドヨーン', '#f59e0b', 900);
                    }
                });
                cleanUpPieces();
                // こぼれた結果、窒息した連があれば取る (双方)
                [1, 2].forEach(pl => {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length > 0) {
                        dead.forEach(i => board[i] = 0);
                        captures[pl === 1 ? 2 : 1] += dead.length;
                        cleanUpPieces();
                    }
                });
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'神輿の揺れまで ' + (6 - history.length % 6) + '手'`),
        [K.ONE, K.INFO_ALGO, `            神輿碁: 6手ごとの揺れで各側の最大連 (3石以上) の先端石がこぼれ落ちる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6手ごとに神輿が揺れる — 各側の最大連 (3石以上) の先端石が1つこぼれ落ちる。',
            '連を大きくするほど揺れで先端を失いやすい。締まった連は揺れに強い。',
            '揺れは双方同時 — 大連の維持と分割のバランスが神輿の担ぎ手の腕。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒の大連: (4,4)-(4,7) 縦4石 — 先端は端の石
        board[I(4, 4)] = 1; board[I(4, 5)] = 1; board[I(4, 6)] = 1; board[I(4, 7)] = 1;
        // 5手進めて次で6手目 (揺れ)
        for (let k = 0; k < 5; k++) executeMove({ cells: [{ x: k, y: 0 }] }, k % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 2); // 6手目 → 揺れ
        const left = [I(4, 4), I(4, 5), I(4, 6), I(4, 7)].filter(i => board[i] === 1).length;
        assert('揺れで先端が1つこぼれる', left === 3);
        // 小連 (2石) はこぼれない
        board.fill(0); pieces = []; history.length = 0;
        board[I(6, 6)] = 1; board[I(6, 7)] = 1;
        for (let k = 0; k < 6; k++) executeMove({ cells: [{ x: k, y: 0 }] }, k % 2 === 0 ? 1 : 2);
        assert('小連は揺れに強い', board[I(6, 6)] === 1 && board[I(6, 7)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 12, y: 12 }], 1) === true);
    `,
};
