// Polar Night-Go — 極夜碁: 24手周期の18-23手目は極夜。日が全く昇らず、この間は一切の石が取れない
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
    file: 'polarnightgo.html',
    en: "Polar Night-Go",
    jp: "極夜碁",
    prefix: "polarnightgo",
    desc: "周期の最後6手は極夜。日が昇らず、どんな石も取れない。",
    kind: 'stone',
    icon: "polarnightgo",
    spec: [
        ...K.rb("Polar Night-Go", "極夜碁", "polarnightgo"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 極夜碁: 周期の18-23手目は極夜。一切の取りが凍る\n            const pn = (history.length % 24) >= 18;\n            const captured = pn ? [] : getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n                if (pn) fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#818cf8', 700);\n            }"],
        K.CUE_GRID("            // 極夜は盤面を深い藍に染める\n            if ((history.length % 24) >= 18) {\n                ctx.save();\n                ctx.fillStyle = 'rgba(15,23,42,0.40)';\n                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, BOARD_SIZE * cellSize, BOARD_SIZE * cellSize);\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("(history.length % 24) >= 18 ? '極夜' : '極夜まで' + (((18 - history.length % 24) + 24) % 24) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "24手周期の18〜23手目は極夜 — 太陽が昇らず盤が凍る。この間はどんな包囲も取りにならない。極夜の6手間は息を潜めて布石を整えよ。"],
        [K.ONE, K.RV_ALGO, K.rv(["周期の最後6手は極夜で一切取れない",
            "極夜の間に置いた石は安全な布石",
            "極夜明けの一手が勝負所"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; board[4*B+3]=1; board[3*B+4]=1; board[5*B+4]=1; // 白(4,4) 呼吸は(4,5)のみ\nhistory.length=17;\nexecuteMove({cells:[{x:5,y:4}]},1); // 18手目: 極夜 → 取れない\nassert('極夜は取れない', board[4*B+4]===2 && captures[1]===0);\nhistory.length=0;\nexecuteMove({cells:[{x:0,y:0}]},1); // 1手目: 日のある時期 → 取れる\nassert('極夜明けは取れる', board[4*B+4]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:8,y:8}],2)===true);",
};
