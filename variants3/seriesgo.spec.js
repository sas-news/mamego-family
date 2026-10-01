// Series-Go — 直列碁: 一直線に4石以上並んだ直列連は電流が等しく通り、全石が活きて取れない
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
    file: 'seriesgo.html',
    en: "Series-Go",
    jp: "直列碁",
    prefix: "seriesgo",
    desc: "横一列か縦一列に4石以上並んだ連は直列回路となり、取られない。",
    kind: 'stone',
    icon: "seriesgo",
    spec: [
        ...K.rb("Series-Go", "直列碁", "seriesgo"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 直列碁: 一直線に4石以上並んだ連は直列回路 — 全部位に電流が通り取れない\n            const isSeries = (g) => {\n                if (g.length < 4) return false;\n                const xs = new Set(g.map(i => i % BOARD_SIZE));\n                const ys = new Set(g.map(i => Math.floor(i / BOARD_SIZE)));\n                return xs.size === 1 || ys.size === 1;\n            };\n            const captured = [];\n            vGroups(getCapturedStones(board, opponent)).forEach(g => {\n                if (!isSeries(g)) captured.push(...g);\n            });\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        ...K.STONE_MARKS_SPEC("            // 直列連: 4石以上の一直線連の石を淡く光らせる\n            {\n                ctx.save();\n                ctx.strokeStyle = 'rgba(96,165,250,0.7)';\n                ctx.lineWidth = Math.max(1, cellSize * 0.05);\n                vChains(board, 1).concat(vChains(board, 2)).forEach(g => {\n                    if (g.length < 4) return;\n                    const xs = new Set(g.map(i => i % BOARD_SIZE));\n                    const ys = new Set(g.map(i => Math.floor(i / BOARD_SIZE)));\n                    if (xs.size !== 1 && ys.size !== 1) return;\n                    g.forEach(i => {\n                        const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;\n                        ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2); ctx.stroke();\n                    });\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'直列: 一直線4連は不沈'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "横か縦に一直線に4石以上並んだ連は直列回路となり、電流が等しく全部位に通る — その連は取られない。折れ曲がると回路が切れて脆くなる。"],
        [K.ONE, K.RV_ALGO, K.rv(["一直線4石以上の連は取られない",
            "折れた連・L字連は直列にならない",
            "敵の直列は隅か拐かしで折らせよ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白の直列4連: y=5, x=3..6 を全包囲\n[3,4,5,6].forEach(x => { board[5*B+x]=2; board[4*B+x]=1; board[6*B+x]=1; });\nboard[5*B+2]=1; board[5*B+7]=1;\n// 白の折れ連 (9,9)(9,10)(10,9) を全包囲\nboard[9*B+9]=2; board[9*B+10]=2; board[10*B+9]=2;\nboard[9*B+8]=1; board[8*B+9]=1; board[8*B+10]=1; board[10*B+8]=1; board[10*B+10]=1; board[11*B+9]=1; board[9*B+11]=1;\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('直列連は取れない', board[5*B+3]===2 && board[5*B+6]===2);\nassert('折れ連は取れる', board[9*B+9]===0 && board[10*B+9]===0 && captures[1]===3);\nassert('起動して通常着手可', isValidPlacement([{x:11,y:2}],2)===true);",
};
