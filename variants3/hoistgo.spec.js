// HOISTGO — 吊上碁: 着手した石に隣接する敵石がちょうど1個なら、クレーンで1マス外側へ吊り上げ移動する
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
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'hoistgo.html',
    en: 'HOISTGO',
    jp: '吊上碁',
    prefix: 'hoistgo',
    desc: '置いた石に敵石がちょうど1個隣接すると、クレーンでその石を1マス外側へ吊り上げる。',
    kind: 'stone',
    icon: 'hoistgo',
    spec: [
        ...K.rb('HOISTGO', '吊上碁', 'hoistgo'),

        // 吊上げ: 着手点に敵石が1個だけ隣接 → その敵石を外側へ1マス移動
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 吊上碁: 着手点に敵石がちょうど1個隣接 → 直線の外側へ吊り上げ移動
            {
                const bc = move.cells[0];
                const pi = bc.y * BOARD_SIZE + bc.x;
                const foes = getNeighbors(pi).filter(n => board[n] === opponent);
                if (foes.length === 1) {
                    const fi = foes[0];
                    const dx = (fi % BOARD_SIZE) - bc.x, dy = Math.floor(fi / BOARD_SIZE) - bc.y;
                    const tx = (fi % BOARD_SIZE) + dx, ty = Math.floor(fi / BOARD_SIZE) + dy;
                    if (tx >= 0 && ty >= 0 && tx < BOARD_SIZE && ty < BOARD_SIZE) {
                        const ti = ty * BOARD_SIZE + tx;
                        if (board[ti] === 0) {
                            board[ti] = opponent;
                            board[fi] = 0;
                            fxSlide(fi, ti, 420);
                            fxText(ti, '吊上!', '#f472b6', 1100);
                        }
                    }
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            吊上碁: 置いた石に敵石がちょうど1個隣接すると、その石を1マス外側へ吊り上げ移動<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石に敵石がちょうど1個だけ隣接していると、クレーンがその敵石を直線の外側へ1マス吊り上げて移す。',
            '敵石が2個以上隣接、または行き先が空いていない場合は吊り上げない。',
            '取るのではなく「動かす」。敵の連を切り離し、呼吸点の計算を狂わせる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 6] = 2; // 敵石
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 隣接1個 → 吊り上げ
        assert('敵石が外側へ吊り上がる', board[4 * BOARD_SIZE + 7] === 2 && board[4 * BOARD_SIZE + 6] === 0);
        // 敵石2個隣接は吊り上げない
        board[2 * BOARD_SIZE + 2] = 2; board[2 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        assert('敵2個は吊り上げない', board[2 * BOARD_SIZE + 2] === 2 && board[2 * BOARD_SIZE + 4] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
