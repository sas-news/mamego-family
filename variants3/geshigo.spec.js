// Geshi-Go — 夏至碁: 太陽が8方位を3手ごとに巡り、自石の影に入った敵石は取れない。影の長さは季節で1〜3に変化
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
    file: 'geshigo.html',
    en: "Geshi-Go",
    jp: "夏至碁",
    prefix: "geshigo",
    desc: "3手ごとに太陽が8方位を巡り、影が伸びる。影に入った敵石は取れない。",
    kind: 'stone',
    icon: "geshigo",
    spec: [
        ...K.rb("Geshi-Go", "夏至碁", "geshigo"),
        K.params([
            { key: 'sun_interval', label: '太陽の移動間隔', min: 1, max: 12, def: 3, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 夏至碁: 太陽が8方位を巡り、影の向きと長さが変わる。影の敵石は取れない\n            const DIRS = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];\n            const sun = Math.floor(history.length / Math.max(1, P('sun_interval') || 3)) % 8;\n            const d = DIRS[(sun + 4) % 8]; // 影は太陽の反対側に伸びる\n            const L = 1 + Math.round(Math.min(sun, 8 - sun) / 2); // 冬至で3・夏至で1\n            const shaded = (i) => {\n                const ix = i % BOARD_SIZE, iy = Math.floor(i / BOARD_SIZE);\n                for (let s = 0; s < board.length; s++) {\n                    if (board[s] !== player) continue;\n                    const dx = ix - (s % BOARD_SIZE), dy = iy - Math.floor(s / BOARD_SIZE);\n                    for (let k = 1; k <= L; k++) if (dx === d[0] * k && dy === d[1] * k) return true;\n                }\n                return false;\n            };\n            const captured = getCapturedStones(board, opponent).filter(i => !shaded(i));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        ...K.EVENT_CHIP_SPEC("'影 ' + (1 + Math.round(Math.min(Math.floor(history.length / Math.max(1, P('sun_interval') || 3)) % 8, 8 - Math.floor(history.length / Math.max(1, P('sun_interval') || 3)) % 8) / 2)) + ' ' + '↑↗→↘↓↙←↖'.charAt(Math.floor(history.length / Math.max(1, P('sun_interval') || 3)) % 8)"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "太陽が3手ごとに8方位を巡り、自石の反対方向に影が伸びる。影の長さは季節 (周期位置) で1〜3マスに変化する。敵石が自分の石の影に入っている間は取られない。影で包囲網を崩せ。"],
        [K.ONE, K.RV_BASE, K.rv(["自石の影の向き・長さで敵石が取れなくなる",
            "太陽は3手ごとに45°ずつ巡り、影長は1〜3で変化",
            "影を意識して石を置き、包囲のタイミングを外させよ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 下端(9,12)の白を黒3個で包囲 (呼吸点なし = 死に体)\nboard[12*B+9]=2; board[12*B+8]=1; board[12*B+10]=1; board[11*B+9]=1;\nexecuteMove({cells:[{x:0,y:0}]},1); // 1手目: 太陽=北 → 影は南向き。黒(9,11)の影が(9,12)を覆う\nassert('影の敵石は取れない', board[12*B+9]===2 && captures[1]===0);\nhistory.length=11;\nexecuteMove({cells:[{x:1,y:0}]},1); // 12手目: 太陽=南 → 影は北向き。下端は影なし\nassert('影が外れれば取れる', board[12*B+9]===0 && captures[1]===1);\nassert('起動して通常着手可', isValidPlacement([{x:6,y:6}],2)===true);",
};
