// Magnet Pole-Go — 磁石碁: 石は交互にN/S極を持つ。同極の隣接敵石は反発して退き、異極の敵石は2マス先から引き合う
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
    file: 'magnetpolego.html',
    en: "Magnet Pole-Go",
    jp: "磁石碁",
    prefix: "magnetpolego",
    desc: "石は着手ごとにN/S交互の極を持つ。同極の敵石は反発、異極は引き寄せる。",
    kind: 'stone',
    icon: "magnetpolego",
    spec: [
        ...K.rb("Magnet Pole-Go", "磁石碁", "magnetpolego"),
        K.params([
            { key: 'attract_dist', label: '引力の届く距離', min: 2, max: 4, def: 2, hint: '異極の敵石を何マス先から引き寄せるか' },
            { key: 'repel_push', label: '斥力の押し出し', min: 1, max: 3, def: 1, hint: '同極の敵石を何マス退かせるか' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...PERSIST("{ pol: {}, pc: { 1: 0, 2: 0 } }"),
        [K.ONE, K.CAPTURE_BLOCK, "            // 磁石碁: 通常の取りを解決\n            const captured = getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }\n            // 磁石: 着手石は交互にN/S極。同極の隣接敵石は反発、2マス先の異極は引き合う\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            st.pc[player] = (st.pc[player] || 0) + 1;\n            const mine = st.pc[player] % 2 === 1 ? 'N' : 'S';\n            st.pol[mi] = mine;\n            const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n            const shifts = [];\n            const RP = Math.max(1, P('repel_push') || 1), AD = Math.max(2, P('attract_dist') || 2);\n            D.forEach(([dx, dy]) => {\n                const bx = move.cells[0].x, by = move.cells[0].y;\n                const ex = bx + dx, ey = by + dy;\n                if (ex >= 0 && ey >= 0 && ex < BOARD_SIZE && ey < BOARD_SIZE) {\n                    const ei = ey * BOARD_SIZE + ex;\n                    if (board[ei] === opponent && st.pol[ei] === mine) {\n                        const tx = ex + dx * RP, ty = ey + dy * RP;\n                        if (tx >= 0 && ty >= 0 && tx < BOARD_SIZE && ty < BOARD_SIZE && board[ty * BOARD_SIZE + tx] === 0) {\n                            shifts.push([ei, ty * BOARD_SIZE + tx]);\n                        }\n                    }\n                }\n                const fx2 = bx + dx * AD, fy2 = by + dy * AD;\n                if (fx2 >= 0 && fy2 >= 0 && fx2 < BOARD_SIZE && fy2 < BOARD_SIZE) {\n                    const fi = fy2 * BOARD_SIZE + fx2, m2 = (by + dy * (AD - 1)) * BOARD_SIZE + (bx + dx * (AD - 1));\n                    if (board[fi] === opponent && st.pol[fi] && st.pol[fi] !== mine && board[m2] === 0) {\n                        shifts.push([fi, m2]);\n                    }\n                }\n            });\n            shifts.forEach(([from, to]) => {\n                if (board[to] !== 0) return;\n                board[to] = board[from]; board[from] = 0;\n                st.pol[to] = st.pol[from]; delete st.pol[from];\n                fxSlide(from, to, 360);\n                const fx = from % BOARD_SIZE, fy = Math.floor(from / BOARD_SIZE);\n                pieces.forEach(pc => pc.cells.forEach(p => { if (p.x === fx && p.y === fy) { p.x = to % BOARD_SIZE; p.y = Math.floor(to / BOARD_SIZE); } }));\n            });"],
        ...K.STONE_MARKS_SPEC("            // 極性マーク: N=赤 / S=青の小さな点\n            {\n                ctx.save();\n                Object.keys(st.pol).forEach(k => {\n                    const i = +k;\n                    if (board[i] !== 1 && board[i] !== 2) return;\n                    const cx = padding + (i % BOARD_SIZE) * cellSize, cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;\n                    ctx.fillStyle = st.pol[i] === 'N' ? '#ef4444' : '#3b82f6';\n                    ctx.beginPath();\n                    ctx.arc(cx + cellSize * 0.22, cy - cellSize * 0.22, cellSize * 0.09, 0, Math.PI * 2);\n                    ctx.fill();\n                });\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'磁石: 置くごとにN/S交互'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "着手ごとに石はN/S交互の極を持つ。新しく置いた石と同極の隣接敵石は反発して1マス退き、異極の2マス先の敵石は1マス引き寄せられる。極性で敵陣を掻き回せ。"],
        [K.ONE, K.RV_ALGO, K.rv(["着手石はN/S交互の極を持つ",
            "同極の隣接敵石は反発、異極の2マス先は引き合う",
            "極の順序を読んで置き所を決めろ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.pol={}; st.pc={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+5]=2; st.pol[4*B+5]='N'; // 同極の白(5,4) → 反発で(5,3)へ\nboard[7*B+5]=2; st.pol[7*B+5]='S'; // 異極の白(5,7) → 引き合いで(5,6)へ\nexecuteMove({cells:[{x:5,y:5}]},1); // 黒1手目=N\nassert('新しい石はN極', st.pol[5*B+5]==='N');\nassert('同極の敵石は反発', board[4*B+5]===0 && board[3*B+5]===2);\nassert('異極の敵石は引き合う', board[7*B+5]===0 && board[6*B+5]===2);\nassert('極は石と共に動く', st.pol[3*B+5]==='N' && st.pol[6*B+5]==='S');",
};
