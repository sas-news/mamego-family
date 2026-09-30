// LUMENGO — 光彩碁: 石は光源。空点は「より明るく照らす側」の地になる。
// 光量は距離の二乗に反比例し、干渉して地が決まる。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

const CALCT = `        function calculateTerritory() {
            const deadMask = computeDeadMask(board);
            const visited = Array(board.length).fill(false);
            let blackTerritory = 0;
            let whiteTerritory = 0;

            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0 && !visited[i]) {
                    if (deadMask[i]) { // 窒息領域は壁扱い(地にならない)
                        visited[i] = true;
                        continue;
                    }
                    const region = [];
                    let touchesBlack = false;
                    let touchesWhite = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        region.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (board[n] === 0) {
                                if (!visited[n]) {
                                    visited[n] = true;
                                    queue.push(n);
                                }
                            } else if (board[n] === 1) touchesBlack = true;
                            else if (board[n] === 2) touchesWhite = true;
                        });
                    }

                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;
                }
            }
            return { black: blackTerritory, white: whiteTerritory };
        }`;

module.exports = {
    file: 'lumengo.html',
    en: 'LUMENGO',
    jp: '光彩碁',
    prefix: 'lumengo',
    desc: '石は光源。各空点をより明るく照らす側の地になる (光量は距離二乗で減衰)。',
    kind: 'stone',
    icon: 'lumengo',
    spec: [
        ...K.rb('LUMENGO', '光彩碁', 'lumengo'),
        // 光彩採点: 空点ごとに両色の光量を比較 (明るい側が5%以上優勢なら地)
        [K.ONE, CALCT, `        function calculateTerritory() {
            // 光彩モデル: 各空点への光量 L = Σ1/(d^2+1) を両色で比較
            const bx = [], wx = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 1) bx.push([i % BOARD_SIZE, (i / BOARD_SIZE) | 0]);
                else if (board[i] === 2) wx.push([i % BOARD_SIZE, (i / BOARD_SIZE) | 0]);
            }
            let blackTerritory = 0;
            let whiteTerritory = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                let lb = 0, lw = 0;
                bx.forEach(([sx, sy]) => { const d2 = (sx - x) * (sx - x) + (sy - y) * (sy - y); lb += 1 / (d2 + 1); });
                wx.forEach(([sx, sy]) => { const d2 = (sx - x) * (sx - x) + (sy - y) * (sy - y); lw += 1 / (d2 + 1); });
                if (lb > lw * 1.05) blackTerritory++;
                else if (lw > lb * 1.05) whiteTerritory++;
            }
            return { black: blackTerritory, white: whiteTerritory };
        }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        // 石の輝き: 光源のハローと空点の光彩
        ...K.STONE_MARKS_SPEC(`            {
                const now = fxNow();
                ctx.save();
                // 石のハロー
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const c = board[i] === 1 ? '96,165,250' : '251,146,60';
                    const r = cellSize * (0.55 + 0.05 * Math.sin(now / 500 + i));
                    const grad = ctx.createRadialGradient(cx, cy, cellSize * 0.2, cx, cy, r);
                    grad.addColorStop(0, 'rgba(' + c + ',0.30)');
                    grad.addColorStop(1, 'rgba(' + c + ',0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            光彩碁: 石は光源。各空点はより明るく照らす側の地になる (距離二乗で減衰・5%差で確定)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '空点の地は囲いでなく「光」で決まる: 石からの光量は距離の二乗に反比例して減衰。',
            '各空点で黒光と白光を比較し、5%以上明るい側の地になる。互角の点は中立。',
            '囲う必要はない — 石の配置そのものが光の干渉模様を描く。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 黒石1つだけの盤: 光は黒優勢の点が多い
        board[6 * BOARD_SIZE + 6] = 1;
        const t1 = calculateTerritory();
        assert('黒石の光が空点を照らす', t1.black > 0);
        // 白石も置くと干渉して均衡域ができる
        board[6 * BOARD_SIZE + 2] = 2;
        const t2 = calculateTerritory();
        assert('光の干渉で白側の地も生まれる', t2.white > 0);
        assert('光彩採点が動く', t2.black + t2.white > 0);
    `,
};
