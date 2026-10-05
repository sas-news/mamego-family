// VOTEGO — 選挙碁: 9区画それぞれで石数の多数派がその区の空点を総取り
const K = require('../gen_kit.js');
module.exports = {
    file: 'votego.html',
    en: 'VOTEGO',
    jp: '選挙碁',
    prefix: 'votego',
    desc: '9区画制。各区で石数が多い側がその区の空点を総取りする選挙制。',
    kind: 'vote',
    spec: [
        ...K.rb('VOTEGO', '選挙碁', 'votego'),
        K.params([
            { key: 'zone_n', label: '選挙区の数 (縦横)', min: 2, max: 5, def: 3, unit: '区' },
            { key: 'cap_rows', label: '打ち切り手数 (盤+N行)', min: 1, max: 8, def: 2, unit: '行' },
        ]),
        // 区画多数派の地計算に差替 (3×3の選挙区)
        [K.ONE, `        function calculateTerritory() {
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
        }`,
`        // 選挙制: 盤を3×3の9選挙区に分け、各区で石数多数派がその区の空点を総取り
        function districtOf(x, y) {
            const nz = Math.max(2, P('zone_n') || 3);
            const zw = Math.ceil(BOARD_SIZE / nz), zh = Math.ceil(BOARD_SIZE / nz);
            return Math.min(nz - 1, Math.floor(y / zh)) * nz + Math.min(nz - 1, Math.floor(x / zw));
        }
        function calculateTerritory() {
            const nz = Math.max(2, P('zone_n') || 3);
            const zones = [];
            for (let z = 0; z < nz * nz; z++) zones.push({ empty: 0, b: 0, w: 0 });
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                const z = districtOf(x, y);
                if (v === 0) zones[z].empty++;
                else if (v === 1) zones[z].b++;
                else if (v === 2) zones[z].w++;
            }
            let black = 0, white = 0;
            zones.forEach(z => {
                if (z.b > z.w) black += z.empty;
                else if (z.w > z.b) white += z.empty;
            });
            return { black, white };
        }`],
        // 区勢速報: 各区の現在の多数派の色で区全体を薄く染める
        K.CUE_GRID(`            {
                const nz = Math.max(2, P('zone_n') || 3);
                const zw = Math.ceil(BOARD_SIZE / nz), zh = Math.ceil(BOARD_SIZE / nz);
                const zc = [];
                for (let z = 0; z < nz * nz; z++) zc.push({ b: 0, w: 0 });
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const v = board[y * BOARD_SIZE + x];
                    if (v === 1) zc[districtOf(x, y)].b++;
                    else if (v === 2) zc[districtOf(x, y)].w++;
                }
                ctx.save();
                for (let zy = 0; zy < nz; zy++) for (let zx = 0; zx < nz; zx++) {
                    const z = zc[zy * nz + zx];
                    if (z.b === z.w) continue;
                    ctx.fillStyle = z.b > z.w ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.20)';
                    const x0 = padding + (zx * zw - 0.5) * cellSize;
                    const y0 = padding + (zy * zh - 0.5) * cellSize;
                    const w = (Math.min(BOARD_SIZE, (zx + 1) * zw) - zx * zw) * cellSize;
                    const h = (Math.min(BOARD_SIZE, (zy + 1) * zh) - zy * zh) * cellSize;
                    ctx.fillRect(x0, y0, w, h);
                }
                ctx.restore();
            }`),
        // 区画境界を太線で描く
        K.CUE_STARS(`            {
                const nz = Math.max(2, P('zone_n') || 3);
                const zw = Math.ceil(BOARD_SIZE / nz);
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.75);
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                for (let k = 1; k <= nz - 1; k++) {
                    const x = padding + k * zw * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(x, padding);
                    ctx.lineTo(x, width - padding);
                    ctx.stroke();
                    const y = padding + k * zw * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(padding, y);
                    ctx.lineTo(width - padding, y);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '盤は3×3の9選挙区。終局時に各区で石数が多い側がその区の空点を全て獲得する。',
            '囲む必要はなく、区の中に石を多く置いた側の勝ち。取り・アゲハマ・コミは通常通り。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + Math.max(1, P('cap_rows') || 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        // 左上区に黒2・白1 → 左上区の空点は黒に
        board[0] = 1; board[1] = 1; board[2] = 2;
        const t = calculateTerritory();
        const zw = Math.ceil(BOARD_SIZE / 3);
        assert('黒が左上区の空点を獲得', t.black === zw * zw - 3);
        assert('白の地は0', t.white === 0);
        board.fill(0);
        const t2 = calculateTerritory();
        assert('石なしなら地もなし', t2.black === 0 && t2.white === 0);
        assert('起動して着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
