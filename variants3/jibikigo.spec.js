// JIBIKIGO — 地引碁: 1手で4個以上の敵石を獲ると「大漁」となり、その分の得点が2倍になる
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
const ST_INIT = `{ haul: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'jibikigo.html',
    en: 'JIBIKIGO',
    jp: '地引碁',
    prefix: 'jibikigo',
    desc: '1手で4個以上獲れば大漁。獲った石は終局時に2倍計上される。',
    kind: 'stone',
    icon: 'jibikigo',
    spec: [
        ...K.rb('JIBIKIGO', '地引碁', 'jibikigo'),
        K.params([
            { key: 'haul_min', label: '大漁に必要な捕獲数', min: 2, max: 8, def: 4, unit: '石' },
        ]),
        ...ST(ST_INIT),
        // 大漁: 1手の捕獲が4個以上なら漁獲として別計上 (終局時にもう1回数える)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // 地引網: 4個以上の一網打尽は大漁 (終局時に2倍計上)
                if (captured.length >= (P('haul_min') || 4)) {
                    st.haul[player] += captured.length;
                    captured.forEach(i => fxBurst(i, '#38bdf8', 6, 1.3));
                    fxText(captured[0], '大漁!', '#0ea5e9', 1200);
                }
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 漁獲集計: 大漁の石はもう一度数える
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 地引ルール: 大漁の獲物は2倍計上 (アゲハマにもう一度加算)
            territory.black += st.haul[1];
            territory.white += st.haul[2];`],
        ...K.EVENT_CHIP_SPEC(`'大漁 黒' + (st.haul ? st.haul[1] : 0) + ' 白' + (st.haul ? st.haul[2] : 0)`),
        [K.ONE, K.INFO_BASE, `            地引碁: 1手で4個以上を獲れば大漁 — 獲物は終局時2倍計上<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '1手で4個以上の敵石をまとめて取ると「大漁」。獲った石はアゲハマに加え終局時にもう1回数えられる。',
            '大きな連を育てて一網打尽にするか、小さく切り裂いて大漁を逃すか。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        // 白の2x2 (4個) を囲んで一網打尽
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 }; st.haul = { 1: 0, 2: 0 };
        board[I(4, 4)] = 2; board[I(5, 4)] = 2; board[I(4, 5)] = 2; board[I(5, 5)] = 2;
        [[3,4],[4,3],[3,5],[6,4],[5,3],[6,5],[5,6]].forEach(([x, y]) => { board[I(x, y)] = 1; });
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1); // 最後の呼吸点を塞ぐ
        assert('4個取れた', captures[1] === 4);
        assert('大漁計上された', st.haul[1] === 4);
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 }; st.haul = { 1: 0, 2: 0 };
        board[I(5, 0)] = 2; board[I(4, 0)] = 1; board[I(6, 0)] = 1;
        executeMove({ cells: [{ x: 5, y: 1 }] }, 1); // 1個だけ取る
        assert('3個未満は大漁でない', st.haul[1] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
