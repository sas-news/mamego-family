// Byakuya-Go — 白夜碁: 上3行は常夜。だが20手周期の10-15手目は白夜で夜が消え、全部位が通常になる
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
    file: 'byakuyago.html',
    en: "Byakuya-Go",
    jp: "白夜碁",
    prefix: "byakuyago",
    desc: "常夜の上3行は取れないが、周期の白夜窓 (10-15手目) は夜が消えて全て取れる。",
    kind: 'stone',
    icon: "byakuyago",
    spec: [
        ...K.rb("Byakuya-Go", "白夜碁", "byakuyago"),
        K.params([
            { key: 'night_rows', label: '常夜の行数', min: 1, max: 8, def: 3, unit: '行' },
            { key: 'wn_period', label: '白夜の周期', min: 10, max: 40, def: 20, unit: '手' },
            { key: 'wn_start', label: '白夜窓の開始', min: 2, max: 30, def: 10 },
            { key: 'wn_end', label: '白夜窓の終了', min: 3, max: 35, def: 15 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 白夜碁: 上3行は常夜 (取れない)。白夜窓 (周期10-15手目) は夜が消える\n            const wn = (history.length % (P('wn_period') || 20)) >= (P('wn_start') || 10) && (history.length % (P('wn_period') || 20)) <= (P('wn_end') || 15);\n            const captured = getCapturedStones(board, opponent).filter(i => wn || Math.floor(i / BOARD_SIZE) >= (P('night_rows') || 3));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        K.CUE_GRID("            // 常夜の帯 (白夜中は消える)\n            if (!((history.length % (P('wn_period') || 20)) >= (P('wn_start') || 10) && (history.length % (P('wn_period') || 20)) <= (P('wn_end') || 15))) {\n                ctx.save();\n                ctx.fillStyle = 'rgba(30,27,75,0.45)';\n                ctx.fillRect(padding - cellSize / 2, padding - cellSize / 2, BOARD_SIZE * cellSize, (P('night_rows') || 3) * cellSize);\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("(history.length % (P('wn_period') || 20)) >= (P('wn_start') || 10) && (history.length % (P('wn_period') || 20)) <= (P('wn_end') || 15) ? '白夜!' : '白夜まで' + ((((P('wn_start') || 10) - history.length % (P('wn_period') || 20)) + (P('wn_period') || 20)) % (P('wn_period') || 20)) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "上3行は常夜で石が取れない。しかし20手周期の10〜15手目は白夜 — 太陽が沈まず夜の帯が消え、全ての石が通常通り取れる。夜の攻め時は白夜の6手間だけ。"],
        [K.ONE, K.RV_ALGO, K.rv(["上3行は常夜で取れない",
            "白夜窓 (周期10-15手目) だけ夜の帯が消えて取れる",
            "上辺の拠点は白夜まで不沈 — 攻めは窓を狙え"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[1*B+5]=2; board[1*B+4]=1; board[0*B+5]=1; board[1*B+6]=1; // 白(5,1) 呼吸は(5,2)のみ — 常夜の帯内\nboard[8*B+8]=2; board[8*B+7]=1; board[7*B+8]=1; board[9*B+8]=1; // 白(8,8) 呼吸は(8,9)のみ — 帯の外\nhistory.length=7;\nexecuteMove({cells:[{x:5,y:2}]},1); // 8手目: 白夜前 → 帯内の白は取れない\nassert('常夜の帯の石は取れない', board[1*B+5]===2);\nexecuteMove({cells:[{x:9,y:8}]},1); // 9手目: まだ夜 → 帯外のみ取れる\nassert('帯の外の石は取れる', board[8*B+8]===0 && captures[1]===1);\nexecuteMove({cells:[{x:0,y:0}]},1); // 10手目: 白夜突入 → 帯内の死に体も取れる\nassert('白夜で帯の石も取れる', board[1*B+5]===0 && captures[1]===2);",
};
