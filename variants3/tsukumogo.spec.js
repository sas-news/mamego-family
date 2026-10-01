// TSUKUMOGO — 付喪碁: 持ち主の手を8回生き延びた古い石は付喪神に化けて敵色になる
const K = require('../gen_kit.js');
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
const ST_INIT = `{ age: {} }`; // 石の齢 idx → 持ち主が何手過ごしたか
module.exports = {
    file: 'tsukumogo.html',
    en: 'TSUKUMOGO',
    jp: '付喪碁',
    prefix: 'tsukumogo',
    desc: '8手生き延びた古い石は付喪神に化けて敵色になる。育てるも捨てるも駆け引き。',
    kind: 'stone',
    icon: 'tsukumogo',
    spec: [
        ...K.rb('TSUKUMOGO', '付喪碁', 'tsukumogo'),
        K.params([
            { key: 'tsukumo_age', label: '化ける歳数', min: 3, max: 20, def: 8, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        // 自分の手番ごとに自分の石は歳を取り、8歳で付喪神に化けて敵色になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 付喪碁: 古い道具 (8歳の石) は化けて敵になる
            Object.keys(st.age).forEach(k => {
                if (board[+k] === 0) delete st.age[k];
            });
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                st.age[i] = (st.age[i] || 0) + 1;
                if (st.age[i] >= Math.max(1, P('tsukumo_age') || 8)) {
                    board[i] = opponent;
                    delete st.age[i];
                    fxBurst(i, '#a78bfa', 12, 1.6);
                    fxText(i, '化けた!', '#c4b5fd', 1100);
                }
            }
            cleanUpPieces();

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 老いた石: 齢6以上の石に妖気の滲み
            {
                ctx.save();
                for (const k in st.age) {
                    const i = +k;
                    if ((st.age[k] || 0) < Math.max(1, (P('tsukumo_age') || 8) - 2) || board[i] === 0) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(167,139,250,' + (0.3 + st.age[k] * 0.06) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            付喪碁: 持ち主の手を8回生き延びた古い石は付喪神に化けて敵色になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は持ち主の手番ごとに歳を取る。8歳まで生き延びた石は付喪神に化けて敵色に寝返る。',
            '古い連を置き去りにすると裏切られる。取られるか手放すかの駆け引きがある。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.age = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('新しい石は1歳', st.age[4 * BOARD_SIZE + 4] === 1);
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        assert('7手で7歳', st.age[4 * BOARD_SIZE + 4] === 7);
        executeMove({ cells: [{ x: 7, y: 0 }] }, 1); // 8歳 → 化ける
        assert('8歳で敵色に化ける', board[4 * BOARD_SIZE + 4] === 2 && st.age[4 * BOARD_SIZE + 4] === undefined);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 白の手番 — 化けた石は白側として歳を取り直す
        assert('化けた石は白のものとして歳を取る', st.age[4 * BOARD_SIZE + 4] === 1);
    `,
};
