// TOFUGO — 豆腐碁: にがりの点に隣接する石を含む連は凝固して豆腐になり、終局時1連+3目
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
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tofugo.html',
    en: 'TOFUGO',
    jp: '豆腐碁',
    prefix: 'tofugo',
    desc: 'にがりの点に触れる連は凝固して豆腐に。終局時1連につき+3目。',
    kind: 'stone',
    icon: 'tofugo',
    spec: [
        ...K.rb('TOFUGO', '豆腐碁', 'tofugo'),
        K.params([
            { key: 'tofu_bonus', label: '凝固した連1つあたりの得点', min: 0, max: 10, def: 3, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // にがりの点: 中央の左右2箇所
        const NIGARI_PTS = (() => {
            const m = Math.floor(BOARD_SIZE / 2);
            const nc = Math.floor(BOARD_SIZE / 4);
            return [nc * BOARD_SIZE + m, (BOARD_SIZE - 1 - nc) * BOARD_SIZE + m];
        })();`],
        // 豆腐集計: にがりに触れる連は1連+3目 (連ごと1回)
        [K.ONE, `        function endGameByScore() {`, `        // 豆腐: にがりに触れる連を数える
        function tofuBonus() {
            const b = { 1: 0, 2: 0 };
            const seen = new Set();
            for (let i = 0; i < board.length; i++) {
                const pl = board[i];
                if ((pl !== 1 && pl !== 2) || seen.has(i)) continue;
                // 連をたどる
                const group = [];
                const q = [i];
                seen.add(i);
                while (q.length) {
                    const c0 = q.shift();
                    group.push(c0);
                    getNeighbors(c0).forEach(n => {
                        if (board[n] === pl && !seen.has(n)) { seen.add(n); q.push(n); }
                    });
                }
                // 連がにがりに隣接 (あるいは直上) していれば凝固
                const coagulated = group.some(g => NIGARI_PTS.includes(g) || getNeighbors(g).some(n => NIGARI_PTS.includes(n)));
                if (coagulated) b[pl] += (P('tofu_bonus') ?? 3);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 豆腐ルール: にがりに触れた連は凝固して+3目
            {
                const tb = tofuBonus();
                territory.black += tb[1];
                territory.white += tb[2];
            }`],
        // にがりの点の描画: 小瓶マーク
        K.CUE_STARS(`            // にがり: 小瓶のマーク
            {
                ctx.save();
                NIGARI_PTS.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
                    ctx.fillRect(cx - cellSize * 0.16, cy - cellSize * 0.14, cellSize * 0.32, cellSize * 0.34);
                    ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
                    ctx.fillRect(cx - cellSize * 0.08, cy - cellSize * 0.30, cellSize * 0.16, cellSize * 0.18);
                    ctx.strokeStyle = 'rgba(3, 105, 161, 0.7)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.strokeRect(cx - cellSize * 0.16, cy - cellSize * 0.14, cellSize * 0.32, cellSize * 0.34);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'にがり ' + NIGARI_PTS.map(i => board[i] === 0 ? '空' : (board[i] === 1 ? '黒' : '白')).join('/')`),
        [K.ONE, K.INFO_ALGO, `            豆腐碁: にがりの点に隣接する連は凝固し、終局時1連+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の左右に「にがり」の点がある。点に隣接する石を含む連は凝固して豆腐になり、終局時に1連+3目。',
            'にがりは両者共通の凝固剤。大きな連を一点で固めるか、相手の連を切り離すか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('にがりは2点', NIGARI_PTS.length === 2);
        board.fill(0); pieces = []; history.length = 0;
        const np = NIGARI_PTS[0];
        const adj = getNeighbors(np)[0];
        board[adj] = 1; board[getNeighbors(adj).find(n => n !== np)] = 1; // にがりに触れる黒の連
        assert('にがりに触れる連は豆腐', tofuBonus()[1] === 3);
        board[I(0, 0)] = 2; // 白の孤立石は豆腐でない
        assert('触れない連は豆腐でない', tofuBonus()[2] === 0);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
    `,
};
