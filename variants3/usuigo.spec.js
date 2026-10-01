// Usui-Go — 雨水碁: 9手ごとの雨で土の帯が泥濘になる。泥の上の石は埋まって取れない
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
    file: 'usuigo.html',
    en: "Usui-Go",
    jp: "雨水碁",
    prefix: "usuigo",
    desc: "9手ごとに雨が帯を下ろし、その3行が泥になる。泥の上の石は以後ずっと取れない。",
    kind: 'stone',
    icon: "usuigo",
    spec: [
        ...K.rb("Usui-Go", "雨水碁", "usuigo"),
        ...PERSIST("{ buried: {} }"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 雨水碁: 泥濘の上の石は埋まって取れない\n            const captured = getCapturedStones(board, opponent).filter(i => !(st.buried && st.buried[i]));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 雨水: 9手ごとに雨帯が下り、その3行が泥濘になる (以後ずっと取れない土地)\n            if (history.length % 9 === 0 && st.buried) {\n                const bandTop = (Math.floor(history.length / 9) * 3) % BOARD_SIZE;\n                for (let y = bandTop; y < Math.min(bandTop + 3, BOARD_SIZE); y++) {\n                    for (let x = 0; x < BOARD_SIZE; x++) {\n                        const i = y * BOARD_SIZE + x;\n                        if (!st.buried[i]) {\n                            st.buried[i] = 1;\n                            fxSplash(i, '#a78bfa', 5);\n                        }\n                    }\n                }\n                fxText(Math.min(bandTop + 1, BOARD_SIZE - 1) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '泥濘', '#8b5cf6', 1000);\n            }\n\n            turn = opponent;"],
        K.CUE_GRID("            // 泥濘地を茶色く染める\n            if (typeof st !== 'undefined' && st.buried) {\n                ctx.save();\n                ctx.fillStyle = 'rgba(146,64,14,0.18)';\n                for (let i = 0; i < board.length; i++) {\n                    if (!st.buried[i]) continue;\n                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);\n                }\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'雨まで' + (9 - history.length % 9) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "9手ごとに雨が降り、3行の帯が泥濘になる。泥の上の石は埋まって以後ずっと取られない。帯は下へ巡回する。泥地は取り合いの絶対安全地帯。"],
        [K.ONE, K.RV_ALGO, K.rv(["9手ごとに3行が泥濘になり、そこに置いた石は永続して取れない",
            "泥濘地は以後も泥のまま — 再訪しても安全",
            "泥地に要石を埋めて不沈の拠点を作れ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.buried={};\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; board[4*B+3]=1; board[3*B+4]=1; board[5*B+4]=1;\nst.buried[4*B+4]=1; // (4,4) の土は泥濘\nexecuteMove({cells:[{x:5,y:4}]},1);\nassert('埋まった石は取れない', board[4*B+4]===2 && captures[1]===0);\nboard.fill(0); captures={1:0,2:0}; st.buried={};\nboard[9*B+9]=2; board[9*B+8]=1; board[8*B+9]=1; board[10*B+9]=1; // 呼吸は(10,9)のみ\nexecuteMove({cells:[{x:10,y:9}]},1);\nassert('乾いた石は取れる', board[9*B+9]===0 && captures[1]===1);\nboard.fill(0); st.buried={}; history.length=8;\nexecuteMove({cells:[{x:0,y:0}]},2); // 9手目 → 雨で帯3-5が泥に\nassert('雨で土が泥濘む', st.buried[4*B+4]===1 && st.buried[5*B+12]===1);",
};
