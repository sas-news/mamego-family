// Arc Iris-Go — 虹弧碁: 左右の端を結ぶ7石以上の連 (虹の橋) を架けた側が即座に勝つ
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
    file: 'arcirisgo.html',
    en: "Arc Iris-Go",
    jp: "虹弧碁",
    prefix: "arcirisgo",
    desc: "左右両端に届く7石以上の連を架けると虹の橋が完成し即勝ち。",
    kind: 'stone',
    icon: "arcirisgo",
    spec: [
        ...K.rb("Arc Iris-Go", "虹弧碁", "arcirisgo"),
        K.params([
            { key: 'rainbow_min', label: '虹橋の最小連数', min: 3, max: 13, def: 7, unit: '石' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + '\n        function endGameByScore() {'],
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 虹弧: 左右両端に届く7石以上の連を架けた側が即勝ち\n            {\n                const win = vChains(board, player).some(g =>\n                    g.length >= (P('rainbow_min') || 7) &&\n                    g.some(i => i % BOARD_SIZE === 0) &&\n                    g.some(i => i % BOARD_SIZE === BOARD_SIZE - 1));\n                if (win) {\n                    const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);\n                    fxText(cc, '虹橋!', '#f472b6', 1500);\n                    fxShake(6, 400);\n                    winByRule(player, '虹橋架け', '左右の端を結ぶ虹の連を完成させました');\n                    return;\n                }\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("'虹: 左右端を結ぶ7連で即勝ち'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "通常の囲碁に加え、左右両端に届く7石以上の連を架けると虹の橋が完成して即勝ち。相手の橋を断つのが最優先。"],
        [K.ONE, K.RV_BASE, K.rv(["左右両端に届く7石以上の連で即勝ち",
            "相手の橋を断つのが最優先",
            "端と端を狙い、中央の取り合いは手段に過ぎない"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; gameOver=false;\nconst B=BOARD_SIZE;\nfor(let x=0;x<=10;x++) board[6*B+x]=1; // 左端からx=10まで (右端に未達)\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('未達の連では勝たない', gameOver===false);\nboard[6*B+11]=1; board[6*B+12]=1; // 右端まで繋げる\nexecuteMove({cells:[{x:1,y:0}]},1);\nassert('虹の連で即勝ち', gameOver===true);\nassert('結果に虹', !!gameResultData && JSON.stringify(gameResultData).indexOf('虹')>=0);",
};
