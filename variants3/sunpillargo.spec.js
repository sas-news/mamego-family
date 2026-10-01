// Sun Pillar-Go — 光柱碁: 縦筋に4石以上並べると光柱が立ち、その筋の石は全て祝福されて取れない
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
    file: 'sunpillargo.html',
    en: "Sun Pillar-Go",
    jp: "光柱碁",
    prefix: "sunpillargo",
    desc: "縦筋に同色4石以上並ぶと光柱が立ち、その筋の石は取れない。",
    kind: 'stone',
    icon: "sunpillargo",
    spec: [
        ...K.rb("Sun Pillar-Go", "光柱碁", "sunpillargo"),
        K.params([
            { key: 'pillar_len', label: '光柱に必要な石数', min: 2, max: 8, def: 4, unit: '石' },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 光柱碁: 縦筋に4石以上並んだ列は祝福され、そこの敵石は取れない\n            const colCount = (x, pl) => {\n                let n = 0;\n                for (let y = 0; y < BOARD_SIZE; y++) if (board[y * BOARD_SIZE + x] === pl) n++;\n                return n;\n            };\n            const captured = getCapturedStones(board, opponent).filter(i => colCount(i % BOARD_SIZE, opponent) < (P('pillar_len') || 4));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 光柱: 4石以上並んだ筋に光を立てる\n            {\n                ctx.save();\n                for (let x = 0; x < BOARD_SIZE; x++) {\n                    let lit = false;\n                    for (const pl of [1, 2]) {\n                        let n = 0;\n                        for (let y = 0; y < BOARD_SIZE; y++) if (board[y * BOARD_SIZE + x] === pl) n++;\n                        if (n >= (P('pillar_len') || 4)) { lit = true; break; }\n                    }\n                    if (!lit) continue;\n                    const px = padding + x * cellSize;\n                    const g = ctx.createLinearGradient(px, padding, px, padding + (BOARD_SIZE - 1) * cellSize);\n                    g.addColorStop(0, 'rgba(253,224,71,0)');\n                    g.addColorStop(0.5, 'rgba(253,224,71,0.30)');\n                    g.addColorStop(1, 'rgba(253,224,71,0)');\n                    ctx.strokeStyle = g;\n                    ctx.lineWidth = cellSize * 0.55;\n                    ctx.beginPath();\n                    ctx.moveTo(px, padding - cellSize * 0.5);\n                    ctx.lineTo(px, padding + (BOARD_SIZE - 0.5) * cellSize);\n                    ctx.stroke();\n                }\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'光柱: 縦筋に4石並べよ'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "縦の筋に同色4石以上を並べると光柱が立ち、その筋の自石は全て祝福されて取られなくなる。筋を横断するように攻め、柱を断て。"],
        [K.ONE, K.RV_ALGO, K.rv(["縦筋に同色4石以上で光柱が立ち、その筋の石は取れない",
            "柱を断つには相手の筋の石を減らすか筋を分断せよ",
            "柱は取りの絶対防御。陣地の骨組みに使え"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白の光柱: x=4 の筋に4石\n[4,5,6,7].forEach(y => board[y*B+4]=2);\n[4,5,6,7].forEach(y => { board[y*B+3]=1; board[y*B+5]=1; });\nboard[3*B+4]=1; board[8*B+4]=1; // 柱を全包囲\nboard[9*B+9]=2; board[9*B+8]=1; board[8*B+9]=1; board[10*B+9]=1; // 呼吸は(10,9)のみ // 孤立白も包囲\nexecuteMove({cells:[{x:10,y:9}]},1);\nassert('孤立石は取れる', board[9*B+9]===0 && captures[1]===1);\nassert('光柱の筋は取れない', board[4*B+4]===2 && board[7*B+4]===2);\nassert('起動して通常着手可', isValidPlacement([{x:0,y:0}],2)===true);",
};
