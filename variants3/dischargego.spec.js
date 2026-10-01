// Discharge-Go — 放電碁: 14手ごとに稲妻が落ち、盤上で最も呼吸の少ない連が打ち抜かれる
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
    file: 'dischargego.html',
    en: "Discharge-Go",
    jp: "放電碁",
    prefix: "dischargego",
    desc: "14手ごとの雷で、盤上で最も呼吸の少ない連が全滅して相手のアゲハマになる。",
    kind: 'stone',
    icon: "dischargego",
    spec: [
        ...K.rb("Discharge-Go", "放電碁", "dischargego"),
        K.params([
            { key: 'bolt_interval', label: '雷の間隔', min: 4, max: 40, def: 14, unit: '手' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 放電: 14手ごとに稲妻が盤上で最も呼吸の少ない連を打ち抜く\n            if (history.length % Math.max(1, P('bolt_interval') || 14) === 0) {\n                let weak = null, weakLibs = 1e9;\n                [1, 2].forEach(pl => {\n                    vChains(board, pl).forEach(g => {\n                        const l = getLiberties(board, g[0]);\n                        if (l < weakLibs) { weakLibs = l; weak = g; }\n                    });\n                });\n                if (weak) {\n                    weak.forEach(i => {\n                        fxBurst(i, '#facc15', 10, 1.6);\n                        captures[3 - board[i]]++;\n                        board[i] = 0;\n                    });\n                    fxShake(7, 380);\n                    fxText(weak[0], '放電!', '#facc15', 1100);\n                    cleanUpPieces();\n                }\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("'雷まで' + ((P('bolt_interval') || 14) - history.length % (P('bolt_interval') || 14)) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "14手ごとに稲妻が落ちる。稲妻は盤上で最も呼吸の少ない連 (色問わず) を一つ選んで打ち抜き、相手のアゲハマにする。ギリギリの連は雷の餌食。"],
        [K.ONE, K.RV_ALGO, K.rv(["14手ごとに最も呼吸の少ない連が全滅する",
            "色問わず最弱が狙われる — 自分の連も危ない",
            "呼吸2以上に保って雷を避けろ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=1; board[4*B+3]=2; board[3*B+4]=2; board[5*B+4]=2; // 黒(4,4) 呼吸は(4,5)のみ\nboard[9*B+9]=2; board[9*B+10]=2; // 白連は呼吸多数\nhistory.length=13;\nexecuteMove({cells:[{x:0,y:0}]},2); // 14手目 → 放電\nassert('最弱の連が打ち抜かれる', board[4*B+4]===0);\nassert('打ち抜きは相手のアゲハマ', captures[2]===1);\nassert('他の連は無事', board[9*B+9]===2 && board[9*B+10]===2);",
};
