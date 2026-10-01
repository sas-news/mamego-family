// Resistor-Go — 抵抗碁: 連が長いほど抵抗が大きく電流が散る — 6石以上の連を取ってもアゲハマは1個分
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
    file: 'resistorgo.html',
    en: "Resistor-Go",
    jp: "抵抗碁",
    prefix: "resistorgo",
    desc: "6石以上の連を取ってもアゲハマは1個分しか増えない。",
    kind: 'stone',
    icon: "resistorgo",
    spec: [
        ...K.rb("Resistor-Go", "抵抗碁", "resistorgo"),
        K.params([
            { key: 'resist_len', label: '抵抗が効く連の長さ', min: 2, max: 12, def: 6, unit: '石', hint: 'この長さ以上の連の取りは1個分' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 抵抗碁: 長い連はエネルギーを散らす。6石以上の連の取りは1個分\n            const groups = vGroups(getCapturedStones(board, opponent));\n            const captured = groups.reduce((a, g) => a.concat(g), []);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += groups.reduce((s, g) => s + (g.length >= Math.max(2, P('resist_len') || 6) ? 1 : g.length), 0);\n                if (groups.some(g => g.length >= Math.max(2, P('resist_len') || 6))) {\n                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '抵抗Ω', '#facc15', 1000);\n                }\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        ...K.STONE_MARKS_SPEC("            // 抵抗: 長い連 (6石以上) の石にΩマーク\n            {\n                ctx.save();\n                ctx.fillStyle = 'rgba(250,204,21,0.85)';\n                vChains(board, 1).concat(vChains(board, 2)).forEach(g => {\n                    if (g.length < Math.max(2, P('resist_len') || 6)) return;\n                    g.forEach(i => {\n                        const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;\n                        ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2); ctx.fill();\n                    });\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'抵抗: ' + Math.max(2, P('resist_len') || 6) + '連以上の取りは1個分'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "連が長いほど抵抗値が上がり電流が散る。6石以上の連を取り上げてもアゲハマは1個分しか増えない。大蛇を取るより小連を刈る方が得。"],
        [K.ONE, K.RV_ALGO, K.rv(["6石以上の連を取ってもアゲハマは1個分",
            "小さな連を刻んで取る方が効率的",
            "大連は堅いが取られても損失は小さい"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白の6連 (4,4)-(4,9) を全包囲\n[4,5,6,7,8,9].forEach(y => { board[y*B+4]=2; board[y*B+3]=1; board[y*B+5]=1; });\nboard[3*B+4]=1; board[10*B+4]=1;\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('長連は全滅する', board[4*B+4]===0 && board[9*B+4]===0);\nassert('抵抗でアゲハマは1個分', captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:11,y:11}],2)===true);",
};
