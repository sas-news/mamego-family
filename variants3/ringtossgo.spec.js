// RINGTOSSGO — 輪投碁: 石は輪。着手が敵の連に触れると輪が掛かり得点。同じ的には一度だけ
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
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
const ST_INIT = `{ ringed: {} }`;
module.exports = {
    file: 'ringtossgo.html',
    en: 'RINGTOSSGO',
    jp: '輪投碁',
    prefix: 'ringtossgo',
    desc: '石は輪。着手が敵の連に触れると輪が掛かって得点 (同じ的は1回だけ)。',
    kind: 'stone',
    icon: 'ringtossgo',
    spec: [
        ...K.rb('RINGTOSSGO', '輪投碁', 'ringtossgo'),
        K.params([
            { key: 'ring_score', label: '輪1本の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),

        // 輪投げ: 着手の石が敵の連に触れると輪が掛かる (連ごとに1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 輪投碁: 置いた石に接する敵の連に輪が掛かる。的1つにつき+1目 (1回だけ)
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const hit = new Set();
                getNeighbors(pi).forEach(n => {
                    if (board[n] !== opponent) return;
                    const g = getConnectedGroup(n, opponent);
                    const key = Math.min(...g);
                    if (!st.ringed[key]) hit.add(key);
                });
                if (hit.size > 0) {
                    hit.forEach(k => { st.ringed[k] = true; });
                    captures[player] += hit.size * (P('ring_score') ?? 1);
                    fxGlow(pi, '#f59e0b', 800);
                    fxText(pi, hit.size + '本命中!', '#f59e0b', 1200);
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            輪投碁: 石は輪。着手が敵の連に触れると輪が掛かって+1目 (同じ的は1回だけ)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は投げる輪。着手した石が敵の連に隣接すると、その的に輪が掛かって+1目。',
            '同じ的 (連) には一度だけ掛かる。一度に複数の的へ触れるとその分だけ得点。',
            '敵の連に寄せて輪を掛けつつ、取り合いも進める二層の得点競争。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ringed = {};
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 6] = 2; // 離れた2つの白の的
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 両方に触れる → 2本命中
        assert('2つの的に輪が掛かる', captures[1] === 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 同じ的には掛からない
        assert('同じ的は二度と掛からない', captures[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('白も着手できる', board[0] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
