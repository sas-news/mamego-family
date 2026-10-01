// Divider-Go — 分圧碁: 複数の連を同時に取ると力が集中して2倍。5石以上の長連への力は分散して減る
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'dividergo.html',
    en: "Divider-Go",
    jp: "分圧碁",
    prefix: "dividergo",
    desc: "一手で2連以上取ると取り2倍。5石以上の連を取ると取りが減る。",
    kind: 'stone',
    icon: "dividergo",
    spec: [
        ...K.rb("Divider-Go", "分圧碁", "dividergo"),
        K.params([
            { key: 'multi_n', label: '並列集中の倍率', min: 1, max: 4, def: 2, unit: '倍' },
            { key: 'long_min', label: '直列とみなす連の長さ', min: 3, max: 10, def: 5, unit: '個' },
            { key: 'long_disc', label: '直列の減算', min: 0, max: 5, def: 2, unit: '個' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 分圧碁: 並列 (複数連同時) は集中2倍、直列 (長連) は分散で減る\n            const captured0 = getCapturedStones(board, opponent);\n            const groups = vGroups(captured0);\n            let yieldN = captured0.length;\n            if (groups.length >= 2) {\n                yieldN = captured0.length * (P('multi_n') || 2); // 並列集中\n            } else if (groups.length === 1 && groups[0].length >= (P('long_min') || 5)) {\n                yieldN = Math.max(1, groups[0].length - (P('long_disc') ?? 2)); // 直列分散\n            }\n            const captured = captured0;\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += yieldN;\n                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n                if (groups.length >= 2) fxText(ci, '並列x' + (P('multi_n') || 2) + '!', '#38bdf8', 1000);\n                else if (groups.length === 1 && groups[0].length >= (P('long_min') || 5)) fxText(ci, '分圧', '#94a3b8', 900);\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        ...K.EVENT_CHIP_SPEC("'分圧: 同時取りx2・長連取り割引'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "電圧は分かれる。一手で複数の連を同時に断つと力が集中し、取り上げは2倍のアゲハマ。逆に5石以上の長い連への力は分散し、取り上げは石数-2に目減りする。"],
        [K.ONE, K.RV_ALGO, K.rv(["一手で2連以上取るとアゲハマ2倍",
            "5石以上の連を取るとアゲハマが石数-2に減る",
            "敵の複数連を同時に断つのが大技"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\n// 白(4,4)と白(5,5) — 共に呼吸は(4,5)のみ (別々の連)\nboard[4*B+4]=2; board[5*B+5]=2;\nboard[4*B+3]=1; board[3*B+4]=1; board[4*B+5]=1;\nboard[5*B+6]=1; board[6*B+5]=1;\nexecuteMove({cells:[{x:4,y:5}]},1); // 共通の呼吸点を埋めて2連同時取り\nassert('並列同時取りは2倍', captures[1]===4 && board[4*B+4]===0 && board[5*B+5]===0);\nboard.fill(0); captures={1:0,2:0};\n[4,5,6,7,8].forEach(y => { board[y*B+4]=2; board[y*B+3]=1; board[y*B+5]=1; });\nboard[3*B+4]=1; board[9*B+4]=1; // 白の5連を全包囲\nexecuteMove({cells:[{x:0,y:0}]},1);\nassert('長連は分圧で減る', captures[1]===3 && board[4*B+4]===0);",
};
