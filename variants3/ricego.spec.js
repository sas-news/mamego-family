// RICEGO — 蔵米碁: アゲハマは米として蔵に蓄わる。24手ごとの冬に米3俵を納め、足りない分だけ石が飢える
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
const ST_INIT = `{ rice: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'ricego.html',
    en: 'RICEGO',
    jp: '蔵米碁',
    prefix: 'ricego',
    desc: '取った石は米として蔵へ。24手毎の冬に米3俵を納め、不足分だけ自石が飢える。残り米は得点。',
    kind: 'stone',
    icon: 'ricego',
    spec: [
        ...K.rb('RICEGO', '蔵米碁', 'ricego'),
        K.params([
            { key: 'winter_interval', label: '冬の間隔', min: 8, max: 60, def: 24, unit: '手' },
            { key: 'tribute', label: '冬の納米量', min: 0, max: 9, def: 3, unit: '俵' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // アゲハマは米として蔵に入る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            st.rice[player] += captured.length; // アゲハマは米に
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 冬: 24手ごとに米3俵を納める。不足1俵ごとに自石1個が飢える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 冬の納米: 定期的。米を納め、不足分だけ自石が飢える
            if (history.length > 0 && history.length % Math.max(1, P('winter_interval') || 24) === 0) {
                const trib = Math.max(0, P('tribute') ?? 3);
                [1, 2].forEach(pl => {
                    const pay = Math.min(trib, st.rice[pl]);
                    st.rice[pl] -= pay;
                    let missing = trib - pay;
                    if (missing > 0) {
                        const own = [];
                        board.forEach((v, i) => { if (v === pl) own.push(i); });
                        // 全滅防止: 1個は残す
                        while (missing > 0 && own.length > 1) {
                            const vi = own.shift();
                            board[vi] = 0;
                            fxBurst(vi, '#a3a3a3', 6, 1.2);
                            missing--;
                        }
                        if (missing > 0) fxText(0, '飢饉!', '#a3a3a3', 1200);
                    }
                });
                fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '冬が来た', '#93c5fd', 1400);
                cleanUpPieces();
            }

            turn = opponent;`],
        // 蔵米を得点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.rice[1];
            const whiteTotal = territory.white + captures[2] + komi + st.rice[2];`],
        ...K.EVENT_CHIP_SPEC(`'蔵米 黒' + st.rice[1] + ' / 白' + st.rice[2]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            蔵米碁: アゲハマは米になる。24手毎の冬に3俵を納め、足りなければ自石が飢える。残米は得点<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を取るとその分だけ米が蔵に入る (アゲハマはそのまま得点にもなる)。',
            '24手ごとに冬が来る: 各プレイヤーは米3俵を納める。不足1俵ごとに自分の石が1個飢えて消える (最後の1個は残る)。',
            '終局時、蔵に残った米はそのまま自分の得点に加算される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.rice = { 1: 0, 2: 0 };
        // 白石を囲んで取り、米を得る (白0は既に呼吸0)
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        pieces.push({ p: 2, cells: [{ x: 0, y: 0 }] });
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        assert('取った石が米になる', st.rice[1] === 1);
        // 冬の納米: 米不足で石が飢える
        history.length = 23;
        st.rice[1] = 1; st.rice[2] = 3;
        // 白石を2個置く (飢え確認用)
        board[5] = 2; board[6] = 2;
        executeMove({ cells: [{ x: 10, y: 10 }] }, 1);
        assert('白は米を納めた', st.rice[2] === 0);
        assert('黒は1俵納めて枯れた', st.rice[1] === 0);
        const whiteLeft = board.filter(v => v === 2).length;
        const blackLeft = board.filter(v => v === 1).length;
        assert('米を払った白は飢えない', whiteLeft === 2);
        assert('黒は2個飢えた (2俵不足)', blackLeft === 2);
    `,
};
