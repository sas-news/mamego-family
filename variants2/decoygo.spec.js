// DECOYGO — 囮碁: 各側5手ごとの石は囮石。3手後に跡形もなく消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'decoygo.html',
    en: 'DECOYGO',
    jp: '囮碁',
    prefix: 'decoygo',
    desc: '5手ごとの石は偽物。3手後に消えて盤面が変わる。',
    kind: 'decoy',
    spec: [
        ...K.rb('DECOYGO', '囮碁', 'decoygo'),
        K.params([
            { key: 'decoy_interval', label: '囮石の出現間隔', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'decoy_life', label: '囮石の寿命', min: 1, max: 8, def: 3, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 } }; // 囮碁: 各側の着手数 (5手ごとに囮石)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, '        function executeMove(move, player) {',
`        // 囮碁: そのプレイヤーのN手ごとの着手は囮石 (間隔・寿命は設定で調整)
        function isDecoyPiece(pc) { return !!pc.decoy; }
        function decoyLeft(pc) { return pc.at === undefined ? 99 : (P('decoy_life') || 3) - (history.length - pc.at); }

        function executeMove(move, player) {`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                decoy: st.pcnt[player] % (P('decoy_interval') || 5) === 0
            });`],
        // 囮石は配置から3手後に霧散する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 囮碁: 囮石は置いてから寿命分手後に消える — 霧散の演出つき
            {
                let vanished = false;
                pieces.forEach(pc => {
                    if (!pc.decoy || history.length - (pc.at || 0) < (P('decoy_life') || 3)) return;
                    pc.cells.forEach(p => {
                        const pi = p.y * BOARD_SIZE + p.x;
                        if (board[pi] === pc.player) {
                            board[pi] = 0;
                            fxSplash(pi, 'rgba(148,163,184,0.9)', 8);
                            fxText(pi, '霧散', '#fb923c', 1000);
                        }
                    });
                    pc.decoy = false;
                    vanished = true;
                });
                if (vanished) { cleanUpPieces(); fxShake(2, 180); }
            }

            // 囮碁: 囮石が置かれた瞬間に微かな橙の輪 (よく見ると分かる偽物)
            {
                const np = pieces[pieces.length - 1];
                if (np && np.player === player && np.decoy) {
                    const di = np.cells[0].y * BOARD_SIZE + np.cells[0].x;
                    fxGlow(di, '#fb923c', 600);
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 囮石にごく薄い残り寿命の砂時計ドット (よく見ると分かる偽物)
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.decoy) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const left = decoyLeft(pc);
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.fillStyle = left <= 1 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(251, 146, 60, 0.55)';
                        ctx.beginPath();
                        ctx.arc(cx + cellSize * 0.28, cy - cellSize * 0.28, cellSize * 0.09, 0, Math.PI * 2);
                        ctx.fill();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const d = pieces.filter(pc => pc.decoy).length; const n = P('decoy_interval') || 5; return d > 0 ? '囮石 ' + d + '個' : '次の囮 ' + (n - st.pcnt[turn] % n) + '手後'; })()`),
        [K.ONE, K.INFO_ALGO, `            囮碁: 各側5手ごとの石は偽物で、置いてから3手後に跡形もなく消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの5・10・15…手目の着手は「囮石」。見た目は普通の石。',
            '囮石は置いてから3手後に消え、塞がっていた空点が戻る。囲み・取りの計算が歪む。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.pcnt = { 1: 0, 2: 0 };
        for (let i = 0; i < 8; i++) executeMove({ cells: [{ x: i, y: 0 }] }, i % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒の5手目 → 囮石
        assert('黒の5手目は囮石', isDecoyPiece(pieces[pieces.length - 1]) === true);
        assert('盤上にある', board[4 * BOARD_SIZE + 4] === 1);
        assert('残り寿命3', decoyLeft(pieces[pieces.length - 1]) === 3);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 8 }] }, 2);
        assert('3手後に囮石は消える', board[4 * BOARD_SIZE + 4] === 0);
    `,
};
