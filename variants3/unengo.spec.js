// Un-Go — 暈碁: 18手周期の15手目に月の暈が出る。3手後に嵐が来て呼吸1以下の脆い連が洗い流される
const K = require('../gen_kit.js');
const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

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
    file: 'unengo.html',
    en: "Un-Go",
    jp: "暈碁",
    prefix: "unengo",
    desc: "18手周期で暈が出て3手後に嵐。嵐は呼吸1以下の連を全て洗い流す。",
    kind: 'stone',
    icon: "unengo",
    spec: [
        ...K.rb("Un-Go", "暈碁", "unengo"),
        ...PERSIST("{ rain: 0 }"),
        [K.ONE, K.NBRS_GRID, K.NBRS_GRID + "\n\n        // 指定色の全連を返す\n        function vChains(b, p) {\n            const seen = new Uint8Array(b.length), out = [];\n            for (let i = 0; i < b.length; i++) {\n                if (b[i] !== p || seen[i]) continue;\n                const g = [], q = [i]; seen[i] = 1;\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (b[n] === p && !seen[n]) { seen[n] = 1; q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }\n        // 取りリストを連結成分に分割する\n        function vGroups(cells) {\n            const set = new Set(cells), out = [];\n            for (const s of cells) {\n                if (!set.has(s)) continue;\n                const g = [], q = [s]; set.delete(s);\n                while (q.length) {\n                    const cur = q.pop(); g.push(cur);\n                    getNeighbors(cur).forEach(n => { if (set.has(n)) { set.delete(n); q.push(n); } });\n                }\n                out.push(g);\n            }\n            return out;\n        }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 暈: 18手周期の15手目に月の暈が出て3手後に嵐が来る\n            if (history.length % 18 === 15) {\n                st.rain = history.length + 3;\n                const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);\n                fxText(cc, '暈…', '#93c5fd', 1200);\n            }\n            if (st.rain && history.length >= st.rain) {\n                st.rain = 0;\n                // 嵐: 呼吸1以下の脆い連が双方から洗い流される\n                const swept = [];\n                [1, 2].forEach(pl => {\n                    vChains(board, pl).forEach(g => {\n                        if (getLiberties(board, g[0]) <= 1) g.forEach(i => swept.push(i));\n                    });\n                });\n                if (swept.length) {\n                    swept.forEach(i => {\n                        fxBurst(i, '#60a5fa', 8, 1.2);\n                        captures[3 - board[i]]++;\n                        board[i] = 0;\n                    });\n                    cleanUpPieces();\n                    fxShake(6, 420);\n                }\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("st.rain ? '嵐まで' + (st.rain - history.length) + '手' : '暈まで' + ((15 - history.length % 18 + 18) % 18) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "18手周期の15手目に月に暈がかかる — 雨の前兆。3手後に嵐が来て、呼吸1以下の脆い連が双方から洗い流されて相手のアゲハマになる。暈が出たら守りを固めよ。"],
        [K.ONE, K.RV_ALGO, K.rv(["18手周期で暈が出て3手後に嵐が来る",
            "嵐は呼吸1以下の連を全て取り上げる",
            "危ない連は暈のうちに呼吸を増やせ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.rain=0;\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; board[4*B+3]=1; board[3*B+4]=1; board[5*B+4]=1; // 白(4,4) 呼吸は(4,5)のみ\nhistory.length=13;\nexecuteMove({cells:[{x:0,y:0}]},1); // 14手目 → 何事もなし\nassert('嵐前は生存', board[4*B+4]===2);\nhistory.length=14;\nexecuteMove({cells:[{x:1,y:0}]},1); // 15手目 → 暈\nassert('暈で雨を予報', st.rain===18);\nhistory.length=17;\nexecuteMove({cells:[{x:2,y:0}]},1); // 18手目 → 嵐\nassert('嵐で弱い連が流される', board[4*B+4]===0 && captures[1]===1);",
};
