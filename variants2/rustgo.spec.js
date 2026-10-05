// RUSTGO — 錆碁: 手番ごとに相手の連が端から1石ずつ錆びて落ちる
const K = require('../gen_kit.js');
module.exports = {
    file: 'rustgo.html',
    en: 'RUSTGO',
    jp: '錆碁',
    prefix: 'rustgo',
    desc: '自分が着手するたび、相手の連 (2石以上) の端が1石ずつ錆びる。',
    kind: 'stone',
    spec: [
        ...K.rb('RUSTGO', '錆碁', 'rustgo'),
        K.params([
            { key: 'rust_count', label: '1回に錆びる石数', min: 1, max: 3, def: 1, unit: '個' },
            { key: 'rust_min', label: '錆びる連の最小サイズ', min: 1, max: 5, def: 2, unit: '石' },
            { key: 'cap_extra', label: '打ち切り余分', min: 0, max: 8, def: 2, unit: '行分', hint: '交点数+この行数×盤サイズの手数で強制終局' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 錆碁: 相手の連 (2石以上) が最も露出した端から1石ずつ錆びる
            {
                const snapB = [...board];
                const seen = new Set();
                const groups = [];
                for (let i = 0; i < snapB.length; i++) {
                    if (snapB[i] !== opponent || seen.has(i)) continue;
                    const grp = [];
                    const q = [i]; seen.add(i);
                    while (q.length > 0) {
                        const c = q.shift(); grp.push(c);
                        getNeighbors(c).forEach(n => { if (snapB[n] === opponent && !seen.has(n)) { seen.add(n); q.push(n); } });
                    }
                    groups.push(grp);
                }
                let rusted = 0;
                const rustN = Math.max(1, P('rust_count') || 1);
                const rustMin = Math.max(1, P('rust_min') || 2);
                groups.forEach(grp => {
                    if (grp.length < rustMin) return;
                    const cand = [];
                    grp.forEach(g => {
                        const fn = getNeighbors(g).filter(n => snapB[n] === opponent).length;
                        cand.push([g, fn]);
                    });
                    cand.sort((a, b) => a[1] - b[1]); // 最も露出した端から順に
                    for (let k = 0; k < Math.min(rustN, cand.length); k++) {
                        const tip = cand[k][0];
                        if (board[tip] === opponent) {
                            board[tip] = 0; rusted++;
                            fxSplash(tip, '#a16207'); // 錆が散る
                            fxGlow(tip, '#b45309', 450);
                        }
                    }
                });
                if (rusted > 0) { captures[player] += rusted; cleanUpPieces(); }
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_extra') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 錆の兆候: 自連に1箇所しか繋がっていない「端」石に錆色の点
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const fn = getNeighbors(i).filter(n => board[n] === v).length;
                if (fn > 1) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                ctx.save();
                ctx.fillStyle = 'rgba(160, 90, 40, 0.85)';
                ctx.beginPath();
                ctx.arc(padding + x * cellSize + cellSize * 0.18, padding + y * cellSize + cellSize * 0.18, cellSize * 0.08, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '自分が着手するたび、相手の連 (2石以上) は最も露出した端の1石が錆びて落ちる。',
            '錆びた石は相手のアゲハマになる。小さな連はみるみる溶ける — 固めるか早く取るか。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures[1] = 0; captures[2] = 0;
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2; board[5 * BOARD_SIZE + 7] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('白の3連が端から錆びる', board.filter(v => v === 2).length === 2);
        assert('錆びた分は黒の取り', captures[1] === 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('毎手番に錆びる', board.filter(v => v === 2).length === 1);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('単石は錆びない', board.filter(v => v === 2).length === 1);
    `,
};
