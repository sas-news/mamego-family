// OSSUGO — 白骨碁: 取られた石は白骨となって残り、手番ごとに風化して消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'ossugo.html',
    en: 'OSSUGO',
    jp: '白骨碁',
    prefix: 'ossugo',
    desc: '取られた石は白骨として残る。置けない障害物で数手で風化する。',
    kind: 'stone',
    spec: [
        ...K.rb('OSSUGO', '白骨碁', 'ossugo'),
        K.params([
            { key: 'bone_life', label: '白骨の風化までの手数', min: 1, max: 9, def: 3, unit: '手' },
        ]),
        // 白骨の風化カウンタ boneMap (idx → 残り手数) の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let boneMap = {}; // 白骨の残り風化手数 (idx → n手)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            boneMap = {};`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                boneMap: { ...boneMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            boneMap = snap.boneMap ? { ...snap.boneMap } : {};`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    boneMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            boneMap = (s.boneMap && typeof s.boneMap === 'object') ? { ...s.boneMap } : {};`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                boneMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            boneMap = (data.boneMap && typeof data.boneMap === 'object') ? { ...data.boneMap } : {};`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 4; boneMap[idx] = Math.max(1, P('bone_life') || 3); fxGlow(idx, '#e7e5d4', 650); }); // 白骨化 (置けない障害物)
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 白骨: 骨は手番ごとに風化し、尽きると消える
            {
                let gone = 0;
                for (const k in boneMap) {
                    const idx = +k;
                    boneMap[idx]--;
                    if (boneMap[idx] <= 0) {
                        delete boneMap[idx];
                        if (board[idx] === 4) {
                            board[idx] = 0; gone++;
                            // 風化して崩れる演出: 骨の粉塵が散る
                            fxSplash(idx, '#d6d3c0', 7);
                            fxBurst(idx, '#a8a29e', 4, 0.8);
                        }
                    }
                }
                if (gone > 0) cleanUpPieces();
            }

            turn = opponent;`],
        // 白骨セルの描画: 象牙色の骨
        [K.ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 白骨セル (board===4): 象牙色の骨石
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y * BOARD_SIZE + x] !== 4) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(235, 228, 205, 0.95)';
                    ctx.strokeStyle = 'rgba(120, 110, 85, 0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(120, 110, 85, 0.9)';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.11, cy - cellSize * 0.05, cellSize * 0.06, 0, Math.PI * 2);
                    ctx.arc(cx + cellSize * 0.11, cy - cellSize * 0.05, cellSize * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`],
        [K.ONE, K.FALLBACK_SKIP,
`                    if (val !== 1 && val !== 2) continue; // 空点・白骨は石として描かない`],
        [K.ONE, K.TOGGLE_GUARD,
`            const color = board[startIdx];
            if (color === 0 || color >= 3) return;`],
        [K.ONE, K.RV_BASE, K.rv([
            '取られた敵石は白骨 (象牙色の骨石) となってその場に残る。',
            '白骨の上には置けず呼吸点にもならないが、数手で風化して消える。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; boneMap = {};
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('取られた石は白骨化', board[5 * BOARD_SIZE + 5] === 4 && boneMap[5 * BOARD_SIZE + 5] >= 1);
        assert('白骨の上には置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('白骨はまだ残る', board[5 * BOARD_SIZE + 5] === 4);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('風化して消える', board[5 * BOARD_SIZE + 5] === 0);
    `,
};
