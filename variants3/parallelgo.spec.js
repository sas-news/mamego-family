// Parallel-Go — 並列碁: 3石以上の連が2つ以上あれば並列回路 — 一方が切れても他方が活きて取れない
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'parallelgo.html',
    en: "Parallel-Go",
    jp: "並列碁",
    prefix: "parallelgo",
    desc: "3石以上の連を2つ以上持つ側は、長連が包囲されても片方が切れるだけで取れない。",
    kind: 'stone',
    icon: "parallelgo",
    spec: [
        ...K.rb("Parallel-Go", "並列碁", "parallelgo"),
        K.params([
            { key: 'chain_min', label: '冗長となる連の最小サイズ', min: 2, max: 5, def: 3, unit: '石' },
            { key: 'chains_needed', label: '冗長に必要な連の数', min: 2, max: 4, def: 2 },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 並列碁: 3石以上の連を2つ以上持つ側は冗長回路 — 長連の取りを免れる\n            const strong = vChains(board, opponent).filter(g => g.length >= (P('chain_min') || 3)).length;\n            const captured = [];\n            vGroups(getCapturedStones(board, opponent)).forEach(g => {\n                if (!(strong >= (P('chains_needed') || 2) && g.length >= (P('chain_min') || 3))) captured.push(...g);\n            });\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        ...K.EVENT_CHIP_SPEC("'並列: 3連を2つ持てば冗長'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "3石以上の連を2つ以上並走させると並列回路 — 片方が断線 (包囲) されてももう片方が電流を通し、長い連は取られない。単石・小連には効かない。"],
        [K.ONE, K.RV_BASE, K.rv(["3石以上の連が2つあると冗長回路",
            "冗長時は3石以上の連が取られない (小連は取れる)",
            "敵の冗長回路は片方を潰してから本体を断て"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白の連A (4,4)-(4,6) を全包囲、連B (9,9)-(9,11) は無傷 — 冗長成立\n[4,5,6].forEach(y => { board[y*B+4]=2; board[y*B+3]=1; board[y*B+5]=1; });\nboard[3*B+4]=1; board[7*B+4]=1;\n[9,10,11].forEach(y => board[y*B+9]=2);\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('冗長回路の連は取れない', board[4*B+4]===2 && board[6*B+4]===2);\n// 連Bを手で消して冗長を崩す\n[9,10,11].forEach(y => board[y*B+9]=0);\nexecuteMove({cells:[{x:1,y:0}]},1);\nassert('冗長が崩れれば取れる', board[4*B+4]===0 && captures[1]===3);\nassert('起動して通常着手可', isValidPlacement([{x:2,y:10}],1)===true);",
};
