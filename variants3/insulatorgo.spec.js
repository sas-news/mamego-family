// Insulator-Go — 絶縁碁: 孤立して置いた石は絶縁体となり8手の間絶対に取れない。回路を分断する盾
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
    file: 'insulatorgo.html',
    en: "Insulator-Go",
    jp: "絶縁碁",
    prefix: "insulatorgo",
    desc: "同色に隣接しない孤立着手は絶縁体となり8手間取れない。",
    kind: 'stone',
    icon: "insulatorgo",
    spec: [
        ...K.rb("Insulator-Go", "絶縁碁", "insulatorgo"),
        ...PERSIST("{ iso: {} }"),
        [K.ONE, '            if (getCapturedStones(after, player).length > 0) return false;',
            "            // 変則: 取り残された死に連が残り得るため、着手した石の連だけを窒息判定する\n            const placedSuicide = cells.some(p => {\n                const pi = p.y * BOARD_SIZE + p.x;\n                const seen = new Set([pi]), q = [pi];\n                while (q.length) {\n                    const cur = q.pop();\n                    for (const n of getNeighbors(cur)) if (after[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }\n                }\n                return getCapturedStones(after, player).some(d => seen.has(d));\n            });\n            if (placedSuicide) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // 絶縁碁: 絶縁体の敵石は取れない\n            const captured = getCapturedStones(board, opponent).filter(i => !(st.iso[i] && st.iso[i] > history.length));\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 絶縁: 孤立で置いた石は絶縁体となり8手の間取れない\n            {\n                Object.keys(st.iso).forEach(k => { if (st.iso[k] <= history.length) delete st.iso[k]; });\n                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n                const alone = getNeighbors(mi).every(n => board[n] !== player);\n                if (board[mi] === player && alone) {\n                    st.iso[mi] = history.length + 8;\n                    fxGlow(mi, '#e2e8f0', 800);\n                }\n            }\n\n            turn = opponent;"],
        ...K.STONE_MARKS_SPEC("            // 絶縁石: 白い陶器の輪\n            {\n                ctx.save();\n                Object.keys(st.iso).forEach(k => {\n                    const i = +k;\n                    if (board[i] !== 1 && board[i] !== 2) return;\n                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;\n                    ctx.strokeStyle = 'rgba(226,232,240,0.9)';\n                    ctx.lineWidth = Math.max(1.5, cellSize * 0.08);\n                    ctx.beginPath();\n                    ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);\n                    ctx.stroke();\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'絶縁体 ' + (st.iso ? Object.keys(st.iso).length : 0) + '個'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "同色石に隣接しない孤立した着手は絶縁体となる。絶縁体は8手の間、包囲されても絶対に取られない。敵陣に深く打ち込む楔として使えるが、孤立は隙を晒す。"],
        [K.ONE, K.RV_ALGO, K.rv(["孤立着手は絶縁体となり8手間取れない",
            "連に繋げた石は絶縁にならない",
            "絶縁体を楔に敵陣を分断せよ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.iso={};\nconst B=BOARD_SIZE;\nexecuteMove({cells:[{x:4,y:4}]},1); // 孤立黒 → 絶縁\nassert('孤立石は絶縁体', st.iso[4*B+4]===history.length+8);\nboard[4*B+3]=2; board[3*B+4]=2; board[5*B+4]=2; // 白で三方囲み\nexecuteMove({cells:[{x:5,y:4}]},2); // 白が最後の呼吸点を埋める\nassert('絶縁体は取れない', board[4*B+4]===1 && captures[2]===0);\nst.iso={}; // 絶縁切れ\nexecuteMove({cells:[{x:0,y:0}]},2);\nassert('絶縁切れ後は取れる', board[4*B+4]===0 && captures[2]===1);",
};
