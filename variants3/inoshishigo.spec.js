// INOSHISHIGO — 野猪碁: 前の石と同じ行/列に3目以上離れて置くと猪が突進し、間の敵石を掘り起こす
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
const ST_INIT = `{ last: { 1: -1, 2: -1 }, furrows: [] }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'inoshishigo.html',
    en: 'INOSHISHIGO',
    jp: '野猪碁',
    prefix: 'inoshishigo',
    desc: '前の石と同じ行/列に3目以上離れて置くと猪が突進。間の敵石を掘り起こす。',
    kind: 'stone',
    icon: 'inoshishigo',
    spec: [
        ...K.rb('INOSHISHIGO', '野猪碁', 'inoshishigo'),
        K.params([
            { key: 'charge_dist', label: '突進に必要な距離', min: 2, max: 6, def: 3, unit: '目' },
        ]),
        ...ST(ST_INIT),
        // 野猪ルール: 自分の前の石と同じ行/列へ3目以上離れて着手 → 突進して間を掘り起こす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 野猪: 自分の前の着手点と同じ行/列に3目以上離れて置くと突進 — 間の敵石を掘り起こす
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const mx = move.cells[0].x, my = move.cells[0].y;
                const prev = st.last[player];
                if (prev >= 0 && board[prev] === player) {
                    const px = prev % BOARD_SIZE, py = Math.floor(prev / BOARD_SIZE);
                    const sameLine = (px === mx) !== (py === my); // 行か列のどちらか一方だけ一致
                    const dist = Math.abs(px - mx) + Math.abs(py - my);
                    if (sameLine && dist >= (P('charge_dist') || 3)) {
                        const dx = Math.sign(mx - px), dy = Math.sign(my - py);
                        let dug = 0;
                        for (let k = 1; k < dist; k++) {
                            const i = (py + dy * k) * BOARD_SIZE + (px + dx * k);
                            if (board[i] === player) break; // 味方の石が轍を塞ぐ
                            if (board[i] === opponent) {
                                board[i] = 0;
                                captures[player]++;
                                dug++;
                                fxBurst(i, '#a16207', 10, 1.6);
                            }
                            st.furrows.push(i);
                        }
                        if (st.furrows.length > 80) st.furrows.splice(0, st.furrows.length - 80);
                        if (dug > 0) {
                            fxText(mi, '猪突進! +' + dug, '#d97706', 1300);
                            fxShake(6, 380);
                            cleanUpPieces();
                        } else {
                            fxText(mi, 'ドドド…', '#d97706', 800);
                        }
                    }
                }
                st.last[player] = mi;
            }

            turn = opponent;`],
        // 掘り起こされた轍: 薄い土色マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                st.furrows = st.furrows.filter(i => board[i] === 0);
                (st.furrows || []).forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(120,72,20,0.25)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'轍 ' + st.furrows.length + '本'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            野猪碁: 自分の前の石と同じ行/列に3目以上離れて置くと猪が突進し、間の敵石を掘り起こす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の直前の着手点と同じ行か列に3目以上離れて置くと、猪が一直線に突進する。',
            '突進路の敵石は全て掘り起こされアゲハマに (味方石が途中にあればそこで止まる)。轍は盤に残る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.last = { 1: -1, 2: -1 }; st.furrows = [];
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        board[6 * BOARD_SIZE + 4] = 2; // 突進路上の敵石
        executeMove({ cells: [{ x: 4, y: 8 }] }, 1);
        assert('突進で敵石を掘り起こす', board[6 * BOARD_SIZE + 4] === 0 && captures[1] === 1);
        assert('轍が残る', st.furrows.length >= 2);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 1); // 行列不一致 → 突進しない
        assert('斜め移動は突進にならない', st.furrows.length < 8);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
