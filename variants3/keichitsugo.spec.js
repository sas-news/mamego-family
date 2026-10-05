// Keichitsu-Go — 啓蟄碁: 冬の一手は冬眠石として伏せられる。啓蟄(16手周期)に目覚めて持ち主の色に戻る
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'keichitsugo.html',
    en: "Keichitsu-Go",
    jp: "啓蟄碁",
    prefix: "keichitsugo",
    desc: "周期の最後3手は着手が冬眠石になり、啓蟄の境界で一斉に目覚める。",
    kind: 'stone',
    icon: "keichitsugo",
    spec: [
        ...K.rb("Keichitsu-Go", "啓蟄碁", "keichitsugo"),
        K.params([
            { key: 'kei_period', label: '啓蟄の周期', min: 6, max: 30, def: 16, unit: '手' },
            { key: 'winter_len', label: '冬期の長さ', min: 1, max: 8, def: 3, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...PERSIST("{ dorm: {} }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 啓蟄碁: 周期の13-15手目 (冬期) の着手は冬眠石として伏せる\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            const __per = Math.max(1, P('kei_period') || 16);\n            const __wl = Math.min(__per - 1, Math.max(1, P('winter_len') || 3));\n            const winter = (history.length % __per) >= __per - __wl;\n            if (winter) {\n                board[mi] = 4;\n                st.dorm[mi] = player;\n                fxGlow(mi, '#a5b4fc', 700);\n                fxText(mi, '冬眠', '#a5b4fc', 900);\n                soundManager.playPlace();\n            } else {\n                const captured = getCapturedStones(board, opponent);\n                if (captured.length > 0) {\n                    captured.forEach(idx => board[idx] = 0);\n                    captures[player] += captured.length;\n                    soundManager.playCapture();\n                    cleanUpPieces();\n                } else {\n                    soundManager.playPlace();\n                }\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 啓蟄: 16手周期の境界で冬眠石が一斉に目覚める\n            if (history.length % Math.max(1, P('kei_period') || 16) === 0 && st.dorm) {\n                Object.keys(st.dorm).forEach(k => {\n                    const i = +k;\n                    if (board[i] === 4) {\n                        board[i] = st.dorm[k];\n                        fxGlow(i, '#4ade80', 800);\n                        fxBurst(i, '#86efac', 6, 1.0);\n                    }\n                    delete st.dorm[k];\n                });\n                cleanUpPieces();\n            }\n\n            turn = opponent;"],
        [K.ONE, K.FX_BOOT, K.FX_BOOT + "\n        // 冬眠石: 土の中に半分埋まった持ち主色の石\n        obstaclePainter = (val, cx, cy, cs, idx) => {\n            if (val !== 4) return false;\n            const own = st.dorm ? st.dorm[idx] : 0;\n            ctx.save();\n            ctx.fillStyle = 'rgba(110,80,50,0.6)';\n            ctx.beginPath(); ctx.arc(cx, cy + cs * 0.12, cs * 0.4, Math.PI, 0); ctx.fill();\n            ctx.fillStyle = own === 1 ? currentTheme.p1Fill : own === 2 ? currentTheme.p2Fill : '#9a8f7a';\n            ctx.beginPath(); ctx.arc(cx, cy + cs * 0.14, cs * 0.22, 0, Math.PI * 2); ctx.fill();\n            ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = Math.max(1, cs * 0.05); ctx.stroke();\n            ctx.restore();\n            return true;\n        };"],
        ...K.EVENT_CHIP_SPEC("'啓蟄まで' + (Math.max(1, P('kei_period') || 16) - history.length % Math.max(1, P('kei_period') || 16)) + '手' + ((history.length % Math.max(1, P('kei_period') || 16)) >= Math.max(1, P('kei_period') || 16) - Math.min(Math.max(1, P('kei_period') || 16) - 1, Math.max(1, P('winter_len') || 3)) ? ' 冬期' : '')"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "16手を一周期とし、13〜15手目は冬期。この間の着手は石が伏せられて冬眠する (盤面には伏せ石として残るが、取り・呼吸には関与しない)。周期の頭 (16手目) の啓蟄に全ての伏せ石が持ち主の色で目覚める。"],
        [K.ONE, K.RV_BASE, K.rv(["周期の最後3手で置く石は冬眠して無力化される",
            "周期頭に全ての冬眠石が持ち主の石として目覚める",
            "冬眠石の場所は取り合いに使えない。目覚めのタイミングを狙え"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.dorm={};\nhistory.length=12; // 次着手=13手目 → 冬期\nexecuteMove({cells:[{x:4,y:4}]},1);\nassert('冬期の着手は冬眠石', board[4*BOARD_SIZE+4]===4 && st.dorm[4*BOARD_SIZE+4]===1);\nhistory.length=15;\nexecuteMove({cells:[{x:8,y:8}]},2); // 16手目 → 啓蟄で目覚め\nassert('啓蟄に冬眠石が目覚める', board[4*BOARD_SIZE+4]===1 && !st.dorm[4*BOARD_SIZE+4]);\nassert('起動して通常着手可', isValidPlacement([{x:0,y:0}],1)===true);",
};
