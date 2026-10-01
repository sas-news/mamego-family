// FORTGO — 城塞碁: 取跡は自分の城壁となる。1城壁=1目として地に加算
const K = require('../gen_kit.js');
module.exports = {
    file: 'fortgo.html',
    en: 'FORTGO',
    jp: '城塞碁',
    prefix: 'fortgo',
    desc: '取跡が自分の城壁になる。残った城壁は1つ1目の得点。',
    kind: 'stone',
    spec: [
        ...K.rb('FORTGO', '城塞碁', 'fortgo'),
        K.params([
            { key: 'wall_pts', label: '城壁1つの得点', min: 1, max: 4, def: 1, unit: '目' },
        ]),
        // 城壁の持ち主 fortMap (idx → player) の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let fortMap = {}; // 城壁の持ち主 (idx → player)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            fortMap = {};`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                fortMap: { ...fortMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            fortMap = snap.fortMap ? { ...snap.fortMap } : {};`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    fortMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            fortMap = (s.fortMap && typeof s.fortMap === 'object') ? { ...s.fortMap } : {};`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                fortMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            fortMap = (data.fortMap && typeof data.fortMap === 'object') ? { ...data.fortMap } : {};`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 城塞: 取跡が自分の城壁 (壁=3) になる
                captured.forEach(idx => {
                    board[idx] = 3;
                    fortMap[idx] = player;
                    fxGlow(idx, player === 1 ? '#94a3b8' : '#e2e8f0', 550);
                });
                fxText(captured[0], '築城!', '#facc15', 1050);
                fxShake(3, 240);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 城壁セルの描画: 持ち主色の方形城壁
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 城壁セル (board===3): 持ち主色の方形の城壁ブロック
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const idx = y * BOARD_SIZE + x;
                    if (board[idx] !== 3) continue;
                    const owner = fortMap[idx];
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const hh = cellSize * 0.46;
                    ctx.fillStyle = owner === 1 ? 'rgba(60, 64, 78, 0.92)' : 'rgba(214, 214, 224, 0.92)';
                    ctx.strokeStyle = owner === 1 ? 'rgba(20, 22, 30, 0.95)' : 'rgba(110, 110, 130, 0.95)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.fillRect(cx - hh, cy - hh, hh * 2, hh * 2);
                    ctx.strokeRect(cx - hh, cy - hh, hh * 2, hh * 2);
                    // 凹凸の城壁飾り
                    ctx.fillRect(cx - hh, cy - hh, hh * 0.4, hh * 0.28);
                    ctx.fillRect(cx + hh * 0.6, cy - hh, hh * 0.4, hh * 0.28);
                }
                ctx.restore();
            }`],
        [K.ONE, K.FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・城壁は石として描かない`],
        [K.ONE, K.TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color === 3) return;`],
        // 城壁1つ=1目として地に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const fortBlack = Object.keys(fortMap).filter(k => fortMap[k] === 1).length;
            const fortWhite = Object.keys(fortMap).filter(k => fortMap[k] === 2).length;
            const blackTotal = territory.black + captures[1] + fortBlack * (P('wall_pts') || 1);
            const whiteTotal = territory.white + captures[2] + komi + fortWhite * (P('wall_pts') || 1);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の城壁:</span> <strong>\${fortBlack}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の城壁:</span> <strong>\${fortWhite}</strong></div>`],
        [K.ONE, K.RV_ALGO, K.rv([
            '敵連を取った跡地は自分の城壁 (置けない壁) になる。',
            '城壁は1つ1目の得点。取れば取るほど盤が自分の城だらけになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; fortMap = {};
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取跡が城壁化', board[5 * BOARD_SIZE + 5] === 3);
        assert('城壁の持ち主は取った側', fortMap[5 * BOARD_SIZE + 5] === 1);
        assert('城壁の上には置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        endGameByScore();
        assert('結果詳細に城壁', gameResultData.details.includes('城壁'));
    `,
};
