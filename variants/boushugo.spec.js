// Boushu-Go — 芒種碁: 20手周期の5-7手目は種蒔き期。蒔いた種は8手後に芽が出て持ち主の石になる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'boushugo.html',
    en: "Boushu-Go",
    jp: "芒種碁",
    prefix: "boushugo",
    desc: "周期の5〜7手目に置く石は種として埋まり、8手後に芽を出して持ち主の石になる。",
    kind: 'stone',
    icon: "boushugo",
    spec: [
        ...K.rb("Boushu-Go", "芒種碁", "boushugo"),
        K.params([
            { key: 'sow_period', label: '芒種の周期', min: 10, max: 40, def: 20, unit: '手' },
            { key: 'sow_start', label: '蒔き期の開始', min: 1, max: 15, def: 5 },
            { key: 'sow_end', label: '蒔き期の終了', min: 2, max: 15, def: 7 },
            { key: 'sprout_delay', label: '発芽までの手数', min: 4, max: 16, def: 8, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...PERSIST("{ seed: {} }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 芒種碁: 周期の5-7手目は種蒔き期。着手が種として埋まる\n            const sowing = (history.length % (P('sow_period') || 20)) >= (P('sow_start') || 5) && (history.length % (P('sow_period') || 20)) <= (P('sow_end') || 7);\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            if (sowing) {\n                board[mi] = 4;\n                st.seed[mi] = { p: player, at: history.length + (P('sprout_delay') || 8) };\n                fxGlow(mi, '#a3e635', 700);\n                fxText(mi, '種', '#84cc16', 900);\n                soundManager.playPlace();\n            } else {\n                const captured = getCapturedStones(board, opponent);\n                if (captured.length > 0) {\n                    captured.forEach(idx => board[idx] = 0);\n                    captures[player] += captured.length;\n                    soundManager.playCapture();\n                    cleanUpPieces();\n                } else {\n                    soundManager.playPlace();\n                }\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 発芽: 蒔いた種が8手後に芽を出す\n            if (st.seed) {\n                Object.keys(st.seed).forEach(k => {\n                    const sd = st.seed[k], i = +k;\n                    if (history.length >= sd.at) {\n                        if (board[i] === 4) { board[i] = sd.p; fxGlow(i, '#4ade80', 800); fxBurst(i, '#86efac', 6, 1.0); }\n                        delete st.seed[k];\n                    }\n                });\n                cleanUpPieces();\n            }\n\n            turn = opponent;"],
        [K.ONE, K.FX_BOOT, K.FX_BOOT + "\n        // 種: 土に埋まった双葉の種\n        obstaclePainter = (val, cx, cy, cs, idx) => {\n            if (val !== 4) return false;\n            const own = st.seed && st.seed[idx] ? st.seed[idx].p : 0;\n            ctx.save();\n            ctx.fillStyle = 'rgba(110,80,50,0.65)';\n            ctx.beginPath(); ctx.arc(cx, cy + cs * 0.14, cs * 0.34, Math.PI, 0); ctx.fill();\n            ctx.fillStyle = own === 1 ? currentTheme.p1Fill : own === 2 ? currentTheme.p2Fill : '#a3a380';\n            ctx.beginPath(); ctx.arc(cx, cy + cs * 0.10, cs * 0.16, 0, Math.PI * 2); ctx.fill();\n            ctx.strokeStyle = '#65a30d'; ctx.lineWidth = Math.max(1, cs * 0.05);\n            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - cs * 0.10, cy - cs * 0.18); ctx.stroke();\n            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cs * 0.10, cy - cs * 0.18); ctx.stroke();\n            ctx.restore();\n            return true;\n        };"],
        ...K.EVENT_CHIP_SPEC("'芒種 ' + ((history.length % (P('sow_period') || 20)) >= (P('sow_start') || 5) && (history.length % (P('sow_period') || 20)) <= (P('sow_end') || 7) ? '種蒔き期' : (history.length % 20) < 5 ? '蒔まで' + ((P('sow_start') || 5) - history.length % (P('sow_period') || 20)) + '手' : '次周期')"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "20手周期の5〜7手目は種蒔き期。この間の着手は石ではなく種を蒔き、8手後に芽が出て持ち主の石になる。種は取りにも呼吸にも効かないが、芽吹いた石は普通の石。"],
        [K.ONE, K.RV_BASE, K.rv(["種蒔き期 (5-7手目) の着手は伏せた種になる",
            "種は8手後に持ち主の石として芽吹く",
            "種は将来の布石 — 早めに蒔いて芽吹きで形を作れ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.seed={};\nhistory.length=4; // 次着手=5手目 → 種蒔き期\nexecuteMove({cells:[{x:4,y:4}]},1);\nassert('種蒔き期の着手は種', board[4*BOARD_SIZE+4]===4 && st.seed[4*BOARD_SIZE+4].p===1);\nhistory.length=12;\nexecuteMove({cells:[{x:8,y:8}]},2); // 13手目 → 発芽 (at=13)\nassert('種が芽吹いて石になる', board[4*BOARD_SIZE+4]===1 && !st.seed[4*BOARD_SIZE+4]);\nassert('起動して通常着手可', isValidPlacement([{x:0,y:0}],1)===true);",
};
