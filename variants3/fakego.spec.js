// FAKEGO — 偽石碁: 自分の最初の石の1つは偽物。取られると正体が暴かれ、取った側からはアゲハマにならない
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ fake: { 1: -1, 2: -1 }, cnt: { 1: 0, 2: 0 } }`;
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
    file: 'fakego.html',
    en: 'FAKEGO',
    jp: '偽石碁',
    prefix: 'fakego',
    desc: '最初の石は偽物。取られると正体が暴かれ、取った側はアゲハマにならない。',
    kind: 'stone',
    icon: 'fakego',
    spec: [
        ...K.rb('FAKEGO', '偽石碁', 'fakego'),
        K.params([
            { key: 'fake_move', label: '偽石になる着手', options: [{ v: 1, l: '1手目' }, { v: 2, l: '2手目' }, { v: 3, l: '3手目' }, { v: 5, l: '5手目' }], def: 1 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 偽石: 各側の最初の着手は偽石。取られてもアゲハマにならず、その時点で正体が暴かれる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(cell => {
                board[cell.y * BOARD_SIZE + cell.x] = player;
            });
            st.cnt[player] = (st.cnt[player] || 0) + 1;
            if (st.cnt[player] === Math.max(1, P('fake_move') || 1) && st.fake[player] < 0) {
                st.fake[player] = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            }`],
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            let exposed = false;
            if (captured.length > 0 && captured.includes(st.fake[opponent])) {
                board[st.fake[opponent]] = 0; // 偽石は取られて正体を失う
                captured = captured.filter(i => i !== st.fake[opponent]);
                exposed = true;
                st.fake[opponent] = -1;
            }
            if (exposed) {
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '偽石!', '#f59e0b', 1400);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 自分の偽石を金色の点で密かに示す
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                if (st.fake[w] >= 0) {
                    const cx = padding + (st.fake[w] % BOARD_SIZE) * cellSize;
                    const cy = padding + ((st.fake[w] / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(245,158,11,0.8)';
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.22, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            })`),
        ...K.EVENT_CHIP_SPEC(`(st.cnt[turn] || 0) < (P('fake_move') || 1) ? (P('fake_move') || 1) + '手目の石は偽石' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            偽石碁: 各側の最初の石は偽物。取られると正体が暴かれ、取った側はアゲハマにならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの最初の着手は密かに偽石 (金色の点で示される)。',
            '偽石が取られると正体が暴かれ、取った側はその石をアゲハマにできない。',
            '偽石を囲いに組み込むブラフと見破りの読み合い。双方対称。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.fake = { 1: -1, 2: -1 }; st.first = { 1: true, 2: true };
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2); // 白の最初の石 = 偽石
        assert('最初の石は偽石', st.fake[2] === 4 * B + 4);
        board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 偽石を取る
        assert('偽石は盤から消える', board[4 * B + 4] === 0);
        assert('偽石はアゲハマにならない', captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
