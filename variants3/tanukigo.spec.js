// TANUKIGO — 狸囃碁: 味方2石以上に囲まれた着手は腹鼓。隣の孤立敵石を1つ化かして連れ去る
const K = require('../gen_kit.js');
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
const ST_INIT = `{ lured: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tanukigo.html',
    en: 'TANUKIGO',
    jp: '狸囃碁',
    prefix: 'tanukigo',
    desc: '味方2石以上の輪に置くと腹鼓。隣の孤立した敵石を1つ化かして連れ去る。',
    kind: 'stone',
    icon: 'tanukigo',
    spec: [
        ...K.rb('TANUKIGO', '狸囃碁', 'tanukigo'),
        K.params([
            { key: 'need_own', label: '腹鼓に必要な隣接味方石', min: 1, max: 4, def: 2, unit: '個' },
            { key: 'lure_count', label: '化かして連れ去る数', min: 1, max: 3, def: 1, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.8, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        // 狸ルール: 味方2石以上に接する着手は腹鼓 — 隣の孤立敵石を幻惑して連れ去る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 狸囃: 味方2石以上に接して置くと腹鼓 — 隣の孤立した敵石を1つ連れ去る
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const own = getNeighbors(mi).filter(i => board[i] === player).length;
                if (own >= (P('need_own') || 2)) {
                    const strays = getNeighbors(mi).filter(i =>
                        board[i] === opponent && getNeighbors(i).every(n => board[n] !== opponent));
                    if (strays.length) {
                        strays.slice(0, P('lure_count') || 1).forEach(p => {
                            board[p] = 0;
                            captures[player]++;
                            st.lured[player]++;
                            fxBurst(p, '#f59e0b', 10, 1.5);
                            fxText(p, '化かし!', '#fbbf24', 1200);
                        });
                        fxGlow(mi, '#f59e0b', 700);
                        fxShake(4, 300);
                        cleanUpPieces();
                    } else {
                        fxText(mi, 'ポン…', '#fbbf24', 700);
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'化かし ' + st.lured[turn] + '匹'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            狸囃碁: 味方2石以上に接して置くと腹鼓。隣の孤立した敵石を1つ化かして連れ去る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '味方の石が2つ以上隣接する点に置くと狸が腹鼓を打つ。隣の「孤立した」敵石1つが幻惑されて連れ去られる (+1アゲハマ)。',
            '連に守られた敵石は化かせない。単石の孤立が命取りになる。両者同じ条件の対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.lured = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; // 味方2石
        board[6 * BOARD_SIZE + 5] = 2; // 孤立した敵石
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('腹鼓で孤立敵石を連れ去る', board[6 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        board[7 * BOARD_SIZE + 7] = 2; board[7 * BOARD_SIZE + 8] = 2; // 連のある敵
        board[6 * BOARD_SIZE + 6] = 1; board[6 * BOARD_SIZE + 8] = 1; // 味方2石
        executeMove({ cells: [{ x: 7, y: 6 }] }, 1);
        assert('連のある敵は化かせない', board[7 * BOARD_SIZE + 7] === 2 && board[7 * BOARD_SIZE + 8] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
