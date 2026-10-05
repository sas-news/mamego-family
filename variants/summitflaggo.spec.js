// SUMMITFLAGGO — 登頂碁2: 天元の山頂に自分の石を立て、相手の1手を耐え抜けば登頂成功で勝ち
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
const ST_INIT = `{ flag: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'summitflaggo.html',
    en: 'SUMMITFLAGGO',
    jp: '登頂碁2',
    prefix: 'summitflaggo',
    desc: '天元の山頂に旗(石)を立て、相手の1手を耐え抜けば登頂成功。中央を巡る攻防。',
    kind: 'stone',
    icon: 'summitflaggo',
    spec: [
        ...K.rb('SUMMITFLAGGO', '登頂碁2', 'summitflaggo'),
        K.params([
            { key: 'hold_turns', label: '旗を立て続ける手数', min: 1, max: 6, def: 2, unit: '手' },
        ]),
        ...ST(ST_INIT),

        // 登頂勝利ルール
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 山頂の絵
        K.CUE_STARS(`            // 山頂: 天元に小さな山と旗竿の印
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                if (board[c * BOARD_SIZE + c] === 0) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(110,90,60,0.35)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.26);
                    ctx.lineTo(cx - cellSize * 0.3, cy + cellSize * 0.18);
                    ctx.lineTo(cx + cellSize * 0.3, cy + cellSize * 0.18);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(220,60,60,0.6)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.26);
                    ctx.lineTo(cx, cy - cellSize * 0.44);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(220,60,60,0.7)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.44);
                    ctx.lineTo(cx + cellSize * 0.16, cy - cellSize * 0.4);
                    ctx.lineTo(cx, cy - cellSize * 0.34);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }`),
        // 登頂判定: 天元に自石がある状態で自分の手番を終えた回数が2で勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 登頂碁2: 天元に自石を立てて相手の1手を耐えると登頂成功
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const top = c * BOARD_SIZE + c;
                if (board[top] === player) {
                    st.flag[player]++;
                    if (st.flag[player] >= (P('hold_turns') || 2)) {
                        fxGlow(top, '#facc15', 950);
                        fxText(top, '登頂!', '#facc15', 1400);
                        fxShake(6, 360);
                        winByRule(player, '登頂成功', '山頂の旗を守り抜きました');
                        return;
                    }
                    fxText(top, '旗を掲げた!', '#fbbf24', 1200);
                } else {
                    st.flag[player] = 0;
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(st.flag[1] ? '黒旗' : '') + (st.flag[2] ? '白旗' : '') || '山頂フリー'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            登頂碁2: 天元の山頂に旗(石)を立て、相手の1手を耐え抜けば登頂成功で勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '天元に自分の石を置くと「旗を掲げた」状態。そのまま相手の手番を耐えれば登頂成功で即勝ち。',
            '旗は普通の石 — 相手は取る・潰す・引きずり下ろす1手の猶予がある。',
            '中央を制する者が勝つ。地の勝負に並走するもうひとつの決着点。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.flag = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1); // 黒、旗を立てる
        assert('旗が立つ', st.flag[1] === 1 && board[c * BOARD_SIZE + c] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1); // 耐えた
        assert('登頂成功で終局', gameOver === true);
        assert('勝者は黒', gameResultData && gameResultData.title.indexOf('黒') === 0);
    `,
};
