// Kokuu-Go — 穀雨碁: 24手ごとの雨で、2石以下の小さな連が1石ずつ育つ。育った石は即座に呼吸を持つ
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'kokuugo.html',
    en: "Kokuu-Go",
    jp: "穀雨碁",
    prefix: "kokuugo",
    desc: "24手ごとの雨で双方の小さな連 (2石以下) が1石ずつ育つ。",
    kind: 'stone',
    icon: "kokuugo",
    spec: [
        ...K.rb("Kokuu-Go", "穀雨碁", "kokuugo"),
        K.params([
            { key: 'rain_interval', label: '雨が降る間隔', min: 6, max: 60, def: 24, unit: '手' },
            { key: 'sprout_max', label: '芽が出る連の最大石数', min: 1, max: 6, def: 2, unit: '石' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 穀雨: N手ごとの雨で小さな連が育つ\n            if (history.length % Math.max(1, P('rain_interval') || 24) === 0) {\n                [1, 2].forEach(pl => {\n                    vChains(board, pl).forEach(g => {\n                        if (g.length > (P('sprout_max') || 2)) return;\n                        let spot = -1;\n                        for (const ci of g) {\n                            for (const n of getNeighbors(ci)) if (board[n] === 0) { spot = n; break; }\n                            if (spot >= 0) break;\n                        }\n                        if (spot >= 0) {\n                            board[spot] = pl;\n                            fxGlow(spot, '#4ade80', 800);\n                            fxText(spot, '芽', '#22c55e', 900);\n                        }\n                    });\n                });\n                // 育って窒息した連を掃除 (双方)\n                [1, 2].forEach(pl => {\n                    const dead = getCapturedStones(board, pl);\n                    if (dead.length) { dead.forEach(i => board[i] = 0); captures[3 - pl] += dead.length; }\n                });\n                cleanUpPieces();\n                fxShake(3, 300);\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("'穀雨まで' + (Math.max(1, P('rain_interval') || 24) - history.length % Math.max(1, P('rain_interval') || 24)) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "24手ごとに慈雨が降る。雨の時、2石以下の小さな連は空いている隣に1石ずつ芽が出る (双方同時)。育ちすぎて窒息した連は取られる。小さい連ほど雨の恩恵を受けやすい。"],
        [K.ONE, K.RV_ALGO, K.rv(["24手ごとに雨が降り、2石以下の連が1石育つ",
            "育つ方向は空きマスの最初の一つ。増えすぎて窒息した連は取られる",
            "大連を作ると雨の恩恵を失うので小分けに戦え"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=1; // 黒の苗 (単石)\nboard[9*B+9]=2; board[9*B+10]=2; board[9*B+11]=2; // 白の3連 (対象外)\nhistory.length=23;\nexecuteMove({cells:[{x:0,y:0}]},2); // 24手目 → 穀雨\nassert('苗が育つ', board[4*B+3]===1 || board[4*B+5]===1 || board[3*B+4]===1 || board[5*B+4]===1);\nassert('大きな連は育たない', board[9*B+12]===0);\nassert('起動して通常着手可', isValidPlacement([{x:1,y:1}],1)===true);",
};
