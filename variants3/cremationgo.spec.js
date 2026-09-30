// CREMATIONGO — 荼毘碁: 取られた石は荼毘に付され、灰(4)を残し、供養で+1目を得る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'cremationgo.html',
    en: 'CREMATIONGO',
    jp: '荼毘碁',
    prefix: 'cremationgo',
    desc: '取られた石は荼毘に付され灰を残す。供養で+1目を得る。灰は6手で風に還る。',
    kind: 'stone',
    icon: 'cremationgo',
    spec: [
        ...K.rb('CREMATIONGO', '荼毘碁', 'cremationgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 }, ash: {} }; // 供養点・灰の生成手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 }, ash: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 }, ash: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 }, ash: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 }, ash: {} };`],
        // 荼毘: 取られた石は灰 (4) になり、取った側は供養で+1目
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 4; // 荼毘に付されて灰になる
                    st.ash[idx] = history.length;
                    captures[player]++;
                    st.bonus[player]++; // 供養点
                    fxBurst(idx, '#f97316', 10, 1.4);
                });
                fxShake(3, 300);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 灰は6手で風に還る
            {
                Object.keys(st.ash).forEach(k => {
                    const i = +k;
                    if (board[i] !== 4) { delete st.ash[i]; return; }
                    if (history.length - st.ash[i] >= 6) {
                        board[i] = 0;
                        delete st.ash[i];
                        fxGlow(i, '#d6d3d1', 600);
                    }
                });
            }

            turn = opponent;`],
        // 灰の描画: 白っぽい灰の小山
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            ctx.fillStyle = '#d6d3d1';
            ctx.beginPath();
            ctx.moveTo(cx - cs * 0.3, cy + cs * 0.2);
            ctx.quadraticCurveTo(cx, cy - cs * 0.28, cx + cs * 0.3, cy + cs * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#a8a29e';
            ctx.lineWidth = Math.max(1, cs * 0.035);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の供養:</span> <strong>\${st.bonus[1]}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の供養:</span> <strong>\${st.bonus[2]}目</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'供養 +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            荼毘碁: 取られた石は灰を残し、供養で+1目を得る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石は荼毘に付され、その場に灰の小山を残す — 灰には6手の間置けない。',
            '取るたびに供養+1目。死石の供養がそのまま得点になる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, ash: {} };
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('灰が残る', board[I(4, 4)] === 4 && captures[1] === 1);
        assert('供養+1目', st.bonus[1] === 1);
        assert('灰には置けない', isValidPlacement([{ x: 4, y: 4 }], 2) === false);
        history.length = 8;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('6手で灰が還る', board[I(4, 4)] === 0);
    `,
};
