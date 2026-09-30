// MONOLITHGO — 碑石碁: 盤中央の石碑を4方から囲むと、石碑が半径2以内の敵石を消し飛ばす
const K = require('../gen_kit.js');
module.exports = {
    file: 'monolithgo.html',
    en: 'MONOLITHGO',
    jp: '碑石碁',
    prefix: 'monolithgo',
    desc: '中央の石碑を4方で囲んだ側に、石碑が半径2以内の敵石を消し飛ばす力を貸す。',
    kind: 'stone',
    icon: 'monolithgo',
    spec: [
        ...K.rb('MONOLITHGO', '碑石碁', 'monolithgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { mowner: 0 }; // 石碑の覚醒者 (0:未覚醒)。持ち主が代わると再覚醒する`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 盤中央に石碑 (壁扱い)
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                board[mid * BOARD_SIZE + mid] = 3;
            }
            st = { mowner: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { mowner: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { mowner: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { mowner: 0 };`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 碑石覚醒: 4方を同色で囲んだ側に石碑が力を貸す (覚醒者が代わる時だけ発動)
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                const ci = mid * BOARD_SIZE + mid;
                const arms = getNeighbors(ci);
                const vals = arms.map(a => board[a]);
                const owner = arms.length === 4 && vals.every(v => v === vals[0] && v !== 0) ? vals[0] : 0;
                if (owner === 1 || owner === 2) {
                    if (st.mowner !== owner) {
                        st.mowner = owner;
                        const foe = owner === 1 ? 2 : 1;
                        let blasted = 0;
                        for (let y = 0; y < BOARD_SIZE; y++) {
                            for (let x = 0; x < BOARD_SIZE; x++) {
                                if (Math.abs(x - mid) + Math.abs(y - mid) <= 2 && board[y * BOARD_SIZE + x] === foe) {
                                    board[y * BOARD_SIZE + x] = 0;
                                    captures[owner]++;
                                    blasted++;
                                    fxBurst(y * BOARD_SIZE + x, '#a78bfa', 8, 1.5);
                                }
                            }
                        }
                        fxGlow(ci, '#a78bfa', 1000);
                        fxText(ci, '碑石覚醒 -' + blasted, '#a78bfa', 1300);
                        fxShake(6, 400);
                        cleanUpPieces();
                    }
                } else {
                    st.mowner = 0;
                }
            }

            // 打ち切り終局
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 碑は彫り込み石として描く
        ...K.WALL_SPEC,
        // 碑の影響圏 (菱形) を薄く示す
        K.CUE_STARS(`            // 碑の影響圏: マンハッタン距離2の菱形を薄紫で
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = 'rgba(167,139,250,0.5)';
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.12]);
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                const rr = 2.55;
                ctx.moveTo(padding + (mid - rr) * cellSize, padding + mid * cellSize);
                ctx.lineTo(padding + mid * cellSize, padding + (mid - rr) * cellSize);
                ctx.lineTo(padding + (mid + rr) * cellSize, padding + mid * cellSize);
                ctx.lineTo(padding + mid * cellSize, padding + (mid + rr) * cellSize);
                ctx.closePath();
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            碑石碁: 中央の碑を4方で囲むと、碑が半径2以内の敵石を消し飛ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の石碑は壁。四方を同色の石で囲んだ側に石碑が覚醒し、菱形の影響圏 (距離2以内) の敵石を全部消し飛ばす (アゲハマ)。',
            '囲みが崩れて別の色で囲み直すと、石碑はその側に付き替わって再覚醒する。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame(); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const mid = Math.floor(BOARD_SIZE / 2);
        const ci = mid * BOARD_SIZE + mid;
        assert('中央に碑', board[ci] === 3);
        assert('碑には置けない', isValidPlacement([{ x: mid, y: mid }], 1) === false);
        // 4方を黒で囲む + 影響圏に白石
        getNeighbors(ci).forEach(n => { board[n] = 1; });
        board[(mid - 2) * BOARD_SIZE + mid] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('碑が覚醒して敵石を消す', board[(mid - 2) * BOARD_SIZE + mid] === 0 && captures[1] === 1);
        assert('覚醒者は黒', st.mowner === 1);
    `,
};
