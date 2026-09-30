// FUSEBOMBGO — 導線碁: 石は導火線付き。置くと5手後に爆発して周囲の石を吹き飛ばす
const K = require('../gen_kit.js');
module.exports = {
    file: 'fusebombgo.html',
    en: 'FUSEBOMBGO',
    jp: '導線碁',
    prefix: 'fusebombgo',
    desc: '全ての石は導火線付き爆弾。置いてから5手後に爆発し、周囲3x3の石を吹き飛ばす。',
    kind: 'stone',
    icon: 'fusebombgo',
    spec: [
        ...K.rb('FUSEBOMBGO', '導線碁', 'fusebombgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        const FUSE_T = 5; // 爆発までの手数
        let st = { fuses: {} }; // idx -> {t: 爆発手数, owner: 色}`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { fuses: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { fuses: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { fuses: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { fuses: {} };`],
        // 着手時に導火線を点火
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });
            // 導線: 置いた石に点火 (FUSE_T 手後に起爆)
            move.cells.forEach(p => {
                st.fuses[p.y * BOARD_SIZE + p.x] = { t: history.length + FUSE_T, owner: player };
            });`],
        // 起爆処理: 手数が来た爆弾を爆発させる (両者共通)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 導線: 時限到来の爆弾を起爆
            {
                let boom = false;
                Object.keys(st.fuses).forEach(k => {
                    const i = +k;
                    const f = st.fuses[i];
                    if (!f || f.t > history.length) return;
                    if (board[i] !== f.owner) { delete st.fuses[i]; return; } // 既に消失
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    // 盤面を全て吹き飛ばす爆発は不発 (導火線だけ燃え尽きる)
                    {
                        let doomed = 0, stones = 0;
                        for (let k2 = 0; k2 < board.length; k2++) if (board[k2] === 1 || board[k2] === 2) stones++;
                        doomed++; // 爆弾自身
                        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx, ny = y + dy;
                            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue;
                            if (board[ny * BOARD_SIZE + nx] === 1 || board[ny * BOARD_SIZE + nx] === 2) doomed++;
                        }
                        if (doomed >= stones) {
                            fxText(i, '不発', '#a8a29e', 800);
                            delete st.fuses[i];
                            return;
                        }
                    }
                    boom = true;
                    board[i] = 0; // 爆弾自身は燃え尽きる
                    fxBurst(i, '#f97316', 14, 1.9);
                    fxBurst(i, '#fbbf24', 8, 1.3);
                    fxShake(6, 320);
                    fxText(i, '爆発!', '#fb923c', 1000);
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue;
                        const ni = ny * BOARD_SIZE + nx;
                        if (board[ni] === 1 || board[ni] === 2) {
                            const victim = board[ni];
                            board[ni] = 0;
                            fxBurst(ni, '#fbbf24', 8, 1.3);
                            if (victim !== f.owner) captures[f.owner]++; // 敵石はアゲハマに
                            if (st.fuses[ni]) delete st.fuses[ni]; // 道連れの爆弾は不発
                        }
                    }
                    delete st.fuses[i];
                });
                if (boom) cleanUpPieces();
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 導火線リングの描画 (残り手数の弧)
        ...K.STONE_MARKS_SPEC(`            // 導線: 爆弾石に残り手数の導火線リング
            {
                ctx.save();
                Object.keys(st.fuses).forEach(k => {
                    const i = +k;
                    const f = st.fuses[i];
                    if (board[i] !== f.owner) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const left = Math.max(0, f.t - history.length);
                    ctx.strokeStyle = 'rgba(251,146,60,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / FUSE_T));
                    ctx.stroke();
                    // 火花
                    ctx.fillStyle = 'rgba(251,191,36,0.95)';
                    ctx.beginPath();
                    ctx.arc(cx + cellSize * 0.30, cy - cellSize * 0.30, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            導線碁: 石は5手で爆発する爆弾。周囲3x3を吹き飛ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は全て導火線付き — 5手後に爆発し、周囲3x3の石を吹き飛ばす。',
            '敵石を巻き込めばアゲハマ、自石を巻き込んでもただ消える。起爆時機は両者同じ。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 黒爆弾 t=6
        assert('導線登録', !!st.fuses[I(2, 2)] && st.fuses[I(2, 2)].t === history.length + FUSE_T);
        board[I(3, 2)] = 2; // 白を隣に手配置
        history.length = 5;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 6手目 → 起爆
        assert('爆弾は燃え尽きる', board[I(2, 2)] === 0);
        assert('敵石は吹き飛びアゲハマ', board[I(3, 2)] === 0 && captures[1] === 1);
        assert('着手できる', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
