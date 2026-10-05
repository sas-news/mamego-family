// MOLDGO — 黴碁: 孤立した石は黴となり、手番ごとに隣の空点へ増殖する
const K = require('../gen_kit.js');
module.exports = {
    file: 'moldgo.html',
    en: 'MOLDGO',
    jp: '黴碁',
    prefix: 'moldgo',
    desc: '孤立した石は黴。手番の終わりに隣の空点へ1つ増殖する。',
    kind: 'stone',
    spec: [
        ...K.rb('MOLDGO', '黴碁', 'moldgo'),
        K.params([
            { key: 'spread_prob', label: '増殖確率', min: 0.25, max: 1, def: 1, step: 0.05, hint: '孤立石1個につき増殖する確率' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 黴碁: 孤立した自石 (同連の隣石なし) が隣の空点に増殖する
            {
                const snapB = [...board];
                const loners = [];
                for (let i = 0; i < snapB.length; i++) {
                    if (snapB[i] !== player) continue;
                    if (getNeighbors(i).every(n => snapB[n] !== player)) loners.push(i);
                }
                let spread = 0;
                loners.forEach(l => {
                    if (Math.random() >= (P('spread_prob') ?? 1)) return;
                    const spot = getNeighbors(l).find(n => board[n] === 0);
                    if (spot !== undefined) {
                        board[spot] = player; spread++;
                        fxSplash(spot, '#84cc16', 6); // 胞子が飛ぶ
                        fxGlow(spot, '#65a30d', 480);
                    }
                });
                if (spread > 0) cleanUpPieces();
            }

            turn = opponent;`],
        K.CUE_STARS(`            // 黴の気配: 孤立石の周囲に胞子の点滅
            {
                ctx.save();
                ctx.fillStyle = 'rgba(110, 160, 70, 0.5)';
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (!getNeighbors(i).every(n => board[n] !== v)) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    getNeighbors(i).forEach(n => {
                        if (board[n] !== 0) return;
                        const nx = n % BOARD_SIZE, ny = Math.floor(n / BOARD_SIZE);
                        ctx.beginPath();
                        ctx.arc(padding + nx * cellSize, padding + ny * cellSize, cellSize * 0.09, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '自分の着手の終わりに、孤立した自石 (同連の隣石なし) が黴となり隣の空点へ1つ増殖する。',
            '孤立させるほど増える — 連に繋げば増殖は止まる。放置すると一面が黴だらけになる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('孤立石が増殖', board.filter(v => v === 1).length === 2);
        board.fill(0); pieces = [];
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1; // 連は増殖しない
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // (0,0) は孤立 → 増殖
        assert('連のある石は増殖しない', board[5 * BOARD_SIZE + 5] === 1 && board.filter(v => v === 1).length === 4); // 2連 + 孤立2
        board.fill(0); pieces = [];
        board[0] = 1; board[1] = 2; board[BOARD_SIZE] = 2; // 隅で包囲された孤立石
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('包囲された孤立石は増えない', board[0] === 1 && board[1] === 2 && board[BOARD_SIZE] === 2);
        assert('増殖先がないと増えない', getNeighbors(0).every(n => board[n] !== 1));
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
