// CRUMBGO — 崩落碁: 手番ごとに全ての連 (2石以上) が端から1石ずつ崩れていく
const K = require('../gen_kit.js');
module.exports = {
    file: 'crumbgo.html',
    en: 'CRUMBGO',
    jp: '崩落碁',
    prefix: 'crumbgo',
    desc: '全ての連は手番ごとに端から1石ずつ崩れていく。盤は常に崩壊中。',
    kind: 'stone',
    spec: [
        ...K.rb('CRUMBGO', '崩落碁', 'crumbgo'),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 崩落: 全ての連 (2石以上) が最も露出した端から1石ずつ崩れる
            {
                const snapB = [...board];
                const seen = new Set();
                const groups = [];
                for (let i = 0; i < snapB.length; i++) {
                    const v = snapB[i];
                    if ((v !== 1 && v !== 2) || seen.has(i)) continue;
                    const grp = [];
                    const q = [i]; seen.add(i);
                    while (q.length > 0) {
                        const c = q.shift(); grp.push(c);
                        getNeighbors(c).forEach(n => { if (snapB[n] === v && !seen.has(n)) { seen.add(n); q.push(n); } });
                    }
                    groups.push({ v, grp });
                }
                let fell = 0;
                groups.forEach(({ v, grp }) => {
                    if (grp.length < 2) return;
                    let tip = grp[0], tipN = 99;
                    grp.forEach(g => {
                        const fn = getNeighbors(g).filter(n => snapB[n] === v).length;
                        if (fn < tipN) { tipN = fn; tip = g; }
                    });
                    if (board[tip] === v) { board[tip] = 0; fell++; }
                });
                if (fell > 0) cleanUpPieces();
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 崩れる端: 自連に1箇所しか繋がっていない石に亀裂点
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const fn = getNeighbors(i).filter(n => board[n] === v).length;
                if (fn > 1) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                ctx.save();
                ctx.strokeStyle = 'rgba(120, 90, 60, 0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                const rr = cellSize * 0.14;
                ctx.beginPath();
                ctx.moveTo(cx - rr, cy - rr); ctx.lineTo(cx, cy); ctx.lineTo(cx + rr * 0.4, cy - rr * 0.6);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたび、盤上の全ての連 (2石以上) が最も露出した端から1石ずつ崩れる。',
            '崩れた石は誰の取り分にもならずただ消える。大きな連を保つには絶えず修復が要る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 7] = 1;
        board[9 * BOARD_SIZE + 9] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('黒の3連が端から崩れる', board.filter(v => v === 1).length === 3); // 3連-1 + 着手1
        assert('白単石は崩れない', board[9 * BOARD_SIZE + 9] === 2);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('白の手番でも黒が崩れる', board.filter(v => v === 1).length === 2); // 2連がさらに1石崩れ
        assert('崩れた石は誰の取りにもならない', captures[1] === 0 && captures[2] === 0);
    `,
};
