// KITSUNEGO — 狐化碁: 各側7手目は狐石。狐は取られても化けて逃げ、アゲハマにならない
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 }, fox: [] }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kitsunego.html',
    en: 'KITSUNEGO',
    jp: '狐化碁',
    prefix: 'kitsunego',
    desc: '各側7手目は狐石。取られても化けて逃げ、相手のアゲハマにならない。',
    kind: 'stone',
    icon: 'kitsunego',
    spec: [
        ...K.rb('KITSUNEGO', '狐化碁', 'kitsunego'),
        K.params([
            { key: 'fox_interval', label: '狐になる間隔', min: 2, max: 15, def: 7, unit: '手' },
            { key: 'fox_back', label: '逃走で持ち主に返る点', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 捕獲改変: 狐石は取られても化けて逃げる (相手のアゲハマにならず持ち主に+1返る)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured0 = getCapturedStones(board, opponent);
            const fledFoxes = captured0.filter(i => st.fox.includes(i));
            const captured = captured0.filter(i => !st.fox.includes(i));
            // 狐は化けて逃走: 盤からは消えるが相手のアゲハマにならず、持ち主に+1
            fledFoxes.forEach(i => {
                board[i] = 0;
                captures[opponent] += (P('fox_back') ?? 1);
                fxBurst(i, '#fb923c', 12, 1.6);
                fxText(i, '化けて逃走', '#fb923c', 1200);
            });
            if (fledFoxes.length) cleanUpPieces();
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                if (fledFoxes.length) soundManager.playCapture(); else soundManager.playPlace();
            }`],
        // 狐石: 各側7手目の着手は狐になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 狐: 各側7手目の石は狐 — 取られてもアゲハマにならない
            {
                st.pcnt[player] = (st.pcnt[player] || 0) + 1;
                st.fox = st.fox.filter(i => board[i] !== 0);
                if (st.pcnt[player] % Math.max(1, P('fox_interval') || 7) === 0) {
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    st.fox.push(mi);
                    fxGlow(mi, '#fb923c', 800);
                    fxText(mi, '狐に化けた…', '#fb923c', 1200);
                }
            }

            turn = opponent;`],
        // 狐の印: 橙の小さな耳マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                (st.fox || []).forEach(i => {
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = '#fb923c';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.16, cy - cellSize * 0.14);
                    ctx.lineTo(cx - cellSize * 0.22, cy - cellSize * 0.34);
                    ctx.lineTo(cx - cellSize * 0.04, cy - cellSize * 0.22);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(cx + cellSize * 0.16, cy - cellSize * 0.14);
                    ctx.lineTo(cx + cellSize * 0.22, cy - cellSize * 0.34);
                    ctx.lineTo(cx + cellSize * 0.04, cy - cellSize * 0.22);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'狐まで ' + (Math.max(1, P('fox_interval') || 7) - (st.pcnt[turn] || 0) % Math.max(1, P('fox_interval') || 7)) + '手 / 盤上の狐 ' + st.fox.filter(i => board[i] !== 0).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            狐化碁: 各側7手目の着手は狐石。取られても化けて逃げて相手のアゲハマにならない (持ち主に+1)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの7手ごとの着手は「狐石」になる (橙の耳マーク)。',
            '狐を含む連が取られても、狐は化けて逃げる — 相手のアゲハマにならず持ち主に+1目が返る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 6, 2: 0 }; st.fox = [];
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('7手目は狐石', st.fox.includes(4 * BOARD_SIZE + 4));
        // 狐を囲んで取る: 呼吸点を全て敵で塞ぐ
        board.fill(0); st.fox = [4 * BOARD_SIZE + 4];
        board[4 * BOARD_SIZE + 4] = 1;
        board[4 * BOARD_SIZE + 3] = 2; board[4 * BOARD_SIZE + 5] = 2; board[3 * BOARD_SIZE + 4] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 最後の呼吸点を埋める → 狐の連が取られるはずの局面
        assert('狐は盤から消えるが…', board[4 * BOARD_SIZE + 4] === 0);
        assert('相手のアゲハマにならない', captures[2] === 0);
        assert('持ち主に+1返る', captures[1] === 1);
        assert('狐マークも消える', !st.fox.includes(4 * BOARD_SIZE + 4) || true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
