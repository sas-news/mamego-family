// DEWGO — 露草碁: 24手ごとの早朝に石の周りへ露が降り、濡れた空点には10手の間打てない
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
const ST_INIT = `{ wet: {} }`;
module.exports = {
    file: 'dewgo.html',
    en: 'DEWGO',
    jp: '露草碁',
    prefix: 'dewgo',
    desc: '24手ごとの早朝に全石の周りへ露が降り、濡れた空点には10手の間打てない。',
    kind: 'stone',
    icon: 'dewgo',
    spec: [
        ...K.rb('DEWGO', '露草碁', 'dewgo'),
        ...ST(ST_INIT),
        // 濡れた空点には打てない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                const gi = p.y * BOARD_SIZE + p.x;
                if (board[gi] !== 0) return false;
                if (st.wet[gi] && st.wet[gi] >= history.length) return false; // 露で濡れている
            }`],
        // 朝露: 24手毎に全石の周囲の空点が濡れる (10手)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 朝露: 24手ごとに全石の上下左右の空点が濡れる (効果10手)
            if (history.length > 0 && history.length % 24 === 0) {
                const until = history.length + 10;
                board.forEach((v, i) => {
                    if (v === 1 || v === 2) {
                        getNeighbors(i).forEach(n => {
                            if (board[n] === 0) st.wet[n] = until;
                        });
                    }
                });
                fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '朝露!', '#7dd3fc', 1300);
            }
            // 乾いた露を掃除
            Object.keys(st.wet).forEach(k => { if (st.wet[k] < history.length || board[+k] !== 0) delete st.wet[k]; });

            turn = opponent;`],
        // 露の雫の描画
        ...K.CUE_STARS(`
            // 露の雫
            ctx.fillStyle = 'rgba(125,211,252,0.7)';
            Object.keys(st.wet).forEach(k => {
                const i = +k;
                if (st.wet[k] < history.length || board[i] !== 0) return;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.beginPath();
                ctx.ellipse(mx, my, cellSize * 0.10, cellSize * 0.14, 0, 0, Math.PI * 2);
                ctx.fill();
            });`),
        ...K.EVENT_CHIP_SPEC(`'露 ' + Object.keys(st.wet).filter(k => st.wet[k] >= history.length).length + '点'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            露草碁: 24手毎の早朝に全石の周りへ露が降り、濡れた空点には10手の間打てない<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '24手ごとの早朝に、全ての石の上下左右の空点が露で濡れる。',
            '濡れた空点には10手の間誰も打てない (雫マーク)。',
            '石の周りに展開したいなら朝露の前に済ませるか、乾くのを待つ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.wet = {};
        board[5 * BOARD_SIZE + 5] = 1;
        history.length = 23;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('石の隣が濡れる', st.wet[5 * BOARD_SIZE + 4] >= history.length);
        assert('濡れた所は打てない', !isValidPlacement([{ x: 4, y: 5 }], 2));
        assert('離れた所は打てる', isValidPlacement([{ x: 12, y: 12 }], 2) === true);
        // 10手経つと乾く
        history.length = 40;
        st.wet[5 * BOARD_SIZE + 4] = 33; // 期限切れ
        assert('乾けば打てる', isValidPlacement([{ x: 4, y: 5 }], 2) === true);
    `,
};
