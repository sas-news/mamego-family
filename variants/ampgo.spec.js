// Amp-Go — 増幅碁: 盤上の2つの増幅点。点の隣に石があれば信号が増幅され、取りが2倍になる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'ampgo.html',
    en: "Amp-Go",
    jp: "増幅碁",
    prefix: "ampgo",
    desc: "2つの増幅点の周囲1マスに石がある側は、その手の取りが2倍になる。",
    kind: 'stone',
    icon: "ampgo",
    spec: [
        ...K.rb("Amp-Go", "増幅碁", "ampgo"),
        K.params([
            { key: 'amp_mult', label: '増幅倍率', min: 1, max: 4, def: 2, unit: '倍' },
            { key: 'amp_range', label: '増幅の届く距離', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.CAPTURE_BLOCK, "            // 増幅碁: 増幅点 (中央行の左右) の隣に自石があると取りが2倍\n            const c0 = Math.floor(BOARD_SIZE / 2);\n            const amps = [c0 * BOARD_SIZE + 2, c0 * BOARD_SIZE + (BOARD_SIZE - 3)];\n            let amped = false;\n            for (const a of amps) {\n                const ax = a % BOARD_SIZE, ay = Math.floor(a / BOARD_SIZE);\n                for (let i = 0; i < board.length; i++) {\n                    if (board[i] === player && Math.abs(i % BOARD_SIZE - ax) <= (P('amp_range') || 1) && Math.abs(Math.floor(i / BOARD_SIZE) - ay) <= (P('amp_range') || 1)) { amped = true; break; }\n                }\n                if (amped) break;\n            }\n            const captured = getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length * (amped ? (P('amp_mult') || 2) : 1);\n                if (amped) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '増幅x' + (P('amp_mult') || 2) + '!', '#a78bfa', 1000);\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 増幅点: 三角形のオペアンプ記号\n            {\n                const c0 = Math.floor(BOARD_SIZE / 2);\n                ctx.save();\n                [c0 * BOARD_SIZE + 2, c0 * BOARD_SIZE + (BOARD_SIZE - 3)].forEach(a => {\n                    const px = padding + (a % BOARD_SIZE) * cellSize, py = padding + Math.floor(a / BOARD_SIZE) * cellSize;\n                    ctx.strokeStyle = 'rgba(167,139,250,0.9)';\n                    ctx.lineWidth = 1.6;\n                    ctx.beginPath();\n                    ctx.moveTo(px - cellSize * 0.3, py - cellSize * 0.32);\n                    ctx.lineTo(px - cellSize * 0.3, py + cellSize * 0.32);\n                    ctx.lineTo(px + cellSize * 0.34, py);\n                    ctx.closePath(); ctx.stroke();\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'増幅点: 左右の△の隣を押さえよ'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "中央行の左右2つの点は増幅器。その点の周囲1マスに自石があると信号が増幅され、その手の取り上げが2倍のアゲハマになる。増幅点の争奪が勝負。"],
        [K.ONE, K.RV_BASE, K.rv(["増幅点の周囲1マスに石があると取りが2倍",
            "増幅点は左右に1つずつ",
            "増幅点を押さえてから攻め込め"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[6*B+3]=1; // 黒が左増幅点(2,6)の隣を押さえる\nboard[6*B+6]=2; board[6*B+5]=1; board[6*B+7]=1; board[5*B+6]=1; board[7*B+6]=1; // 白(6,6)は既に全包囲\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('増幅で取り2倍', captures[1]===2 && board[6*B+6]===0);\nboard.fill(0); captures={1:0,2:0};\nboard[9*B+9]=2; board[9*B+8]=1; board[8*B+9]=1; board[10*B+9]=1; // 呼吸は(10,9)のみ\nexecuteMove({cells:[{x:10,y:9}]},1); // 増幅なし\nassert('増幅なしは通常の取り', captures[1]===1);",
};
