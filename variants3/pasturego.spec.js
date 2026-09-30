// PASTUREGO — 放牧碁: 石は羊。自陣の空点に接する自石は「柵の中の羊」として+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'pasturego.html',
    en: 'PASTUREGO',
    jp: '放牧碁',
    prefix: 'pasturego',
    desc: '石は羊。自分の地に接する自分の石は「柵の中の羊」として終局時+1目。',
    kind: 'stone',
    icon: 'pasturego',
    spec: [
        ...K.rb('PASTUREGO', '放牧碁', 'pasturego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let pastureDetail = { 1: 0, 2: 0 }; // 直近終局で計上した羊の数`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 放牧ルール: 自分だけの地に接する自石は「柵の中の羊」として+1目
            const ownTerr = { 1: new Set(), 2: new Set() };
            {
                const visited = Array(board.length).fill(false);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0 || visited[i]) continue;
                    const region = [];
                    let tB = false, tW = false;
                    const q = [i];
                    visited[i] = true;
                    while (q.length > 0) {
                        const cur = q.shift();
                        region.push(cur);
                        getNeighbors(cur).forEach(n => {
                            if (board[n] === 0 && !visited[n]) { visited[n] = true; q.push(n); }
                            else if (board[n] === 1) tB = true;
                            else if (board[n] === 2) tW = true;
                        });
                    }
                    if (tB && !tW) region.forEach(r => ownTerr[1].add(r));
                    else if (tW && !tB) region.forEach(r => ownTerr[2].add(r));
                }
            }
            pastureDetail = { 1: 0, 2: 0 };
            for (let i = 0; i < board.length; i++) {
                const p = board[i];
                if (p !== 1 && p !== 2) continue;
                if (getNeighbors(i).some(n => ownTerr[p].has(n))) {
                    pastureDetail[p]++;
                    if (p === 1) territory.black++; else territory.white++;
                }
            }`],
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
        ...K.STONE_MARKS_SPEC(`            // 羊: 自陣に接する石に綿毛の輪郭
            {
                // 自分だけの地を再計算 (スコアと同じ判定)
                const ownTerr = { 1: new Set(), 2: new Set() };
                const visited = Array(board.length).fill(false);
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0 || visited[i]) continue;
                    const region = [];
                    let tB = false, tW = false;
                    const q = [i];
                    visited[i] = true;
                    while (q.length > 0) {
                        const cur = q.shift();
                        region.push(cur);
                        getNeighbors(cur).forEach(n => {
                            if (board[n] === 0 && !visited[n]) { visited[n] = true; q.push(n); }
                            else if (board[n] === 1) tB = true;
                            else if (board[n] === 2) tW = true;
                        });
                    }
                    if (tB && !tW) region.forEach(r => ownTerr[1].add(r));
                    else if (tW && !tB) region.forEach(r => ownTerr[2].add(r));
                }
                ctx.save();
                ctx.strokeStyle = 'rgba(147,197,253,0.75)';
                for (let i = 0; i < board.length; i++) {
                    const p = board[i];
                    if (p !== 1 && p !== 2) continue;
                    if (!getNeighbors(i).some(n => ownTerr[p].has(n))) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    for (let k = 0; k < 6; k++) {
                        const a = k * Math.PI / 3;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(a) * cellSize * 0.24, cy + Math.sin(a) * cellSize * 0.24,
                            cellSize * 0.10, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '石は羊。終局時、自分だけの地 (柵) に接している自分の石は「柵の中の羊」として1つ+1目。',
            '柵を大きく囲んで群れを競え。柵判定は両者同じ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒が角を囲む: (0,1)(1,0) を黒、(0,0) が黒だけの地
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        endGameByScore();
        assert('柵の中の羊が計上される', pastureDetail[1] >= 1);
        assert('白には羊なし', pastureDetail[2] === 0);
        assert('終局する', gameOver === true);
    `,
};
