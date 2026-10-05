// MUTATEGO — 変異碁: 取られたセルの偶数パリティに中立の変異体(5)が生まれる。窒息した変異体は刈り取られる
const K = require('../gen_kit.js');
module.exports = {
    file: 'mutatego.html',
    en: 'MUTATEGO',
    jp: '変異碁',
    prefix: 'mutatego',
    desc: '取られたセルの半分に中立の変異体が生まれる。四方を塞がれた変異体は着手側に刈り取られる。',
    kind: 'stone',
    icon: 'mutatego',
    spec: [
        ...K.rb('MUTATEGO', '変異碁', 'mutatego'),
        K.params([
            { key: 'parity', label: '変異の市松間隔', options: [{ v: 2, l: '偶数マスのみ' }, { v: 1, l: 'すべてのマス' }], def: 2, hint: '変異が現れるマスの周期性 (x+y mod N)' },
            { key: 'cap', label: '打ち切り手数', min: 50, max: 300, def: 140, unit: '手' },
        ]),
        // 捕獲後に偶数パリティのセルへ変異体 (5) を出現させる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                // 変異ルール: 偶数パリティ (x+y偶数) の取られたセルに中立変異体(5)が生まれる
                captured.forEach(ci => {
                    const cx = ci % BOARD_SIZE, cy = Math.floor(ci / BOARD_SIZE);
                    if ((cx + cy) % (P('parity') || 2) === 0 && board[ci] === 0) {
                        board[ci] = 5;
                        fxBurst(ci, '#c084fc', 6, 1.3);
                    }
                });
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 変異ルール: 四方の空きがない変異体は着手側に刈り取られる
            {
                const dead = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 5) continue;
                    const free = getNeighbors(i).filter(n => board[n] === 0).length;
                    if (free === 0) dead.push(i);
                }
                if (dead.length) {
                    dead.forEach(i => {
                        board[i] = 0; captures[player]++;
                        fxBurst(i, '#c084fc', 6, 1.4);
                    });
                    fxText(dead[0], '変異刈取!', '#a855f7', 1200);
                    cleanUpPieces();
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= Math.max(1, P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 変異体 (board===5) の描画 — 紫のブロブ
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 5) continue;
                const dx = i % BOARD_SIZE, dy = Math.floor(i / BOARD_SIZE);
                const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                ctx.save();
                ctx.fillStyle = '#a855f7';
                ctx.strokeStyle = '#6b21a8';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                for (let k = 0; k < 8; k++) {
                    const a = (k / 8) * Math.PI * 2;
                    const rr = cellSize * 0.4 * (1 + 0.18 * Math.sin(k * 2.7 + i));
                    const px2 = cx + Math.cos(a) * rr, py2 = cy + Math.sin(a) * rr;
                    if (k === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '敵石を取ったセルのうち偶数パリティ (x+y偶数) に中立の変異体 (紫) が生まれる。',
            '変異体は誰の石でもなく呼吸もしないが、四方に空きがなくなると着手側に刈り取られる (アゲハマ+1)。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // (4,4) 単体を囲んで取る: (4+4)偶数 → 変異体が生まれるが四方囲みで即刈り取り
        board[4 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('窒息した変異体は即刈り取り', board[4 * BOARD_SIZE + 4] === 0 && captures[1] === 2);
        // 白2連 (4,4)(4,5) を取ると、(4,5) は奇数なので変異体なし・(4,4) の変異体は隣が空いて生存
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 2; board[5 * BOARD_SIZE + 4] = 2;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1;
        board[5 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1); // (4,6)が最後の呼吸点 → 2連を捕獲
        assert('空きのある変異体は生存', board[4 * BOARD_SIZE + 4] === 5);
        // 変異体の隣を全て塞ぐと刈り取られる
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 5;
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1; board[3 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('四方を塞がれた変異体は刈り取られる', board[4 * BOARD_SIZE + 4] === 0 && captures[1] === 1);
    `,
};
