// Hakubo-Go — 薄暮碁: 16手周期の最後4手は薄暮。着手した石の持ち主が見分けにくくなり、夜明けに正体を現す
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
    file: 'hakubogo.html',
    en: "Hakubo-Go",
    jp: "薄暮碁",
    prefix: "hakubogo",
    desc: "周期の最後4手は薄暮。その間の着手は「紛れ石」となり、夜明けに持ち主の色に戻る。",
    kind: 'stone',
    icon: "hakubogo",
    spec: [
        ...K.rb("Hakubo-Go", "薄暮碁", "hakubogo"),
        ...PERSIST("{ dorm: {} }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 薄暮碁: 周期の12-15手目は薄暮。着手は紛れ石 (持ち主不明) になる\n            const dusk = (history.length % 16) >= 12;\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            if (dusk) {\n                board[mi] = 4;\n                st.dorm[mi] = player;\n                fxGlow(mi, '#c4b5fd', 700);\n                fxText(mi, '紛れ', '#a78bfa', 900);\n                soundManager.playPlace();\n            } else {\n                const captured = getCapturedStones(board, opponent);\n                if (captured.length > 0) {\n                    captured.forEach(idx => board[idx] = 0);\n                    captures[player] += captured.length;\n                    soundManager.playCapture();\n                    cleanUpPieces();\n                } else {\n                    soundManager.playPlace();\n                }\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 夜明け: 周期頭で紛れ石の持ち主が明らかになる\n            if (history.length % 16 === 0 && st.dorm) {\n                Object.keys(st.dorm).forEach(k => {\n                    const i = +k;\n                    if (board[i] === 4) { board[i] = st.dorm[k]; fxGlow(i, '#fbbf24', 700); }\n                    delete st.dorm[k];\n                });\n                cleanUpPieces();\n            }\n\n            turn = opponent;"],
        [K.ONE, K.FX_BOOT, K.FX_BOOT + "\n        // 紛れ石: 薄暮に霞む持ち主不明の石\n        obstaclePainter = (val, cx, cy, cs, idx) => {\n            if (val !== 4) return false;\n            const own = st.dorm ? st.dorm[idx] : 0;\n            ctx.save();\n            ctx.globalAlpha = 0.55;\n            ctx.fillStyle = own === 1 ? currentTheme.p1Fill : own === 2 ? currentTheme.p2Fill : '#9ca3af';\n            ctx.beginPath(); ctx.arc(cx, cy, cs * 0.34, 0, Math.PI * 2); ctx.fill();\n            ctx.globalAlpha = 0.8;\n            ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = Math.max(1, cs * 0.05);\n            ctx.setLineDash([cs * 0.12, cs * 0.08]);\n            ctx.beginPath(); ctx.arc(cx, cy, cs * 0.40, 0, Math.PI * 2); ctx.stroke();\n            ctx.restore();\n            return true;\n        };"],
        ...K.EVENT_CHIP_SPEC("(history.length % 16) >= 12 ? '薄暮' : '薄暮まで' + (16 - history.length % 16) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "16手周期の12〜15手目は薄暮。この間の着手は持ち主が見分けにくい「紛れ石」となり、取りにも呼吸にも効かない。周期頭の夜明けに正体を現す。"],
        [K.ONE, K.RV_ALGO, K.rv(["薄暮期 (12-15手目) の着手は持ち主不明の紛れ石",
            "周期頭の夜明けに持ち主の色で現れる",
            "薄暮に置いた石は奇襲の布石になる"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.dorm={};\nhistory.length=11; // 次着手=12手目 → 薄暮\nexecuteMove({cells:[{x:4,y:4}]},1);\nassert('薄暮の着手は紛れ石', board[4*BOARD_SIZE+4]===4 && st.dorm[4*BOARD_SIZE+4]===1);\nhistory.length=15;\nexecuteMove({cells:[{x:8,y:8}]},2); // 16手目 → 夜明けで正体を現す\nassert('夜明けに持ち主が判明', board[4*BOARD_SIZE+4]===1 && !st.dorm[4*BOARD_SIZE+4]);\nassert('起動して通常着手可', isValidPlacement([{x:0,y:0}],1)===true);",
};
