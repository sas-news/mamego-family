// Condenser-Go — 蓄電碁: 石を置くごとにコンデンサが充電され、8で放電 — 着手点の3x3の敵石を打ち抜く
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
    file: 'condensergo.html',
    en: "Condenser-Go",
    jp: "蓄電碁",
    prefix: "condensergo",
    desc: "着手ごとに+1充電、8で自動放電して着手点の周囲3x3の敵石を打ち抜く。",
    kind: 'stone',
    icon: "condensergo",
    spec: [
        ...K.rb("Condenser-Go", "蓄電碁", "condensergo"),
        K.params([
            { key: 'charge_max', label: '放電に必要な充電', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'zap_radius', label: '放電の範囲', min: 0, max: 3, def: 1, hint: '1=着手点の3x3' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...PERSIST("{ charge: { 1: 0, 2: 0 } }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 蓄電碁: 通常の取りを解決\n            const captured = getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }\n            // 蓄電: 着手ごとに+1充電、8で放電 (3x3の敵石を打ち抜く)\n            st.charge[player]++;\n            if (st.charge[player] >= (P('charge_max') || 8)) {\n                st.charge[player] = 0;\n                const bc = move.cells[0];\n                const _zr = P('zap_radius') ?? 1;\n                let zapped = 0;\n                for (let dy = -_zr; dy <= _zr; dy++) for (let dx = -_zr; dx <= _zr; dx++) {\n                    const nx = bc.x + dx, ny = bc.y + dy;\n                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;\n                    const i0 = ny * BOARD_SIZE + nx;\n                    if (board[i0] === opponent) { board[i0] = 0; captures[player]++; zapped++; fxBurst(i0, '#facc15', 8, 1.4); }\n                }\n                if (zapped) {\n                    fxText(bc.y * BOARD_SIZE + bc.x, '放電!', '#facc15', 1000);\n                    fxShake(5, 320);\n                    cleanUpPieces();\n                }\n            }"],
        ...K.EVENT_CHIP_SPEC("'蓄電 ' + (st.charge ? st.charge[turn] || 0 : 0) + '/' + (P('charge_max') || 8)"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "石を置くたびに自分のコンデンサが1充電。8溜まると自動放電し、着手点を中心とした3x3の敵石を全て打ち抜く。充電は手数で溜まるので両者同じペース。"],
        [K.ONE, K.RV_ALGO, K.rv(["8回着手ごとに着手点の3x3の敵石を打ち抜く",
            "放電は自動 — タイミングは選べない",
            "敵の放電手前では密集を避けよ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.charge={1:7,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; board[5*B+4]=2; // 白 (4,4)(4,5)\nexecuteMove({cells:[{x:5,y:4}]},1); // 8充電で放電 — 3x3内の白を打ち抜く\nassert('8充電で放電', st.charge[1]===0);\nassert('3x3の敵石を打ち抜く', board[4*B+4]===0 && board[5*B+4]===0);\nassert('打ち抜きはアゲハマ', captures[1]===2);",
};
