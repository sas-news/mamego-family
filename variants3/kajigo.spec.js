// KAJIGO — 加持碁: 4個以上の連は加持の祈りが届く — 終局時1連につき+2目の守護
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kajigo.html',
    en: 'KAJIGO',
    jp: '加持碁',
    prefix: 'kajigo',
    desc: '4個以上の連は加持の祈りが届く — 終局時1連につき+2目の守護。',
    kind: 'stone',
    icon: 'kajigo',
    spec: [
        ...K.rb('KAJIGO', '加持碁', 'kajigo'),
        K.params([
            { key: 'ren_min', label: '加持が届く連の大きさ', min: 2, max: 9, def: 4, unit: '子' },
            { key: 'kaji_pts', label: '連ごとの守護点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 加持: 4個以上の連は祈りが届く — 1連+2目
        function kajiBonus(player) {
            const seen = new Set();
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const stack = [i], g = [];
                while (stack.length) {
                    const c = stack.pop();
                    if (seen.has(c) || board[c] !== player) continue;
                    seen.add(c); g.push(c);
                    getNeighbors(c).forEach(n => { if (board[n] === player && !seen.has(n)) stack.push(n); });
                }
                if (g.length >= (P('ren_min') || 4)) b += (P('kaji_pts') ?? 2);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + kajiBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + kajiBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>加持の守護:</span> <strong>黒 \${kajiBonus(1)} / 白 \${kajiBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            加持碁: 4個以上の連は加持の祈りが届く — 終局時1連につき+2目の守護<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '加持: 終局時、4個以上で繋がった連は加持の祈りが届き1連につき+2目の守護。',
            '大きな連を保てば守られる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[0] = 1; board[1] = 1; board[2] = 1;
        assert('3個の連は加持未満', kajiBonus(1) === 0);
        board[3] = 1; // 4個の連
        assert('4個の連は加持+2', kajiBonus(1) === 2);
        board[9 * BOARD_SIZE + 9] = 2;
        assert('白の孤石は0', kajiBonus(2) === 0);
    `,
};
