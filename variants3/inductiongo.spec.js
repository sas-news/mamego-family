// Induction-Go — 誘導碁: 3石以上の最長連がコイルとなり磁力を持つ。2マス離れた敵石が着手のたび引き寄せられる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'inductiongo.html',
    en: "Induction-Go",
    jp: "誘導碁",
    prefix: "inductiongo",
    desc: "着手者の3石以上の最大連がコイル化し、2マス離れた敵石を1マス引き寄せる。",
    kind: 'stone',
    icon: "inductiongo",
    spec: [
        ...K.rb("Induction-Go", "誘導碁", "inductiongo"),
        K.params([
            { key: 'coil_min', label: 'コイル化の最小連', min: 2, max: 6, def: 3, unit: '石' },
            { key: 'pull_dist', label: '磁力の届く距離', min: 2, max: 4, def: 2, unit: '目' },
        ]),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 誘導: 3石以上の最長自連がコイルとなり、2マス先の敵石を1マス引き寄せる\n            {\n                let best = null;\n                vChains(board, player).forEach(g => { if (!best || g.length > best.length) best = g; });\n                if (best && best.length >= (P('coil_min') || 3)) {\n                    const inCoil = new Set(best);\n                    const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n                    const pulls = [];\n                    for (let i = 0; i < board.length; i++) {\n                        if (board[i] !== opponent) continue;\n                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                        for (const [dx, dy] of D) {\n                            const mx = x + dx, my = y + dy, sx = x + dx * (P('pull_dist') || 2), sy = y + dy * (P('pull_dist') || 2);\n                            if (sx < 0 || sy < 0 || sx >= BOARD_SIZE || sy >= BOARD_SIZE) continue;\n                            const mi2 = my * BOARD_SIZE + mx, si = sy * BOARD_SIZE + sx;\n                            if (inCoil.has(si) && board[mi2] === 0) { pulls.push([i, mi2]); break; }\n                        }\n                    }\n                    pulls.forEach(([from, to]) => {\n                        if (board[to] !== 0) return;\n                        board[to] = opponent; board[from] = 0;\n                        fxSlide(from, to, 380);\n                        const fx = from % BOARD_SIZE, fy = Math.floor(from / BOARD_SIZE);\n                        pieces.forEach(pc => pc.cells.forEach(p => { if (p.x === fx && p.y === fy) { p.x = to % BOARD_SIZE; p.y = Math.floor(to / BOARD_SIZE); } }));\n                    });\n                    if (pulls.length) {\n                        fxText(best[0], '磁力!', '#c084fc', 1000);\n                        cleanUpPieces();\n                    }\n                }\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("'誘導: 最大連が敵石を引き寄せる'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "着手するたび、自分の3石以上の最長連がコイルとなり磁力を発する。コイルの石から2マス離れた敵石は、間が空いていれば1マス引き寄せられる。引き寄せられた敵は連の懐に飲まれる。"],
        [K.ONE, K.RV_ALGO, K.rv(["着手のたび最長連 (3石以上) が敵石を1マス引き寄せる",
            "引き寄せはコイルの石から2マス先・間が空いている敵のみ",
            "敵のコイルの2マス圏に近づくな"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[5*B+5]=1; board[6*B+5]=1; board[7*B+5]=1; // 黒コイル (5,5)-(5,7)\nboard[9*B+5]=2; // 白 (5,9) — コイルの(5,7)から2マス先\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('コイルが敵石を引き寄せる', board[8*B+5]===2 && board[9*B+5]===0);\nassert('コイルは不動', board[5*B+5]===1 && board[7*B+5]===1);\nassert('起動して通常着手可', isValidPlacement([{x:10,y:2}],2)===true);",
};
