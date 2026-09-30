// ROULETTEGO — 輪盤碁: 毎手番に出目区域が光り、区域内での着手はボーナス目
const K = require('../gen_kit.js');
module.exports = {
    file: 'roulettego.html',
    en: 'ROULETTEGO',
    jp: '輪盤碁',
    prefix: 'roulettego',
    desc: '毎手番、出目区域 (3x3) が金色に光る。区域内に打てば+2目ボーナス。',
    kind: 'stone',
    spec: [
        ...K.rb('ROULETTEGO', '輪盤碁', 'roulettego'),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let hotIdx = -1; // 出目区域の中心`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 輪盤: 出目区域 (3x3) 内に打てば+2目ボーナス。その後出目を振り直す
            {
                if (hotIdx >= 0) {
                    const hx = hotIdx % BOARD_SIZE, hy = Math.floor(hotIdx / BOARD_SIZE);
                    const inZone = move.cells.some(p => Math.abs(p.x - hx) <= 1 && Math.abs(p.y - hy) <= 1);
                    if (inZone) {
                        captures[player] += 2;
                        const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                        fxGlow(ci, '#facc15', 900);
                        fxBurst(ci, '#fde68a', 10, 1.4);
                        fxText(ci, '+2目!', '#facc15', 1200);
                    }
                }
                hotIdx = Math.floor(Math.random() * board.length);
                fxGlow(hotIdx, '#fde68a', 700); // 玉が新しい区画に落ちる閃き
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC('hotIdx >= 0 ? "出目 (" + (hotIdx % BOARD_SIZE) + "," + Math.floor(hotIdx / BOARD_SIZE) + ")" : ""'),
        // 出目区域を金色にハイライト
        K.CUE_STARS(`            if (hotIdx >= 0) {
                const hx = hotIdx % BOARD_SIZE, hy = Math.floor(hotIdx / BOARD_SIZE);
                ctx.save();
                ctx.fillStyle = 'rgba(235,175,40,0.18)';
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const nx = hx + dx, ny = hy + dy;
                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                    ctx.fillRect(padding + (nx - 0.5) * cellSize, padding + (ny - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.strokeStyle = 'rgba(160,110,20,0.7)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                ctx.arc(padding + hx * cellSize, padding + hy * cellSize, cellSize * 0.35, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            輪盤碁: 出目区域が光り、区域内に打てばボーナス目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '毎手番、金色の出目区域 (3x3) がランダムに選ばれる。',
            '区域内に着手すれば+2目のボーナスアゲハマ。出目は手番ごとに振り直される。',
            '戦況を無視して出目を追いかけるか — 運と欲張りのルーレット。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        hotIdx = 4 * BOARD_SIZE + 4;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('出目区域でボーナス', captures[1] === 2);
        assert('出目は振り直される', hotIdx >= 0 && hotIdx < board.length);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        hotIdx = 0;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('区域外は加点なし', captures[1] === 0);
    `,
};
