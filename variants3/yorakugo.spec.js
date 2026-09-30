// YORAKUGO — 瓔珞碁: 堂(中央3x3)に連が繋がれば瓔珞で飾られる。連の石ごとに+1目
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
    file: 'yorakugo.html',
    en: 'YORAKUGO',
    jp: '瓔珞碁',
    prefix: 'yorakugo',
    desc: '中央の堂(3x3)に連を繋げると瓔珞で飾られる。堂に接する連の石ごとに+1目。',
    kind: 'stone',
    icon: 'yorakugo',
    spec: [
        ...K.rb('YORAKUGO', '瓔珞碁', 'yorakugo'),
        // 瓔珞ボーナス: 堂区域に接する自軍連の総石数
        [K.ONE, `        function endGameByScore() {`,
`        // 堂区域: 中央3x3
        function hallIdxs() {
            const c = Math.floor(BOARD_SIZE / 2);
            const idx = [];
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
                idx.push((c + dy) * BOARD_SIZE + c + dx);
            return new Set(idx);
        }
        // 堂に接する (区域内部または区域に隣接する) 自軍連の石数の合計
        function yorakuBonus(player) {
            const hall = hallIdxs();
            const seen = new Set();
            let bonus = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const q = [i]; seen.add(i); const grp = [];
                while (q.length) {
                    const cur = q.shift(); grp.push(cur);
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === player && !seen.has(n)) { seen.add(n); q.push(n); }
                    });
                }
                const touches = grp.some(g => hall.has(g) ||
                    getNeighbors(g).some(n => hall.has(n)));
                if (touches) bonus += grp.length;
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + yorakuBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + yorakuBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>瓔珞:</span> <strong>黒 \${yorakuBonus(1)} / 白 \${yorakuBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        // 堂区域の描画: 朱の堂と瓔珞の弧
        K.CUE_STARS(`            // 堂区域: 中央3x3に朱の堂枠と瓔珞飾り
            {
                const c0 = Math.floor(BOARD_SIZE / 2);
                const zx = padding + (c0 - 1) * cellSize - cellSize / 2;
                const zy = padding + (c0 - 1) * cellSize - cellSize / 2;
                ctx.save();
                ctx.fillStyle = 'rgba(185,60,45,0.12)';
                ctx.fillRect(zx, zy, cellSize * 3, cellSize * 3);
                ctx.strokeStyle = 'rgba(160,50,40,0.75)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.strokeRect(zx, zy, cellSize * 3, cellSize * 3);
                // 瓔珞の弧
                ctx.strokeStyle = 'rgba(212,175,55,0.65)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(padding + c0 * cellSize, zy, cellSize * 0.9, Math.PI * 0.15, Math.PI * 0.85);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'瓔珞 黒' + yorakuBonus(1) + '/白' + yorakuBonus(2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            瓔珞碁: 中央の堂(3x3)に自軍の連が接すれば瓔珞で飾られる — 連の石ごとに+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央3x3は「堂」。堂の内部または堂に隣接する自分の連は瓔珞で飾られ、終局時にその連の石ごとに+1目。',
            '堂に繋がる大きな連ほど華やぐ。分断されれば瓔珞は途切れる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        // 堂の西に隣接する3連 + 離れた孤立石
        [[c - 2, c], [c - 3, c], [c - 3, c - 1]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        board[0 * BOARD_SIZE + 0] = 1; // 堂に触れない孤立石
        assert('堂に接する連は+3', yorakuBonus(1) === 3);
        assert('白は0', yorakuBonus(2) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
