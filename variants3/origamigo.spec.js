// ORIGAMIGO — 折形碁: 盤上の折り目線(対角筋)に石を置くと折点が灯り、8本灯せば折形完成
const K = require('../gen_kit.js');
module.exports = {
    file: 'origamigo.html',
    en: 'ORIGAMIGO',
    jp: '折形碁',
    prefix: 'origamigo',
    desc: 'X字の折り目筋に石を置くと折点が灯る。折点を8つ灯した側が折形完成で勝ち。',
    kind: 'stone',
    icon: 'origamigo',
    spec: [
        ...K.rb('ORIGAMIGO', '折形碁', 'origamigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { folds: { 1: 0, 2: 0 }, lit: {} }; // 折点数と灯った折点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { folds: { 1: 0, 2: 0 }, lit: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { folds: { 1: 0, 2: 0 }, lit: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { folds: { 1: 0, 2: 0 }, lit: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { folds: { 1: 0, 2: 0 }, lit: {} };`],
        // 折り目: X字の対角筋
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function onCrease(x, y) {
            const m = BOARD_SIZE - 1;
            return x === y || x + y === m;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 折点: 折り目筋に石を置くとその点が灯る (石が取られると消える)
            {
                for (const k in st.lit) if (board[k] !== st.lit[k]) delete st.lit[k];
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (onCrease(move.cells[0].x, move.cells[0].y) && board[li] === player && !st.lit[li]) {
                    st.lit[li] = player;
                    st.folds[player]++;
                    fxGlow(li, '#fbbf24', 900);
                    fxText(li, '折点!', '#fbbf24', 1100);
                    if (st.folds[player] >= 8) {
                        winByRule(player, '折形完成', '折点を8つ灯しました'); return;
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 折り目の筋を描く
        K.CUE_STARS(`            // X字の折り目筋
            {
                const m = BOARD_SIZE - 1;
                ctx.save();
                ctx.strokeStyle = 'rgba(251,191,36,0.4)';
                ctx.setLineDash([cellSize * 0.25, cellSize * 0.18]);
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding + m * cellSize, padding + m * cellSize);
                ctx.moveTo(padding + m * cellSize, padding);
                ctx.lineTo(padding, padding + m * cellSize);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'折点 ' + st.folds[1] + '-' + st.folds[2]`),
        [K.ONE, K.INFO_ALGO, `            折形碁: X字の折り目筋に石を置いて折点を灯す。8つで折形完成<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤に金色のX字の折り目筋が走る。筋の上に石を置くとその点が灯り、折点+1。灯った点の石が取られると折点は消えず数は減らない — ただし同じ点は二度と数えない。',
            '先に8つの折点を灯した側が折形完成で勝ち。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { folds: { 1: 0, 2: 0 }, lit: {} };
        assert('折り目判定', onCrease(0, 0) === true && onCrease(0, 1) === false);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('折点が灯る', st.folds[1] === 1);
        // 折り目外は灯らない
        executeMove({ cells: [{ x: 1, y: 3 }] }, 1);
        assert('折り目外は灯らない', st.folds[1] === 1);
        st.folds[1] = 7;
        executeMove({ cells: [{ x: 4, y: BOARD_SIZE - 5 }] }, 1); // 対角筋上
        assert('8点で折形完成', gameOver === true && gameResultData && gameResultData.title.includes('折形'));
    `,
};
