// YATAIGO — 屋台碁: 同色が横/縦に3個以上連なった「屋台の列」に客が集まり、列の石1個につき+1目
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'yataigo.html',
    en: 'YATAIGO',
    jp: '屋台碁',
    prefix: 'yataigo',
    desc: '同色3連以上の「屋台の列」に客が集まる。列の石1個につき+1目の賑わい。',
    kind: 'stone',
    icon: 'yataigo',
    spec: [
        ...K.rb('YATAIGO', '屋台碁', 'yataigo'),
        [K.ONE, `        function endGameByScore() {`,
`        // 屋台の列: 同色が横/縦に3個以上まっすぐ連なると賑わう (列の石1個につき+1目)
        function stallBonus(player) {
            let bonus = 0;
            const scan = (vals) => {
                let run = 0;
                for (const v of vals) {
                    if (v === player) run++;
                    else { if (run >= 3) bonus += run; run = 0; }
                }
                if (run >= 3) bonus += run;
            };
            for (let y = 0; y < BOARD_SIZE; y++)
                scan(Array.from({ length: BOARD_SIZE }, (_, x) => board[y * BOARD_SIZE + x]));
            for (let x = 0; x < BOARD_SIZE; x++)
                scan(Array.from({ length: BOARD_SIZE }, (_, y) => board[y * BOARD_SIZE + x]));
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + stallBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + stallBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>屋台の賑わい:</span> <strong>黒 \${stallBonus(1)} / 白 \${stallBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            屋台碁: 同色で横/縦に3個以上連なった列は「屋台」— 終局時、列の石1個につき+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が横か縦に3個以上まっすぐ連なった「屋台の列」は客を呼ぶ。',
            '終局時、屋台の列に並ぶ石1個につき+1目の賑わい点が入る (斜め・分断された列は数えない)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1);
        assert('横3連は屋台 (+3)', stallBonus(1) === 3);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 5 }] }, 1);
        assert('縦3連も屋台 (計+6)', stallBonus(1) === 6);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2);
        assert('2連は屋台にならない', stallBonus(2) === 0);
    `,
};
