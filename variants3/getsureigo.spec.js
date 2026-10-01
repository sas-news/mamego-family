// Getsurei-Go — 月齢碁: 月齢30手周期で夜の帯 (上端) の深さが変わる。夜の中の石は取れない
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
    file: 'getsureigo.html',
    en: "Getsurei-Go",
    jp: "月齢碁",
    prefix: "getsureigo",
    desc: "月齢30手周期で夜の帯の深さが0〜6行に変わる。夜の中の石は取れない。",
    kind: 'stone',
    icon: "getsureigo",
    spec: [
        ...K.rb("Getsurei-Go", "月齢碁", "getsureigo"),
        K.params([
            { key: 'moon_cycle', label: '月齢の周期', min: 8, max: 120, def: 30, unit: '手' },
            { key: 'night_rows', label: '夜の帯の深さ', min: 2, max: 16, def: 6, unit: '行' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 月齢碁: 月齢で夜の帯 (上端からの行数) が変わり、夜の石は取れない\n            const nh = Math.round((P('night_rows') || 6) / 2 * (1 + Math.cos(2 * Math.PI * (history.length % (P('moon_cycle') || 30)) / (P('moon_cycle') || 30))));\n            const captured = getCapturedStones(board, opponent).filter(i => Math.floor(i / BOARD_SIZE) >= nh);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 夜の帯を暗くする\n            {\n                const nh = Math.round((P('night_rows') || 6) / 2 * (1 + Math.cos(2 * Math.PI * (history.length % (P('moon_cycle') || 30)) / (P('moon_cycle') || 30))));\n                if (nh > 0) {\n                    ctx.save();\n                    const g = ctx.createLinearGradient(0, padding - cellSize / 2, 0, padding + (nh - 0.5) * cellSize);\n                    g.addColorStop(0, 'rgba(30,27,75,0.55)');\n                    g.addColorStop(1, 'rgba(30,27,75,0.10)');\n                    ctx.fillStyle = g;\n                    ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, BOARD_SIZE * cellSize, nh * cellSize);\n                    ctx.restore();\n                }\n            }"),
        ...K.EVENT_CHIP_SPEC("'月齢' + (history.length % (P('moon_cycle') || 30)) + ' 夜' + Math.round((P('night_rows') || 6) / 2 * (1 + Math.cos(2 * Math.PI * (history.length % (P('moon_cycle') || 30)) / (P('moon_cycle') || 30)))) + '行'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "月齢は30手周期。新月 (周期頭) で夜の帯は上端から6行と最も深く、満月 (15手目) で0行になる。夜の中の石は取られない。上辺に布石を置くなら新月の頃。"],
        [K.ONE, K.RV_ALGO, K.rv(["30手周期で夜の帯の深さが0〜6行に変わる",
            "夜の帯の中の石は取られない",
            "新月で上辺に深く潜り込み、満月で引き抜け"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[2*B+2]=2; board[2*B+1]=1; board[2*B+3]=1; board[1*B+2]=1; board[3*B+2]=1; // 白(2,2)は既に死に体 (夜の帯内)\nboard[9*B+9]=2; board[9*B+8]=1; board[8*B+9]=1; board[10*B+9]=1; // 白(9,9) 呼吸は(10,9)のみ (帯外)\nexecuteMove({cells:[{x:0,y:0}]},1); // 1手目: 新月 → 帯内の白は取り残される\nassert('夜の帯の石は取れない', board[2*B+2]===2);\nexecuteMove({cells:[{x:10,y:9}]},1); // 2手目: 帯外を取る\nassert('夜の外の石は取れる', board[9*B+9]===0 && captures[1]===1);\nhistory.length=14;\nexecuteMove({cells:[{x:0,y:1}]},1); // 15手目: 満月 → 帯消滅で(2,2)も取れる\nassert('満月で夜が消える', board[2*B+2]===0 && captures[1]===2);",
};
