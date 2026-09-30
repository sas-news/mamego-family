// MIRRORSTONEGO — 鏡石碁: 連が取られると、その連に隣接する敵石1個も道連れに砕ける
const K = require('../gen_kit.js');
module.exports = {
    file: 'mirrorstonego.html',
    en: 'MIRRORSTONEGO',
    jp: '鏡石碁',
    prefix: 'mirrorstonego',
    desc: '全ての石は鏡面。取られた連は隣の敵石1個を道連れに砕く。',
    kind: 'mirror',
    icon: 'mirrorstonego',
    spec: [
        ...K.rb('MIRRORSTONEGO', '鏡石碁', 'mirrorstonego'),
        // 捕獲: 取られた連ごとに、それに接していた敵石(取った側の石)1個が反撃で砕ける
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // 鏡面石: 取られた連1つにつき、接する敵石1個が鏡の反撃で砕ける (アゲハマにはならない)
                {
                    const capSet = new Set(captured);
                    const seen = new Set();
                    for (const start of captured) {
                        if (seen.has(start)) continue;
                        const group = [];
                        const q = [start];
                        seen.add(start);
                        while (q.length) {
                            const cur = q.shift();
                            group.push(cur);
                            getNeighbors(cur).forEach(n => {
                                if (capSet.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
                            });
                        }
                        let revenged = false;
                        // 自分の最後の石は道連れにしない (全滅防止)
                        if (board.filter(v => v === player).length <= 1) revenged = true;
                        for (const gIdx of group) {
                            if (revenged) break;
                            for (const n of getNeighbors(gIdx)) {
                                if (board[n] === player) {
                                    board[n] = 0;
                                    fxBurst(n, '#bae6fd', 8, 1.4);
                                    fxText(n, '鏡砕', '#38bdf8', 900);
                                    revenged = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 鏡面の輝き: 全ての石に銀色の鏡面ハイライト弧
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(186,230,253,0.6)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, Math.PI * 0.9, Math.PI * 1.6);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '全ての石は鏡面。自分の連が取られると、その連に接していた敵石1個が道連れに砕ける。',
            '砕かれた石はアゲハマにならない (ただ消える)。取る側も代償を払うので無闇に攻められない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(1,1)] = 2;
        board[I(1,0)] = 1; board[I(0,1)] = 1; board[I(1,2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('白石が取られる', board[I(1,1)] === 0);
        assert('アゲハマ1個', captures[1] === 1);
        assert('反撃で黒石1個だけ残る=3個', board.filter(v => v === 1).length === 3);
        assert('道連れはアゲハマにならない', captures[1] === 1 && captures[2] === 0);
        assert('起動して着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
