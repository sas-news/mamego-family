// STILTGO — 竹馬碁: 星点は高い足場。星に置くと隣の敵石を踏み潰して取る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
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
    file: 'stiltgo.html',
    en: 'STILTGO',
    jp: '竹馬碁',
    prefix: 'stiltgo',
    desc: '星点は竹馬の足場。星に置くと隣接する敵石を上から踏み潰す。',
    kind: 'stone',
    icon: 'stiltgo',
    spec: [
        ...K.rb('STILTGO', '竹馬碁', 'stiltgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2, def: 0.75, step: 0.1, hint: '交点数の倍率' },
        ]),
        // 竹馬: 星点への着手は隣接する全敵石を踏み潰す (呼吸点に関係なく)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 竹馬: 星点に置いた石は高い足場 — 隣の敵石を踏み潰す
            {
                const bc = move.cells[0];
                const isStar = getStarPoints(BOARD_SIZE).some(s => s.x === bc.x && s.y === bc.y);
                if (isStar) {
                    const si = bc.y * BOARD_SIZE + bc.x;
                    let stomped = 0;
                    for (const nb of getNeighbors(si)) {
                        if (board[nb] === opponent) {
                            board[nb] = 0;
                            captures[player]++;
                            stomped++;
                            fxBurst(nb, '#f59e0b', 10, 1.6);
                        }
                    }
                    if (stomped > 0) {
                        fxText(si, 'ドンッ!', '#f59e0b', 1000);
                        fxShake(4, 240);
                        cleanUpPieces();
                    } else {
                        fxGlow(si, '#fbbf24', 600);
                    }
                }
            }

            turn = opponent;`],
        // 星点に竹馬の脚を描く
        K.CUE_STARS(`            // 竹馬の足場: 星点に小さな脚のマーク
            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(s => {
                    const cx = padding + s.x * cellSize, cy = padding + s.y * cellSize;
                    ctx.strokeStyle = 'rgba(146,64,14,0.5)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.lineCap = 'round';
                    [[-1, 1], [1, 1]].forEach(([sx, sy]) => {
                        ctx.beginPath();
                        ctx.moveTo(cx + sx * cellSize * 0.42, cy + sy * cellSize * 0.42);
                        ctx.lineTo(cx + sx * cellSize * 0.28, cy - sy * cellSize * 0.05);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(cx + sx * cellSize * 0.28, cy - sy * cellSize * 0.05);
                        ctx.lineTo(cx + sx * cellSize * 0.10, cy - sy * cellSize * 0.42);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'星に置くと隣の敵石を踏む'`),
        [K.ONE, K.INFO_ALGO, `            竹馬碁: 星点は竹馬の足場。星に置くと隣の敵石を上から踏み潰して取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星点は竹馬の「高い足場」。星に石を置くと、直交する全ての敵石を踏み潰す (アゲハマ)。',
            '呼吸点に関係なく踏める強力な一撃だが、星点の数は限られる。',
            '足場は盤上対称 — 両者に同じ竹馬の機会がある。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const star = getStarPoints(BOARD_SIZE)[0];
        board[I(star.x + 1, star.y)] = 2; // 星の隣に白石
        executeMove({ cells: [{ x: star.x, y: star.y }] }, 1); // 黒が星に置く
        assert('星の隣の敵石を踏む', board[I(star.x + 1, star.y)] === 0);
        assert('踏んだ石はアゲハマに', captures[1] === 1);
        // 星以外では踏めない
        board[I(7, 8)] = 2;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('星以外では踏まない', board[I(7, 8)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
