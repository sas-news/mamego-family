// CURLGO — 氷壺碁: 打った石はハウス (中心) に向かって滑り、最接近でボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'curlgo.html',
    en: 'CURLGO',
    jp: '氷壺碁',
    prefix: 'curlgo',
    desc: '石はハウス中心へ向かって滑る。終局時、中心に最も近い石に+5目。',
    kind: 'stone',
    spec: [
        ...K.rb('CURLGO', '氷壺碁', 'curlgo'),
        K.params([
            { key: 'house_bonus', label: 'ハウスボーナス', min: 0, max: 15, def: 5, unit: '目' },
            { key: 'slide_max', label: '滑走距離の上限', min: 0, max: 20, def: 0, unit: 'マス', hint: '0=無制限 (ハウスまで滑る)' },
        ]),
        // 滑り処理を捕獲の前に挿入
        [K.ONE, K.CAPTURE_BLOCK, `            // 氷壺: 打った石はハウス中心へ向かって滑り、他石や中心で止まる
            {
                const hc = (BOARD_SIZE - 1) / 2;
                move.cells.forEach(p => {
                    const from = p.y * BOARD_SIZE + p.x;
                    if (board[from] !== player) return;
                    let cx = p.x, cy = p.y, _slid = 0;
                    const _maxD = P('slide_max') || 0; // 0=無制限
                    while ((cx !== hc || cy !== hc) && (_maxD === 0 || _slid < _maxD)) {
                        const dx = hc - cx, dy = hc - cy;
                        let sx = 0, sy = 0;
                        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) sx = Math.sign(dx);
                        else if (dy !== 0) sy = Math.sign(dy);
                        const nx = cx + sx, ny = cy + sy;
                        if (board[ny * BOARD_SIZE + nx] !== 0) break;
                        cx = nx; cy = ny; _slid++;
                    }
                    if (cx !== p.x || cy !== p.y) {
                        board[cy * BOARD_SIZE + cx] = player;
                        board[from] = 0;
                        const pc = pieces[pieces.length - 1];
                        if (pc && pc.player === player) pc.cells = [{ x: cx, y: cy }];
                        const dist = Math.abs(cx - p.x) + Math.abs(cy - p.y);
                        fxSlide(from, cy * BOARD_SIZE + cx, 260 + dist * 55);
                        if (Math.abs(cx - hc) + Math.abs(cy - hc) <= 1) fxGlow(cy * BOARD_SIZE + cx, '#93c5fd', 700);
                    }
                });
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 終局スコアにハウスボーナス
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // ハウスボーナス: 中心に最も近い石の持ち主に+5目
            const hc = (BOARD_SIZE - 1) / 2;
            let bestD = Infinity, bestP = 0, bestTie = false;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const d = Math.abs(i % BOARD_SIZE - hc) + Math.abs(Math.floor(i / BOARD_SIZE) - hc);
                if (d < bestD) { bestD = d; bestP = board[i]; bestTie = false; }
                else if (d === bestD && board[i] !== bestP) bestTie = true;
            }
            const house = bestTie ? 0 : bestP;
            const _hb = P('house_bonus') ?? 5;
            const blackTotal = territory.black + captures[1] + (house === 1 ? _hb : 0);
            const whiteTotal = territory.white + captures[2] + komi + (house === 2 ? _hb : 0);`],
        [K.ONE, `<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="flex justify-between"><span>ハウス最接近:</span> <strong>\${house === 0 ? 'なし' : ((house === 1 ? '黒 +' : '白 +') + (P('house_bonus') ?? 5))}</strong></div>`],
        // ハウス (青白赤の円) 描画
        K.CUE_STARS(`            {
                const hc = (BOARD_SIZE - 1) / 2;
                const cx = padding + hc * cellSize, cy = padding + hc * cellSize;
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#4a7fbf';
                ctx.beginPath(); ctx.arc(cx, cy, cellSize * 1.4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f0f0ea';
                ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#c0503f';
                ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.45, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            氷壺碁: 石はハウス中心へ滑る。終局時の最接近で+5目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '打った石は置いた点からハウス (盤中央の同心円) へ向かって滑り、他の石や中心で止まる。',
            '止まった位置で通常の呼吸・取りが働く。終局時、ハウス中心に最も近い石の持ち主に+5目。',
            'ブランコ (ガード) に当てて自石をハウスに残すカーリングの駆け引きが決め手。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        const hc = (BOARD_SIZE - 1) / 2;
        assert('石はハウスへ滑る', board[hc * BOARD_SIZE + hc] === 1 && board[0] === 0);
        board.fill(0); pieces = [];
        board[2 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 0, y: 2 }] }, 2);
        assert('他石の手前で止まる', board[2 * BOARD_SIZE + 1] === 2);
        board.fill(0); pieces = [];
        board[hc * BOARD_SIZE + hc] = 1;
        endGameByScore();
        assert('ハウス最接近の表示', !!gameResultData && gameResultData.details.includes('黒 +5'));
    `,
};
