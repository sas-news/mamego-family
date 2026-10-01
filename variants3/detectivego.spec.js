// DETECTIVEGO — 推理碁: 相手の次の最有力手を「推理」表示。読みが当たれば+2目
const K = require('../gen_kit.js');
module.exports = {
    file: 'detectivego.html',
    en: 'DETECTIVEGO',
    jp: '推理碁',
    prefix: 'detectivego',
    desc: '相手の次の最有力手を推理表示。相手がその近くに打てば読み的中で+2目。',
    kind: 'stone',
    icon: 'detectivego',
    spec: [
        ...K.rb('DETECTIVEGO', '推理碁', 'detectivego'),
        K.params([
            { key: 'pred_pt', label: '読み的中の得点', min: 1, max: 6, def: 2, unit: '目' },
            { key: 'pred_range', label: '的中とみなす範囲', min: 0, max: 2, def: 1, hint: '推理点からの距離' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pred: -1 }; // 推理碁: 次の手番への推理点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pred: -1 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pred: -1 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pred: -1 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pred: -1 };`],
        [K.ONE, '        function executeMove(move, player) {',
`        // 推理碁: 指定プレイヤーの現局面での最有力手を評価して推理する
        function predictIdx(player) {
            let best = -1, bestScore = -Infinity;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y * BOARD_SIZE + x] !== 0) continue;
                if (!isValidPlacement([{ x, y }], player)) continue;
                const s = rateMove([{ x, y }], player);
                if (s > bestScore) { bestScore = s; best = y * BOARD_SIZE + x; }
            }
            return best;
        }

        function executeMove(move, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 推理ルール: 直前に推理した点の8近傍に相手が打った → 読み的中で+2目
            if (st.pred >= 0) {
                const px = st.pred % BOARD_SIZE, py = Math.floor(st.pred / BOARD_SIZE);
                const p = move.cells[0];
                const pr = P('pred_range') ?? 1;
                if (Math.abs(p.x - px) <= pr && Math.abs(p.y - py) <= pr) {
                    const predictor = player === 1 ? 2 : 1;
                    captures[predictor] += (P('pred_pt') || 2);
                    fxGlow(st.pred, '#34d399', 900);
                    fxText(st.pred, '読み的中 +' + (P('pred_pt') || 2), '#34d399', 1300);
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                endGameByScore();
                return;
            }

            // 相手の次の一手を推理して表示する
            st.pred = predictIdx(opponent);
            if (st.pred >= 0) fxGlow(st.pred, '#38bdf8', 600);

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`st.pred >= 0 ? '推理 (' + (st.pred % BOARD_SIZE) + ',' + Math.floor(st.pred / BOARD_SIZE) + ')' : '推理なし'`),
        // 推理点に「?」の虫眼鏡マーク
        ...K.STONE_MARKS_SPEC(`            if (st.pred >= 0 && board[st.pred] === 0) {
                const cx = padding + (st.pred % BOARD_SIZE) * cellSize;
                const cy = padding + Math.floor(st.pred / BOARD_SIZE) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.44) + 'px sans-serif';
                ctx.fillText('?', cx, cy + cellSize * 0.02);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            推理碁: 相手の次の最有力手を推理表示。読みが的中すると+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '毎手ごと、名探偵が相手の次の最有力手を推理して盤上に「?」で示す。',
            '相手が推理した点の8近傍に打てば読み的中: 推理した側に+2目。',
            '推理を読んで意表の手を突くか、あえて本命を読み合うか。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof predictIdx === 'function');
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('着手後に推理が立つ', st.pred >= 0);
        // 推理点の近くに相手が打つ → 推理者(黒)+2
        const px = st.pred % BOARD_SIZE, py = Math.floor(st.pred / BOARD_SIZE);
        executeMove({ cells: [{ x: px, y: py }] }, 2);
        assert('読み的中で+2', captures[1] === 2);
        // 外れた場合はボーナスなし
        st.pred = 0;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1);
        assert('外れなら増えない', captures[2] === 0);
    `,
};
