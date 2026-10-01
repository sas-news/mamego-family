// Genjitsu-Go — 幻日碁: 対蹠の2つの幻日が6手ごとに盤を巡る。幻日に眩まれた敵石は取れない
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
    file: 'genjitsugo.html',
    en: "Genjitsu-Go",
    jp: "幻日碁",
    prefix: "genjitsugo",
    desc: "6手ごとに対蹠の幻日が巡り、幻日の周囲2マスにある敵石は眩んで取れない。",
    kind: 'stone',
    icon: "genjitsugo",
    spec: [
        ...K.rb("Genjitsu-Go", "幻日碁", "genjitsugo"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 幻日碁: 対蹠の2つの太陽が盤を巡る。幻日の周囲2マスの敵石は眩んで取れない\n            const th = (Math.floor(history.length / 6) % 8) * Math.PI / 4;\n            const cc = (BOARD_SIZE - 1) / 2;\n            const suns = [0, 1].map(k => ({\n                x: Math.round(cc + 4 * Math.cos(th + k * Math.PI)),\n                y: Math.round(cc + 4 * Math.sin(th + k * Math.PI))\n            }));\n            const dazzled = (i) => {\n                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                return suns.some(s => Math.abs(s.x - x) + Math.abs(s.y - y) <= 2);\n            };\n            const captured = getCapturedStones(board, opponent).filter(i => !dazzled(i));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 対蹠の2つの幻日を描く\n            {\n                const th = (Math.floor(history.length / 6) % 8) * Math.PI / 4;\n                const cc = (BOARD_SIZE - 1) / 2;\n                ctx.save();\n                [0, 1].forEach(k => {\n                    const sx = Math.round(cc + 4 * Math.cos(th + k * Math.PI));\n                    const sy = Math.round(cc + 4 * Math.sin(th + k * Math.PI));\n                    const px = padding + sx * cellSize, py = padding + sy * cellSize;\n                    const g = ctx.createRadialGradient(px, py, 0, px, py, cellSize * 1.5);\n                    g.addColorStop(0, 'rgba(253,224,71,0.5)');\n                    g.addColorStop(1, 'rgba(253,224,71,0)');\n                    ctx.fillStyle = g;\n                    ctx.beginPath(); ctx.arc(px, py, cellSize * 1.5, 0, Math.PI * 2); ctx.fill();\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'幻日 ' + '↑↗→↘↓↙←↖'.charAt(Math.floor(history.length / 6) % 8)"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "大気の氷晶が作る幻日が2つ、対蹠に現れる。6手ごとに盤の周を巡り、幻日の周囲2マスにある敵石は眩んで取れない。日の下に潜り込め。"],
        [K.ONE, K.RV_ALGO, K.rv(["対蹠の2つの幻日が6手ごとに盤を巡る",
            "幻日の周囲2マス (マンハッタン距離) の敵石は取れない",
            "幻日が去るのを待って包囲を完成させよ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 幻日は6手目まで (10,6) と (2,6) に出る (B=13の場合)\nboard[7*B+2]=2; board[7*B+1]=1; board[7*B+3]=1; board[6*B+2]=1; // 白(2,7) 呼吸は(2,8)のみ — 幻日(2,6)のマンハッタン2内\nboard[9*B+9]=2; board[9*B+8]=1; board[8*B+9]=1; board[10*B+9]=1; // 呼吸は(10,9)のみ // 白(9,9) 呼吸は(9,10)のみ — 幻日の外\nexecuteMove({cells:[{x:2,y:8}]},1); // 1手目: 幻日の下の白は眩んで取れない\nassert('幻日に眩んだ石は取れない', board[7*B+2]===2);\nexecuteMove({cells:[{x:10,y:9}]},1); // 2手目: 幻日の外の白を取る\nassert('幻日の外の石は取れる', board[9*B+9]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:11,y:11}],2)===true);",
};
