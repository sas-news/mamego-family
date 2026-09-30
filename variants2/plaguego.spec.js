// PLAGUEGO — 疫病碁: 取跡は疫地となる。疫地の上の石は手番ごとに蝕まれて消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'plaguego.html',
    en: 'PLAGUEGO',
    jp: '疫病碁',
    prefix: 'plaguego',
    desc: '取跡は疫地。疫地に置いた石は手番の終わりに蝕まれて消える。',
    kind: 'stone',
    spec: [
        ...K.rb('PLAGUEGO', '疫病碁', 'plaguego'),
        // 疫地 plague (idx の Set) の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let plague = new Set(); // 取跡が残した疫地 (idx)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            plague = new Set();`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                plague: [...plague],
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            plague = new Set(snap.plague || []);`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    plague: [...plague],
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            plague = new Set(s.plague || []);`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                plague: [...plague],
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            plague = new Set(data.plague || []);`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; plague.add(idx); }); // 取跡が疫地化
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 疫病: 疫地の上の石は手番終わりに蝕まれて消える (相手のアゲハマへ)
            {
                let rot = 0;
                plague.forEach(idx => {
                    const v = board[idx];
                    if (v === 1 || v === 2) { board[idx] = 0; captures[v === 1 ? 2 : 1]++; rot++; }
                });
                if (rot > 0) cleanUpPieces();
            }

            turn = opponent;`],
        K.CUE_STARS(`            // 疫地: 黄緑の斑点を疫地の空点に描く
            {
                ctx.save();
                for (const idx of plague) {
                    if (board[idx] !== 0) continue;
                    const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(140, 190, 40, 0.55)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(80, 120, 20, 0.8)';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.08, cy - cellSize * 0.08, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取った跡地は疫地 (黄緑の斑点) となる。',
            '疫地にも置けるが、置いた石はその手番の終わりに蝕まれて消え、相手のアゲハマになる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; plague = new Set();
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', captures[1] === 1);
        assert('取跡が疫地化', plague.has(5 * BOARD_SIZE + 5));
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 疫地へ打ち込み
        assert('疫地の石は蝕まれる', board[5 * BOARD_SIZE + 5] === 0);
        assert('蝕まれた分は相手の取り', captures[1] === 2);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('疫地以外は安全', board[3 * BOARD_SIZE + 3] === 2);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
