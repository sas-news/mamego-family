// Hakuro-Go — 白露碁: 16手周期の頭4手は白露の朝。石に露が乗って重くなり、取れない
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
    file: 'hakurogo.html',
    en: "Hakuro-Go",
    jp: "白露碁",
    prefix: "hakurogo",
    desc: "周期の最初4手は白露の朝。石が露で重くなり取れない。",
    kind: 'stone',
    icon: "hakurogo",
    spec: [
        ...K.rb("Hakuro-Go", "白露碁", "hakurogo"),
        K.params([
            { key: 'dew_period', label: '白露の周期', min: 8, max: 40, def: 16, step: 2, unit: '手' },
            { key: 'dew_len', label: '白露の長さ', min: 1, max: 10, def: 4, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 白露碁: 周期の頭4手は露で石が重く、取れない\n            const __dp = Math.max(2, P('dew_period') || 16);\n            const dew = (history.length % __dp) <= Math.min(__dp, Math.max(1, P('dew_len') || 4)) - 1;\n            const captured = dew ? [] : getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n                if (dew) fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#93c5fd', 700);\n            }"],
        K.CUE_GRID("            // 露の朝は盤面を薄青く濡らす\n            if ((history.length % Math.max(2, P('dew_period') || 16)) <= Math.min(Math.max(2, P('dew_period') || 16), Math.max(1, P('dew_len') || 4)) - 1) {\n                ctx.save();\n                ctx.fillStyle = 'rgba(147,197,253,0.12)';\n                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, BOARD_SIZE * cellSize, BOARD_SIZE * cellSize);\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("(history.length % Math.max(2, P('dew_period') || 16)) <= Math.min(Math.max(2, P('dew_period') || 16), Math.max(1, P('dew_len') || 4)) - 1 ? '白露の朝' : '露まで' + (Math.max(2, P('dew_period') || 16) - history.length % Math.max(2, P('dew_period') || 16)) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "16手周期の頭4手は白露の朝。石に露が乗って重くなり、この間はどんな石も取れない。包囲を完成させても朝が明けるのを待て。"],
        [K.ONE, K.RV_BASE, K.rv(["周期の最初4手は石が露で重く取れない",
            "包囲は解けるが取り上げは朝明けまでお預け",
            "露の間に守りを固めるか捨て石にするかを読め"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; board[4*B+3]=1; board[3*B+4]=1; board[5*B+4]=1; // 白(4,4) 呼吸は(4,5)のみ\nhistory.length=15;\nexecuteMove({cells:[{x:5,y:4}]},1); // 16手目: 露の朝 → 取れない\nassert('露で石が重く取れない', board[4*B+4]===2 && captures[1]===0);\nhistory.length=4;\nexecuteMove({cells:[{x:0,y:0}]},1); // 5手目: 通常 → 包囲解決\nassert('露が晴れれば取れる', board[4*B+4]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:8,y:8}],2)===true);",
};
