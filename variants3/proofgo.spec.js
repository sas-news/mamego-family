// PROOFGO — 校閲碁: 敵連から1本だけで繋がった「誤植」石に朱を入れる。1箇所につき+1目 (各1回)
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
const ST_INIT = `{ marked: {} }`;
module.exports = {
    file: 'proofgo.html',
    en: 'PROOFGO',
    jp: '校閲碁',
    prefix: 'proofgo',
    desc: '敵石で連への繋がりが1本だけの「誤植」に朱が入り+1目。1箇所につき1回。',
    kind: 'stone',
    icon: 'proofgo',
    spec: [
        ...K.rb('PROOFGO', '校閲碁', 'proofgo'),
        ...ST(ST_INIT),

        // 朱入れ: 敵連のぶら下がり石 (同色隣接ちょうど1本) に+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 校閲碁: 敵の誤植 (連への繋がりが1本の石) に朱を入れて+1目
            {
                let markedNow = 0;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== opponent || st.marked[i]) continue;
                    const deg = getNeighbors(i).filter(n => board[n] === opponent).length;
                    if (deg === 1) {
                        st.marked[i] = 1;
                        captures[player]++;
                        markedNow++;
                        fxText(i, '朱!', '#ef4444', 900);
                    }
                }
                if (markedNow) fxShake(4, 240);
            }

            turn = opponent;`],
        // 朱の描画
        ...K.STONE_MARKS_SPEC(`            // 朱が入った敵石に赤丸
            for (let i = 0; i < board.length; i++) {
                if (!st.marked[i] || board[i] === 0) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(239,68,68,0.85)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.2, cy - cellSize * 0.2);
                ctx.lineTo(cx + cellSize * 0.2, cy + cellSize * 0.2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'朱 ' + Object.keys(st.marked || {}).length + '箇所'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            校閲碁: 敵連に1本だけで繋がる「誤植」石に自動で朱が入り+1目 (各1回)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵の石のうち、自連への繋がりが1本だけの「ぶら下がり石」は誤植 — あなたの手が終わるたび自動で朱が入り+1目。',
            '朱は各点1回のみ。相手も同様にあなたの誤植を指摘する。',
            '細く延びた連ほど誤植が多い。厚い連は校正済みの美しい文章。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.marked = {};
        // 白石2連: 両端とも繋がり1本 → 両方誤植
        board[4 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('誤植2箇所に朱', captures[1] === 2 && st.marked[4 * BOARD_SIZE + 4] && st.marked[4 * BOARD_SIZE + 5]);
        // 2x2の白石: 各石の同色隣接は2本以上 → 誤植なし
        board.fill(0); st.marked = {}; captures = { 1: 0, 2: 0 };
        board[6 * BOARD_SIZE + 6] = 2; board[6 * BOARD_SIZE + 7] = 2;
        board[7 * BOARD_SIZE + 6] = 2; board[7 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('厚い連は校正済み', captures[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
