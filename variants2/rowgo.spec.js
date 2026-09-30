// ROWGO — 行進碁: 手数ごとに指定行が1行ずつ南下する
const K = require('../gen_kit.js');
module.exports = {
    file: 'rowgo.html',
    en: 'ROWGO',
    jp: '行進碁',
    prefix: 'rowgo',
    desc: '着手は指定行のみ。対象行は着手ごとに上から下へ行進して回る。',
    kind: 'row',
    spec: [
        ...K.rb('ROWGO', '行進碁', 'rowgo'),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 行進碁ルール: 対象行 = 手数-1 mod 盤サイズ (0行目から順に南下、最下行の次は0行目)
            {
                const targetRow = history.length % BOARD_SIZE;
                for (const p of cells) {
                    if (p.y !== targetRow) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'対象行: ' + (history.length % BOARD_SIZE + 1) + '行目'`),
        K.CUE_GRID(`            // 行進: 現在の対象行を帯色で照らす
            {
                const tRow = history.length % BOARD_SIZE;
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.14);
                ctx.fillRect(-cellSize, padding + (tRow - 0.5) * cellSize,
                    padding * 2 + BOARD_SIZE * cellSize, cellSize);
                ctx.restore();
            }`),
        // 行進: 左余白に対象行を指す脈動する矢印 (対象行が1手ごとに下へ進むルール)
        [K.ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const tRow = history.length % BOARD_SIZE;
            ctx2.save();
            ctx2.globalAlpha = 0.55 + Math.sin(now / 320) * 0.3;
            ctx2.fillStyle = 'rgba(90,110,170,0.9)';
            ctx2.font = 'bold ' + Math.round(cs * 0.4) + 'px sans-serif';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'middle';
            ctx2.fillText('\\u25b6', pad * 0.45, pad + tRow * cs);
            ctx2.restore();
        });`],
        ...K.LEGAL_DOTS_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は現在の対象行のみ。対象行は1手ごとに上から下へ1行ずつ行進する。',
            '最下行の次は最上行に戻る。対象行が埋まっていればパスで進めるしかない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        assert('1手目は0行目のみ', isValidPlacement([{ x: 4, y: 0 }], 1) === true);
        assert('1手目に1行目は不可', isValidPlacement([{ x: 4, y: 1 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('2手目は1行目のみ', isValidPlacement([{ x: 2, y: 1 }], 2) === true);
        assert('2手目に0行目は不可', isValidPlacement([{ x: 2, y: 0 }], 2) === false);
    `,
};
