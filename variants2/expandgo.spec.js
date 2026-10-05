// EXPANDGO — 拡大碁: 5手ごとに盤が外周へ1マスずつ拡大する (上限19路)
const K = require('../gen_kit.js');
module.exports = {
    file: 'expandgo.html',
    en: 'EXPANDGO',
    jp: '拡大碁',
    prefix: 'expandgo',
    desc: '5手ごとに盤が外周へ拡大して最大19路になる。石は中心寄りに残る。',
    kind: 'stone',
    spec: [
        ...K.rb('EXPANDGO', '拡大碁', 'expandgo'),
        K.params([
            { key: 'expand_interval', label: '盤が拡大する間隔', min: 2, max: 20, def: 5, unit: '手' },
            { key: 'expand_max', label: '盤の最大サイズ', options: [{ v: 15, l: '15路' }, { v: 17, l: '17路' }, { v: 19, l: '19路' }, { v: 21, l: '21路' }], def: 19 },
        ]),
        // undoで盤サイズも戻す
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                bs: BOARD_SIZE
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.bs) BOARD_SIZE = snap.bs;`],
        // 5手ごと盤が1段外周へ拡大 (既存の石はオフセット+1,+1で残る)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 拡大ルール: 5手ごとに盤が外周へ1マスずつ拡大する (最大19路)。
            //             既存の石は新盤面の1マス内側にそのまま残る。
            if (history.length % Math.max(1, P('expand_interval') || 5) === 0 && BOARD_SIZE < (P('expand_max') || 19)) {
                const N0 = BOARD_SIZE, N2 = N0 + 2;
                const nb = new Array(N2 * N2).fill(0);
                for (let y = 0; y < N0; y++) for (let x = 0; x < N0; x++) {
                    nb[(y + 1) * N2 + (x + 1)] = board[y * N0 + x];
                }
                BOARD_SIZE = N2;
                board = nb;
                pieces.forEach(pc => pc.cells.forEach(p => { p.x += 1; p.y += 1; }));
                // 拡大の瞬間: 盤が揺れ、新生リングが光る
                fxShake(5, 320);
                for (let y = 0; y < N2; y++) for (let x = 0; x < N2; x++) {
                    if (x === 0 || x === N2 - 1 || y === 0 || y === N2 - 1) {
                        fxGlow(y * N2 + x, 'rgba(150,220,160,0.8)', 700);
                    }
                }
                fxText(Math.floor(N2 / 2) * N2 + Math.floor(N2 / 2), '拡大！', 'rgba(120,200,140,0.95)', 1100);
            }

            turn = opponent;`],
        // 拡大域の描画: 外周1マスの新生リング
        K.CUE_GRID(`            // 拡大: 最外周リングを淡く強調 (新生の領土)
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.08);
                const w = BOARD_SIZE * cellSize;
                ctx.fillRect(padding - cellSize * 0.5, padding - cellSize * 0.5, w, cellSize);
                ctx.fillRect(padding - cellSize * 0.5, padding + (BOARD_SIZE - 0.5) * cellSize, w, cellSize);
                ctx.fillRect(padding - cellSize * 0.5, padding - cellSize * 0.5, cellSize, w);
                ctx.fillRect(padding + (BOARD_SIZE - 0.5) * cellSize, padding - cellSize * 0.5, cellSize, w);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'拡大まで ' + (BOARD_SIZE >= (P('expand_max') || 19) ? '上限' : ((P('expand_interval') || 5) - history.length % (P('expand_interval') || 5)) + ' 手')`),
        [K.ONE, K.RV_BASE, K.rv([
            '5手ごとに盤が外周へ1マスずつ拡大する (上限19路)。既存の石は1マス内側に残る。',
            '新しい辺境が生まれ続ける。終盤ほど広い盤での大きな戦いになる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        assert('起動時は13路', BOARD_SIZE === 13);
        assert('盤は正方形', board.length === BOARD_SIZE * BOARD_SIZE);
        board.fill(0);
        const cells = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
        for (let k = 0; k < 5; k++) executeMove({ cells: [{ x: cells[k][0], y: cells[k][1] }] }, k % 2 + 1);
        assert('5手で盤が拡大', BOARD_SIZE === 15);
        assert('旧盤の石はオフセットで残る', board[1 * 15 + 1] === 1 && board[1 * 15 + 3] === 1);
        assert('新生リングも打てる', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
