// Daikan-Go — 大寒碁: 24手周期の最後4手は大寒期。着手した石が凍り、周期頭で融けて持ち主の色に戻る
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
    file: 'daikango.html',
    en: "Daikan-Go",
    jp: "大寒碁",
    prefix: "daikango",
    desc: "周期の最後4手は大寒期。その間の着手は凍結石となり、周期頭に融ける。",
    kind: 'stone',
    icon: "daikango",
    spec: [
        ...K.rb("Daikan-Go", "大寒碁", "daikango"),
        ...PERSIST("{ dorm: {} }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 大寒碁: 周期の20-23手目は大寒期。着手が凍結石になる\n            const freeze = (history.length % 24) >= 20;\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            if (freeze) {\n                board[mi] = 4;\n                st.dorm[mi] = player;\n                fxGlow(mi, '#7dd3fc', 800);\n                fxText(mi, '氷', '#38bdf8', 900);\n                soundManager.playPlace();\n            } else {\n                const captured = getCapturedStones(board, opponent);\n                if (captured.length > 0) {\n                    captured.forEach(idx => board[idx] = 0);\n                    captures[player] += captured.length;\n                    soundManager.playCapture();\n                    cleanUpPieces();\n                } else {\n                    soundManager.playPlace();\n                }\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 大寒明け: 周期頭で凍った石が融けて持ち主の色に戻る\n            if (history.length % 24 === 0 && st.dorm) {\n                Object.keys(st.dorm).forEach(k => {\n                    const i = +k;\n                    if (board[i] === 4) { board[i] = st.dorm[k]; fxGlow(i, '#fde68a', 700); }\n                    delete st.dorm[k];\n                });\n                cleanUpPieces();\n            }\n\n            turn = opponent;"],
        [K.ONE, K.FX_BOOT, K.FX_BOOT + "\n        // 凍結石: 氷の塊の中の石\n        obstaclePainter = (val, cx, cy, cs, idx) => {\n            if (val !== 4) return false;\n            const own = st.dorm ? st.dorm[idx] : 0;\n            ctx.save();\n            ctx.fillStyle = 'rgba(186,230,253,0.55)';\n            ctx.fillRect(cx - cs * 0.38, cy - cs * 0.38, cs * 0.76, cs * 0.76);\n            ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = Math.max(1, cs * 0.06);\n            ctx.strokeRect(cx - cs * 0.38, cy - cs * 0.38, cs * 0.76, cs * 0.76);\n            ctx.fillStyle = own === 1 ? currentTheme.p1Fill : own === 2 ? currentTheme.p2Fill : '#94a3b8';\n            ctx.beginPath(); ctx.arc(cx, cy, cs * 0.20, 0, Math.PI * 2); ctx.fill();\n            ctx.restore();\n            return true;\n        };"],
        ...K.EVENT_CHIP_SPEC("'大寒まで' + (24 - history.length % 24) + '手' + ((history.length % 24) >= 20 ? ' 凍結期' : '')"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "24手周期の20〜23手目は大寒期。この間の着手は石が凍って無色の氷塊になる。周期の頭で氷が融け、持ち主の色で現れる。凍った石は取りにも呼吸にも効かない。"],
        [K.ONE, K.RV_ALGO, K.rv(["周期の最後4手で置く石は凍結して無力化される",
            "周期頭で凍結石が持ち主の石として融ける",
            "凍結期は布石の準備期間。融けた石で形を作れ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.dorm={};\nhistory.length=19; // 次着手=20手目 → 大寒期\nexecuteMove({cells:[{x:4,y:4}]},1);\nassert('大寒期の着手は凍結', board[4*BOARD_SIZE+4]===4 && st.dorm[4*BOARD_SIZE+4]===1);\nhistory.length=23;\nexecuteMove({cells:[{x:8,y:8}]},2); // 24手目 → 融解\nassert('周期頭で凍結が融ける', board[4*BOARD_SIZE+4]===1 && !st.dorm[4*BOARD_SIZE+4]);\nassert('起動して通常着手可', isValidPlacement([{x:0,y:0}],1)===true);",
};
