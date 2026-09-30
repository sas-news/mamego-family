// VAMPGO — 吸血碁: 取った石に接した自石が血を得て装甲化する
const K = require('../gen_kit.js');
module.exports = {
    file: 'vampgo.html',
    en: 'VAMPGO',
    jp: '吸血碁',
    prefix: 'vampgo',
    desc: '取った石に接した自石は血を得て装甲化。次の包囲を1度耐える。',
    kind: 'stone',
    spec: [
        ...K.rb('VAMPGO', '吸血碁', 'vampgo'),
        // 装甲マーク vampArmor (idx の Set) の状態登録
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let vampArmor = new Set(); // 吸血で得た装甲 (idx)。取られそうな時1度だけ剥がれて耐える`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            vampArmor = new Set();`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                vampArmor: [...vampArmor],
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            vampArmor = new Set(snap.vampArmor || []);`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    vampArmor: [...vampArmor],
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            vampArmor = new Set(s.vampArmor || []);`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                vampArmor: [...vampArmor],
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            vampArmor = new Set(data.vampArmor || []);`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 装甲のある敵石は装甲が剥がれるだけで盤に残る
                const removed = [];
                captured.forEach(idx => {
                    if (vampArmor.has(idx)) {
                        vampArmor.delete(idx);
                        // 装甲が砕けて剥がれる演出: 深紅の血飛沫
                        fxBurst(idx, '#dc2626', 8, 1.3);
                        fxText(idx, '装甲!', '#fca5a5', 800);
                    }
                    else removed.push(idx);
                });
                removed.forEach(idx => { board[idx] = 0; });
                if (removed.length > 0) {
                    captures[player] += removed.length;
                    // 吸血: 取った石に接した自石が血を得て装甲化する
                    removed.forEach(idx => getNeighbors(idx).forEach(n => {
                        if (board[n] === player) {
                            vampArmor.add(n);
                            // 血を得る演出: 紅の収束リング
                            fxGlow(n, '#ef4444', 700);
                        }
                    }));
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }
            } else {
                soundManager.playPlace();
            }`],
        ...K.STONE_MARKS_SPEC(`            // 血の装甲: 装甲のある石に深紅の内リング
            for (const idx of vampArmor) {
                const v = board[idx];
                if (v !== 1 && v !== 2) continue;
                const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(200, 30, 50, 0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.24, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石を取ると、その石に接していた自分の石が血を得て装甲化 (赤リング) する。',
            '装甲のある石は包囲されても1度目は装甲が剥がれるだけで盤に残る。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; vampArmor = new Set();
        board[5 * BOARD_SIZE + 5] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('白石が取れる', captures[1] === 1);
        assert('隣の自石が装甲化', vampArmor.has(4 * BOARD_SIZE + 5) && vampArmor.has(5 * BOARD_SIZE + 6));
        // 装甲のある石が取られそうになると装甲だけ剥がれる
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0; vampArmor = new Set();
        board[2 * BOARD_SIZE + 2] = 1; vampArmor.add(2 * BOARD_SIZE + 2);
        board[2 * BOARD_SIZE + 1] = 2; board[1 * BOARD_SIZE + 2] = 2; board[2 * BOARD_SIZE + 3] = 2;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 2); // 最後の呼吸点を塞いで包囲
        assert('装甲石は1度目は残る', board[2 * BOARD_SIZE + 2] === 1);
        assert('装甲は剥がれた', !vampArmor.has(2 * BOARD_SIZE + 2));
    `,
};
