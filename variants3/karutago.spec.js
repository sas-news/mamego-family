// KARUTAGO — 歌牌碁: 盤上の「札」(金色の点) に取り手として石を置き、先に4枚取った側が勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'karutago.html',
    en: 'KARUTAGO',
    jp: '歌牌碁',
    prefix: 'karutago',
    desc: '盤面に散らばる7枚の札マス。石で札を取り、先に4枚取った側が歌牌勝ち。',
    kind: 'stone',
    icon: 'karutago',
    spec: [
        ...K.rb('KARUTAGO', '歌牌碁', 'karutago'),
        K.params([
            { key: 'cards_to_win', label: '歌牌勝ちに必要な札数', min: 2, max: 7, def: 4, unit: '枚' },
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { cards: [], got: { 1: 0, 2: 0 } }; // 札の位置と取得数`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 札を7枚ばら撒く (盤の対称位置)
            {
                const m = Math.floor(BOARD_SIZE / 2), q = Math.floor(BOARD_SIZE / 4), r = BOARD_SIZE - 1 - q;
                st = {
                    cards: [m, q * BOARD_SIZE + q, q * BOARD_SIZE + r, m * BOARD_SIZE + m,
                            r * BOARD_SIZE + q, r * BOARD_SIZE + r, (BOARD_SIZE - 1) * BOARD_SIZE + m],
                    got: { 1: 0, 2: 0 }
                };
            }`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { cards: [], got: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { cards: [], got: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { cards: [], got: { 1: 0, 2: 0 } };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 札を取る: 札マスに石を置いた側が札を得る
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const ci = st.cards.indexOf(li);
                if (ci >= 0) {
                    st.cards.splice(ci, 1);
                    st.got[player]++;
                    fxBurst(li, '#fde047', 10, 1.6);
                    fxText(li, '札を取った!', '#fde047', 1200);
                    if (st.got[player] >= (P('cards_to_win') || 4)) {
                        winByRule(player, '歌牌勝ち', '札を' + (P('cards_to_win') || 4) + '枚取りました'); return;
                    }
                }
            }

            // 打ち切り終局 (手数は設定で調整)
            if (history.length >= Math.max(1, P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 札を金色の短冊で描く
        K.CUE_STARS(`            // 札: 金色の短冊
            {
                st.cards.forEach(ci => {
                    const cx0 = ci % BOARD_SIZE, cy0 = Math.floor(ci / BOARD_SIZE);
                    const cx = padding + cx0 * cellSize, cy = padding + cy0 * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(253,224,71,0.85)';
                    ctx.strokeStyle = 'rgba(133,77,14,0.9)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.rect(cx - cellSize * 0.22, cy - cellSize * 0.3, cellSize * 0.44, cellSize * 0.6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(133,77,14,0.7)';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.12, cy - cellSize * 0.15);
                    ctx.lineTo(cx + cellSize * 0.12, cy - cellSize * 0.15);
                    ctx.moveTo(cx - cellSize * 0.12, cy);
                    ctx.lineTo(cx + cellSize * 0.12, cy);
                    ctx.moveTo(cx - cellSize * 0.12, cy + cellSize * 0.15);
                    ctx.lineTo(cx + cellSize * 0.12, cy + cellSize * 0.15);
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'札 ' + st.got[1] + '-' + st.got[2] + ' (残' + st.cards.length + ')'`),
        [K.ONE, K.INFO_ALGO, `            歌牌碁: 金色の札マスに石を置いて札を取る。先に4枚で歌牌勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上に7枚の札 (金色の短冊) が散る。札のマスに石を置いた側がその札を取る。',
            '先に4枚取った側が歌牌勝ち。札は上下対称に散るので取り合いは互角。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame(); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('札は7枚', st.cards.length === 7);
        const m = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: m, y: 0 }] }, 1); // 上端中央の札を取る
        assert('札を取った', st.got[1] === 1 && st.cards.length === 6);
        st.got = { 1: 3, 2: 0 };
        const c0 = st.cards[0];
        executeMove({ cells: [{ x: c0 % BOARD_SIZE, y: Math.floor(c0 / BOARD_SIZE) }] }, 1);
        assert('4枚目で歌牌勝ち', gameOver === true && gameResultData && gameResultData.title.includes('歌牌'));
    `,
};
