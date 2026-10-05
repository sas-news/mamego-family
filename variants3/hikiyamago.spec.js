// HIKIYAMAGO — 山車碁: 5個以上の連は「山車」として練り歩き、終局時に沿道の賑わい+4目/台
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'hikiyamago.html',
    en: 'HIKIYAMAGO',
    jp: '山車碁',
    prefix: 'hikiyamago',
    desc: '5個以上の大きな連は「山車」となる。終局時、山車1台につき沿道の賑わい+4目。',
    kind: 'stone',
    icon: 'hikiyamago',
    spec: [
        ...K.rb('HIKIYAMAGO', '山車碁', 'hikiyamago'),
        K.params([
            { key: 'dashi_min', label: '山車になる連の大きさ', min: 3, max: 9, def: 5, unit: '個' },
            { key: 'dashi_bonus', label: '山車1台の賑わい点', min: 0, max: 12, def: 4, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.8, step: 0.05 },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 山車: 5個以上の連は練り歩く山車となり沿道が賑わう (1台につき+4目)
        function dashiBonus(player) {
            const seen = new Set();
            let bonus = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const g = [i];
                seen.add(i);
                for (let k = 0; k < g.length; k++) {
                    getNeighbors(g[k]).forEach(n => {
                        if (board[n] === player && !seen.has(n)) { seen.add(n); g.push(n); }
                    });
                }
                if (g.length >= (P('dashi_min') || 5)) bonus += (P('dashi_bonus') || 4);
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + dashiBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + dashiBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>山車の賑わい:</span> <strong>黒 \${dashiBonus(1)} / 白 \${dashiBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            山車碁: 5個以上つながった連は「山車」— 終局時、山車1台につき+4目の賑わい<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '5個以上つながった連は「山車」として練り歩き、沿道が賑わう。',
            '終局時、自分の山車1台につき+4目。小さな連には入らない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        for (let x = 2; x <= 6; x++) board[3 * BOARD_SIZE + x] = 1;
        assert('5個の連は山車 (+4)', dashiBonus(1) === 4);
        for (let x = 2; x <= 5; x++) board[7 * BOARD_SIZE + x] = 2;
        assert('4個の連は山車でない', dashiBonus(2) === 0);
        board[7 * BOARD_SIZE + 6] = 2;
        assert('白も5連で山車になる', dashiBonus(2) === 4);
    `,
};
