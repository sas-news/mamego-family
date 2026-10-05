// KEIRAKUGO — 経絡碁: 6つ以上繋がった連は「経絡」が通る。最大連の長さ分(上限12)の得点
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
    file: 'keirakugo.html',
    en: 'KEIRAKUGO',
    jp: '経絡碁',
    prefix: 'keirakugo',
    desc: '6つ以上繋がった連は「経絡」が通る。最長の連の長さ(上限12)が終局時の得点。',
    kind: 'stone',
    icon: 'keirakugo',
    spec: [
        ...K.rb('KEIRAKUGO', '経絡碁', 'keirakugo'),
        K.params([
            { key: 'mer_min', label: '経絡が通る最小連', min: 3, max: 12, def: 6, unit: '子' },
            { key: 'mer_max', label: '得点の上限', min: 4, max: 30, def: 12, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 経絡ボーナス: 自軍の最大連が6以上ならその長さ (上限12)
        [K.ONE, `        function endGameByScore() {`,
`        function meridianBonus(player) {
            const seen = new Set();
            let best = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const q = [i]; seen.add(i); let n = 0;
                while (q.length) {
                    const cur = q.shift(); n++;
                    getNeighbors(cur).forEach(nx => {
                        if (board[nx] === player && !seen.has(nx)) { seen.add(nx); q.push(nx); }
                    });
                }
                if (n > best) best = n;
            }
            return best >= (P('mer_min') || 6) ? Math.min(best, P('mer_max') || 12) : 0;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + meridianBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + meridianBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>経絡:</span> <strong>黒 \${meridianBonus(1)} / 白 \${meridianBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 経絡の描画: 6連以上の連の石に脈の印
        ...K.STONE_MARKS_SPEC(`            {
                [1, 2].forEach(pl => {
                    const seen = new Set();
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== pl || seen.has(i)) continue;
                        const q = [i]; seen.add(i); const grp = [];
                        while (q.length) {
                            const cur = q.shift(); grp.push(cur);
                            getNeighbors(cur).forEach(nx => {
                                if (board[nx] === pl && !seen.has(nx)) { seen.add(nx); q.push(nx); }
                            });
                        }
                        if (grp.length < (P('mer_min') || 6)) continue;
                        ctx.save();
                        ctx.strokeStyle = pl === 1 ? 'rgba(34,160,80,0.55)' : 'rgba(20,120,60,0.6)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                        grp.forEach(g => {
                            const cx = padding + (g % BOARD_SIZE) * cellSize;
                            const cy = padding + Math.floor(g / BOARD_SIZE) * cellSize;
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                            ctx.stroke();
                        });
                        ctx.restore();
                    }
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'経絡 黒' + meridianBonus(1) + '/白' + meridianBonus(2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            経絡碁: 6つ以上の連は経絡が通る — 最長連の長さ(上限12)が終局時の得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の連のうち最長のものが6石以上なら「経絡」が通る。終局時にその長さ分(上限12)が得点。',
            '大きな連を通すか、相手の気脈を分断するか — 分断が即ち絶経。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        assert('6連で経絡+6', meridianBonus(1) === 6);
        board[0 * BOARD_SIZE + 0] = 1; // 孤立石は足りない
        assert('孤立は足されない', meridianBonus(1) === 6);
        [[0, 9], [1, 9], [2, 9]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        assert('5連未満は0', meridianBonus(2) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
