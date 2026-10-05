// YUKIONNAGO — 雪女碁: 置いた石に触れた敵石は凍り、持ち主の次の手番で凍死する (隣の雪女石を除けば解凍)
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
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
const ST_INIT = `{ frz: {} }`; // 凍った石 idx → 凍らせた側 (1 or 2)
module.exports = {
    file: 'yukionnago.html',
    en: 'YUKIONNAGO',
    jp: '雪女碁',
    prefix: 'yukionnago',
    desc: '置いた石に触れた敵石は凍り、自分の次の手番で凍死する。隣の雪女を除けば解凍。',
    kind: 'stone',
    icon: 'yukionnago',
    spec: [
        ...K.rb('YUKIONNAGO', '雪女碁', 'yukionnago'),
        K.params([
            { key: 'freeze_max', label: '1着手で凍る敵石数', min: 1, max: 4, def: 1, unit: '石' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        // 手番処理: 自分が凍らせた敵石は、隣に自分の石が残っていれば凍死 (いなければ解凍)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 雪女碁: 凍結の解決 — 自分が凍らせた敵石は凍死する (隣に自分の石が無ければ解凍)
            Object.keys(st.frz).forEach(k => {
                const i = +k;
                if (st.frz[k] !== player) return; // 相手の凍結は相手の手番で解決
                if (board[i] === 0) { delete st.frz[k]; return; }
                if (getNeighbors(i).some(n => board[n] === player)) {
                    board[i] = 0;
                    captures[player]++;
                    fxBurst(i, '#bae6fd', 12, 1.8);
                    fxText(i, '凍死!', '#7dd3fc', 1000);
                }
                delete st.frz[k];
            });
            // 置いた石に触れた敵石を凍らせる
            {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                getNeighbors(ci).filter(n => board[n] === opponent)
                    .slice(0, Math.max(1, P('freeze_max') || 1))
                    .forEach(tgt => {
                        st.frz[tgt] = player;
                        fxGlow(tgt, '#bae6fd', 800);
                        fxText(tgt, '凍結', '#e0f2fe', 800);
                    });
            }
            cleanUpPieces();

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 凍った石: 氷の結晶マーク
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(186,230,253,0.95)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                for (const k in st.frz) {
                    const i = +k;
                    if (board[i] === 0) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    for (let a = 0; a < 3; a++) {
                        const ang = a * Math.PI / 3;
                        ctx.beginPath();
                        ctx.moveTo(cx - Math.cos(ang) * cellSize * 0.3, cy - Math.sin(ang) * cellSize * 0.3);
                        ctx.lineTo(cx + Math.cos(ang) * cellSize * 0.3, cy + Math.sin(ang) * cellSize * 0.3);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            雪女碁: 置いた石に触れた敵石は凍り、自分の次の手番で凍死する (隣の雪女を除けば解凍)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手で敵石に触れる (隣接する) と、その敵石1つが凍り付く。',
            '凍った石は自分の次の手番で凍死してアゲハマになる。ただし相手が隣の雪女石を取り除けば解凍する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures[1] = 0; captures[2] = 0;
        st.frz = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 5] = 2; // 白 at (5,4)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒が隣接 → 白が凍る
        assert('敵石が凍った', st.frz[4 * BOARD_SIZE + 5] === 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 白は救出できず
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 黒の手番 → 凍死
        assert('凍死してアゲハマ', board[4 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        // 解凍ケース: 凍らせた黒石を白が取る
        board[7 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 7, y: 6 }] }, 1); // 黒 at (7,6) → (7,7)の白が凍る
        board[6 * BOARD_SIZE + 6] = 2; board[6 * BOARD_SIZE + 8] = 2; board[5 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 1, y: 11 }] }, 2); // 白の着手 — 黒(7,6)は呼吸0で取られる
        assert('雪女石が取られる', board[6 * BOARD_SIZE + 7] === 0);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 黒の次の手番 — 隣に雪女が無いので解凍
        assert('雪女が消えれば解凍する', st.frz[7 * BOARD_SIZE + 7] === undefined && board[7 * BOARD_SIZE + 7] === 2);
    `,
};
