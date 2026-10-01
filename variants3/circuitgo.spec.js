// Circuit-Go — 回路碁: 中央3x3の電源コアに石が載る連は通電して不死身。電源のない連は取られる
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
    file: 'circuitgo.html',
    en: "Circuit-Go",
    jp: "回路碁",
    prefix: "circuitgo",
    desc: "中央3x3の電源コア。連に1石でもコアの石があれば通電して取られない。",
    kind: 'stone',
    icon: "circuitgo",
    spec: [
        ...K.rb("Circuit-Go", "回路碁", "circuitgo"),
        K.params([
            { key: 'core_radius', label: '電源コアの半径', min: 1, max: 4, def: 1, hint: '1=中央3x3' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 回路碁: 中央3x3の電源コアに触れる連は通電して取られない\n            const c0 = Math.floor(BOARD_SIZE / 2);\n            const _cr = Math.max(1, P('core_radius') || 1);\n            const inCore = (i) => {\n                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                return x >= c0 - _cr && x <= c0 + _cr && y >= c0 - _cr && y <= c0 + _cr;\n            };\n            const captured = [];\n            vGroups(getCapturedStones(board, opponent)).forEach(g => {\n                if (!g.some(inCore)) captured.push(...g);\n            });\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 電源コア: 中央3x3に回路基板の輝き\n            {\n                const c0 = Math.floor(BOARD_SIZE / 2);\n                const _cr = Math.max(1, P('core_radius') || 1);\n                ctx.save();\n                ctx.fillStyle = 'rgba(34,197,94,0.13)';\n                ctx.fillRect(padding + (c0 - _cr - 0.5) * cellSize, padding + (c0 - _cr - 0.5) * cellSize, (_cr * 2 + 1) * cellSize, (_cr * 2 + 1) * cellSize);\n                ctx.strokeStyle = 'rgba(74,222,128,0.55)';\n                ctx.lineWidth = 1.5;\n                ctx.strokeRect(padding + (c0 - _cr - 0.5) * cellSize, padding + (c0 - _cr - 0.5) * cellSize, (_cr * 2 + 1) * cellSize, (_cr * 2 + 1) * cellSize);\n                // 中央に電源シンボル\n                const px = padding + c0 * cellSize, py = padding + c0 * cellSize;\n                ctx.strokeStyle = 'rgba(74,222,128,0.8)';\n                ctx.beginPath(); ctx.arc(px, py, cellSize * 0.28, 0, Math.PI * 2); ctx.stroke();\n                ctx.beginPath(); ctx.moveTo(px, py - cellSize * 0.42); ctx.lineTo(px, py - cellSize * 0.14); ctx.stroke();\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'回路: 中央コアに触れる連は不死'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "盤中央3x3は電源コア。連に1石でもコア内の石があれば通電して、その連はいくら包囲されても取られない。コアを押さえた者が不死の根拠地を得る。"],
        [K.ONE, K.RV_ALGO, K.rv(["中央3x3のコアに触れる連は取られない",
            "コアの石を絶やさないことが不沈の条件",
            "敵の通電連はコアごと断て"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白の連: (6,6)(6,7) — コア内に石を持つ → 全包囲しても生きる\nboard[6*B+6]=2; board[7*B+6]=2;\nboard[6*B+5]=1; board[6*B+7]=1; board[7*B+5]=1; board[7*B+7]=1; board[5*B+6]=1; board[8*B+6]=1;\n// 白(1,1) はコア外の孤立 → 包囲すれば取れる\nboard[1*B+1]=2; board[0*B+1]=1; board[2*B+1]=1; board[1*B+0]=1; board[1*B+2]=1;\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('通電した連は死なない', board[6*B+6]===2 && board[7*B+6]===2);\nassert('コア外の連は取れる', board[1*B+1]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:10,y:10}],2)===true);",
};
