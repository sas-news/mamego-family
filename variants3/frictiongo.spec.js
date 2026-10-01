// Friction-Go — 摩擦碁: 敵石に接して置くと静電気が溜まる。6溜まると放電し着手点3x3の敵石を打ち抜く
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
    file: 'frictiongo.html',
    en: "Friction-Go",
    jp: "摩擦碁",
    prefix: "frictiongo",
    desc: "敵石に接する着手で静電気+1、6で自動放電して3x3の敵石を打ち抜く。",
    kind: 'stone',
    icon: "frictiongo",
    spec: [
        ...K.rb("Friction-Go", "摩擦碁", "frictiongo"),
        K.params([
            { key: 'friction_max', label: '放電する静電気量', min: 2, max: 24, def: 6 },
            { key: 'zap_radius', label: '放電の範囲', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...PERSIST("{ fr: { 1: 0, 2: 0 } }"),
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 摩擦: 敵石に接するほど静電気が溜まり、6で放電して3x3を打ち抜く\n            {\n                const bc = move.cells[0];\n                const contact = getNeighbors(bc.y * BOARD_SIZE + bc.x).filter(n => board[n] === opponent).length;\n                st.fr[player] += contact;\n                if (contact) fxGlow(bc.y * BOARD_SIZE + bc.x, '#facc15', 500);\n                if (st.fr[player] >= (P('friction_max') || 6)) {\n                    st.fr[player] = 0;\n                    let zapped = 0;\n                    for (let dy = -(P('zap_radius') || 1); dy <= (P('zap_radius') || 1); dy++) for (let dx = -(P('zap_radius') || 1); dx <= (P('zap_radius') || 1); dx++) {\n                        const nx = bc.x + dx, ny = bc.y + dy;\n                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;\n                        const i0 = ny * BOARD_SIZE + nx;\n                        if (board[i0] === opponent) { board[i0] = 0; captures[player]++; zapped++; fxBurst(i0, '#fbbf24', 8, 1.4); }\n                    }\n                    if (zapped) { fxText(bc.y * BOARD_SIZE + bc.x, '静電!', '#fbbf24', 1000); fxShake(4, 300); cleanUpPieces(); }\n                }\n            }\n\n            turn = opponent;"],
        ...K.EVENT_CHIP_SPEC("'静電 ' + (st.fr ? st.fr[turn] || 0 : 0) + '/' + (P('friction_max') || 6)"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "敵石に接して石を置くと静電気が溜まる (接触1面につき+1)。6溜まると自動放電し、着手点の3x3の敵石を全て打ち抜く。敵に触れて擦るほど力が溜まる。"],
        [K.ONE, K.RV_ALGO, K.rv(["敵石との接触1面ごとに静電+1",
            "6で自動放電し3x3の敵石を打ち抜く",
            "敵に密着して戦うほど放電が近い"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0}; st.fr={1:5,2:0};\nconst B=BOARD_SIZE;\nboard[4*B+4]=2; // 白\nexecuteMove({cells:[{x:4,y:3}]},1); // 黒を白の隣に → 接触+1 → 6で放電\nassert('放電で接触敵石を打ち抜く', board[4*B+4]===0 && captures[1]===1);\nassert('静電はリセット', st.fr[1]===0);\nassert('起動して通常着手可', isValidPlacement([{x:8,y:8}],2)===true);",
};
