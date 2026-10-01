// Sekki-Go — 節気碁: 24節気の盤。8手ごとに節気が進み、その季節の区画では石が「旬」で取れない
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
    file: 'sekkigo.html',
    en: "Sekki-Go",
    jp: "節気碁",
    prefix: "sekkigo",
    desc: "8手ごとに節気が進み、その季節の区画では石が「旬」で取れない。",
    kind: 'stone',
    icon: "sekkigo",
    spec: [
        ...K.rb("Sekki-Go", "節気碁", "sekkigo"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 節気碁: 盤を4区画に分け、8手ごとに旬の区画が移る。旬の区画の石は取れない\n            const c = Math.floor(BOARD_SIZE / 2);\n            const season = Math.floor(history.length / 8) % 4;\n            const captured = getCapturedStones(board, opponent).filter(i => {\n                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                return ((x >= c ? 1 : 0) + (y >= c ? 2 : 0)) !== season;\n            });\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 旬の区画を黄金色に染める\n            {\n                const c = Math.floor(BOARD_SIZE / 2);\n                const season = Math.floor(history.length / 8) % 4;\n                const x0 = season % 2 === 0 ? -1 : c - 0.5;\n                const y0 = season < 2 ? -1 : c - 0.5;\n                ctx.save();\n                ctx.fillStyle = 'rgba(250,204,21,0.10)';\n                ctx.fillRect(padding + (x0 + 0.5) * cellSize, padding + (y0 + 0.5) * cellSize, (c + 0.5) * cellSize, (c + 0.5) * cellSize);\n                ctx.strokeStyle = 'rgba(250,204,21,0.35)';\n                ctx.lineWidth = 1.5;\n                ctx.strokeRect(padding + (x0 + 0.5) * cellSize, padding + (y0 + 0.5) * cellSize, (c + 0.5) * cellSize, (c + 0.5) * cellSize);\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'節気 ' + ['立春','立夏','立秋','立冬'][Math.floor(history.length / 8) % 4] + ' 残' + (8 - history.length % 8) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "盤は四区画の節気盤。8手ごとに節気が右上から反時計回りに進み、その季節の区画にある石は「旬」となって取られない。旬の区画は盤面が淡く染まり、石は当節の恩恵を受ける。"],
        [K.ONE, K.RV_ALGO, K.rv(["盤は4区画に分かれ、8手ごとに旬の区画が移る",
            "旬の区画にある石は取られない",
            "陣地取りは従来通り。タイミングを読んで攻め込め"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[2*B+2]=2; board[2*B+1]=1; board[2*B+3]=1; board[1*B+2]=1; board[3*B+2]=1; // 白(2,2)は既に死に体 (左上区画)\nhistory.length=6;\nexecuteMove({cells:[{x:9,y:9}]},1); // 7手目: 区画0が旬 → 取り上げを免れる\nassert('旬の区画の石は取れない', board[2*B+2]===2 && captures[1]===0);\nhistory.length=8;\nexecuteMove({cells:[{x:10,y:10}]},1); // 9手目: 旬は区画1(右上) → 左上は解凍\nassert('旬が移れば取れる', board[2*B+2]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:8,y:8}],2)===true);",
};
