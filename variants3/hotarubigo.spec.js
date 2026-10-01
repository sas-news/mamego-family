// HOTARUBIGO — 蛍火碁: 四方すべてが暗所 (空点) の石は蛍火として光り、終局時+0.5目
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
    file: 'hotarubigo.html',
    en: 'HOTARUBIGO',
    jp: '蛍火碁',
    prefix: 'hotarubigo',
    desc: '四方すべてが空点の暗がりに佇む石は蛍火 — 終局時1個につき+0.5目の淡い光。',
    kind: 'stone',
    icon: 'hotarubigo',
    spec: [
        ...K.rb('HOTARUBIGO', '蛍火碁', 'hotarubigo'),
        K.params([
            { key: 'hotaru_pts', label: '蛍火の得点', min: 0, max: 2, def: 0.5, step: 0.5, unit: '目' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 蛍火: 全隣接点が空点の石は暗がりで光る — 1個+0.5目
        function hotaruBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player) continue;
                const nb = getNeighbors(i);
                if (nb.length > 0 && nb.every(n => board[n] === 0)) b += (P('hotaru_pts') ?? 0.5);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + hotaruBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + hotaruBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>蛍火の光:</span> <strong>黒 \${hotaruBonus(1)} / 白 \${hotaruBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 蛍火: 暗がりに佇む石のまわりで淡い光が瞬く
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const nb = getNeighbors(i);
                if (nb.length === 0 || !nb.every(n => board[n] === 0)) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const ph = Math.sin(now / 900 + x * 2.1 + y * 1.7);
                if (ph > 0.3) {
                    ctx2.globalAlpha = ph * 0.55;
                    ctx2.fillStyle = '#d9f99d';
                    ctx2.beginPath();
                    ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.16, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            蛍火碁: 四方すべてが空点の石は蛍火として光る — 終局時+0.5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '蛍火: 終局時、隣接する全方向が空点の自石は暗がりに灯る蛍火として+0.5目。',
            '敵にも味方にも触れない孤高の石がほのかに得をする。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4 * BOARD_SIZE + 4] = 1;
        assert('暗がりの石は蛍火+0.5', hotaruBonus(1) === 0.5);
        board[4 * BOARD_SIZE + 5] = 2; // 敵が隣に来ると灯りが消える
        assert('隣に石があれば消える', hotaruBonus(1) === 0);
        board[4 * BOARD_SIZE + 5] = 0;
        board[9 * BOARD_SIZE + 9] = 2;
        assert('白の蛍火も+0.5', hotaruBonus(2) === 0.5);
    `,
};
