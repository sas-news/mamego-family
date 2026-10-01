// Shimofuri-Go — 霜降碁: 18手ごとの霜降で、友2個未満の孤立した外周石が凍死する
const K = require('../gen_kit.js');
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
    file: 'shimofurigo.html',
    en: "Shimofuri-Go",
    jp: "霜降碁",
    prefix: "shimofurigo",
    desc: "18手ごとに霜が降り、友2個未満の外周石が凍死して相手のアゲハマになる。",
    kind: 'stone',
    icon: "shimofurigo",
    spec: [
        ...K.rb("Shimofuri-Go", "霜降碁", "shimofurigo"),
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // 霜降: 18手ごとに霜が降り、未保護の外周石が凍死する\n            if (history.length % 18 === 0) {\n                const dead = [];\n                for (let i = 0; i < board.length; i++) {\n                    const v = board[i];\n                    if (v !== 1 && v !== 2) continue;\n                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);\n                    if (x !== 0 && y !== 0 && x !== BOARD_SIZE - 1 && y !== BOARD_SIZE - 1) continue; // 外周のみ\n                    const friends = getNeighbors(i).filter(n => board[n] === v).length;\n                    if (friends < 2) dead.push(i);\n                }\n                if (dead.length) {\n                    dead.forEach(i => {\n                        fxBurst(i, '#bae6fd', 8, 1.1);\n                        fxText(i, '凍', '#7dd3fc', 900);\n                        captures[3 - board[i]]++;\n                        board[i] = 0;\n                    });\n                    cleanUpPieces();\n                    fxShake(4, 320);\n                }\n            }\n\n            turn = opponent;"],
        K.CUE_GRID("            // 外周に霜の縁取り\n            {\n                ctx.save();\n                ctx.strokeStyle = 'rgba(147,197,253,0.5)';\n                ctx.lineWidth = Math.max(2, cellSize * 0.10);\n                ctx.strokeRect(padding - cellSize * 0.5, padding - cellSize * 0.5, BOARD_SIZE * cellSize, BOARD_SIZE * cellSize);\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("'霜降まで' + (18 - history.length % 18) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, "18手ごとに霜が降りる。霜の時、外周一列で隣接する同色石が2個未満しかない孤立石は凍死して相手のアゲハマになる。端に張り付くなら肩を寄せ合え。"],
        [K.ONE, K.RV_ALGO, K.rv(["18手ごとに霜が降りる",
            "外周で友2個未満の石は凍死して相手の取りになる",
            "端の石は連結させて寒さを凌げ"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nconst B=BOARD_SIZE;\nboard[0]=1; // (0,0) 孤立黒 — 外周\nboard[3]=1; board[4]=1; board[B+3]=1; board[B+4]=1; // 2x2の黒塊は互いに友2個\nboard[5*B+5]=2; // 内側の白は対象外\nhistory.length=17;\nexecuteMove({cells:[{x:6,y:6}]},2); // 18手目 → 霜降\nassert('孤立の外周石は凍死', board[0]===0);\nassert('凍死石は相手のアゲハマ', captures[2]===1);\nassert('2x2の塊は生存', board[3]===1 && board[4]===1 && board[B+3]===1 && board[B+4]===1);\nassert('内側の石は無関係', board[5*B+5]===2);",
};
