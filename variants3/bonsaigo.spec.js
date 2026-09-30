// BONSAIGO — 盆栽碁: 分岐(次数3+)と先端(次数1)を持つ連は「整った樹形」として+2目
const K = require('../gen_kit.js');
module.exports = {
    file: 'bonsaigo.html',
    en: 'BONSAIGO',
    jp: '盆栽碁',
    prefix: 'bonsaigo',
    desc: '石は盆栽の枝。分岐と先端を持つ「整った樹形」の連は終局時+2目。',
    kind: 'stone',
    icon: 'bonsaigo',
    spec: [
        ...K.rb('BONSAIGO', '盆栽碁', 'bonsaigo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let bonsaiDetail = { 1: 0, 2: 0 }; // 直近終局で計上した樹形ボーナス`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 盆栽ルール: 分岐 (次数3以上) と先端 (次数1) を持つ連は「整った樹形」として+2目
            const seen = Array(board.length).fill(false);
            let bB = 0, bW = 0;
            for (let i = 0; i < board.length; i++) {
                const p = board[i];
                if ((p !== 1 && p !== 2) || seen[i]) continue;
                const grp = [];
                const q = [i];
                seen[i] = true;
                while (q.length > 0) {
                    const cur = q.shift();
                    grp.push(cur);
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === p && !seen[n]) { seen[n] = true; q.push(n); }
                    });
                }
                let leaf = false, junction = false;
                grp.forEach(c => {
                    const deg = getNeighbors(c).filter(n => board[n] === p).length;
                    if (deg === 1) leaf = true;
                    if (deg >= 3) junction = true;
                });
                if (leaf && junction) { if (p === 1) bB++; else bW++; }
            }
            bonsaiDetail = { 1: bB, 2: bW };
            territory.black += bB * 2;
            territory.white += bW * 2;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 盆栽: 分岐点に小さな芽のマーク
            {
                ctx.save();
                ctx.fillStyle = 'rgba(74,222,128,0.85)';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const deg = getNeighbors(i).filter(n => board[n] === v).length;
                    if (deg < 3) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.ellipse ? ctx.ellipse(cx + cellSize * 0.18, cy - cellSize * 0.26, cellSize * 0.10, cellSize * 0.06, 0.6, 0, Math.PI * 2)
                                : ctx.arc(cx + cellSize * 0.18, cy - cellSize * 0.26, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は盆栽の枝。1つの連に分岐 (3方向以上) と先端 (1方向) の両方があれば「整った樹形」。',
            '樹形の整った連1つにつき+2目。剪定と分岐のバランスを競え — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 十字形: 中心(4,4)に4方向 — 中心は分岐(deg4)、各端は先端(deg1)
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        [[3, 4], [5, 4], [4, 3], [4, 5]].forEach(([x, y]) => executeMove({ cells: [{ x, y }] }, 1));
        endGameByScore();
        assert('整った樹形が計上される', bonsaiDetail[1] === 1);
        assert('白には樹形なし', bonsaiDetail[2] === 0);
        assert('終局する', gameOver === true);
    `,
};
