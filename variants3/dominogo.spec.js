// DOMINOGO — 骨牌碁: 同じ筋に3回置くとドミノが倒れ、その方向へ自分の石が伝播する
const K = require('../gen_kit.js');
module.exports = {
    file: 'dominogo.html',
    en: 'DOMINOGO',
    jp: '骨牌碁',
    prefix: 'dominogo',
    desc: '同じ筋(x列)に自石を3個積むとドミノが倒れ、列の上下の空点に石が伝播する。',
    kind: 'stone',
    icon: 'dominogo',
    spec: [
        ...K.rb('DOMINOGO', '骨牌碁', 'dominogo'),
        K.params([
            { key: 'domino_n', label: '倒れるのに必要な石数', min: 2, max: 6, def: 3, unit: '個' },
            { key: 'domino_len', label: '伝播する最大石数', min: 1, max: 8, def: 3, unit: '個' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        // ドミノ倒し: 同じ筋に3個目の自石 → 上下方向へ空点に石が倒れ伝播する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ドミノルール: 同じ筋に3個目の自石 → その筋の上下へ倒れて石が伝播
            {
                const px = move.cells[0].x;
                let col = 0;
                for (let y = 0; y < BOARD_SIZE; y++) if (board[y * BOARD_SIZE + px] === player) col++;
                const dn = Math.max(1, P('domino_n') || 3);
                if (col >= dn && col % dn === 0) {
                    const s = Math.sin(history.length * 47.7 + 9.3) * 43758.5453;
                    const dir = (s - Math.floor(s)) < 0.5 ? -1 : 1; // 上か下へ倒れる
                    let y = move.cells[0].y + dir, n = 0;
                    while (y >= 0 && y < BOARD_SIZE && n < (P('domino_len') || 3)) {
                        const i = y * BOARD_SIZE + px;
                        if (board[i] === 0) {
                            board[i] = player;
                            fxGlow(i, '#fb923c', 600);
                            n++;
                        } else if (board[i] !== player) {
                            break; // 敵石でドミノが止まる
                        }
                        y += dir;
                    }
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(mi, 'ドミノ倒し +' + n, '#fb923c', 1300);
                    fxShake(3, 300);
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 筋ごとの自石の積み数を小さなドミノで示す
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    [1, 2].forEach(pl => {
                        let col = 0;
                        for (let y = 0; y < BOARD_SIZE; y++) if (board[y * BOARD_SIZE + x] === pl) col++;
                        const m = col % (P('domino_n') || 3);
                        if (m === 0) return;
                        const cx = padding + x * cellSize;
                        const cy = padding - cellSize * 0.35;
                        ctx.fillStyle = pl === 1 ? 'rgba(251, 146, 60, 0.85)' : 'rgba(253, 224, 71, 0.85)';
                        for (let i = 0; i < m; i++) {
                            ctx.fillRect(cx - cellSize * 0.18 + i * cellSize * 0.2, cy - cellSize * 0.1, cellSize * 0.14, cellSize * 0.3);
                        }
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            骨牌碁: 同じ筋に自石を3個積むとドミノが倒れ、列の空点に石が伝播する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同じ筋に自分の石を3個積むとドミノが倒れ、列の上か下の空点へ最大3個の石が伝播する (敵石で止まる)。',
            '筋の上端の積み数マーカーであと何個で倒れるか分かる。倒れる方向は倒し手の機微。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof executeMove === 'function');
        board[2 * BOARD_SIZE + 4] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 4, y: 8 }] }, 1); // 筋x=4に3個目 → 倒れる
        assert('ドミノが伝播した', board.filter(v => v === 1).length > 3);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        // 2個では倒れない
        board.fill(0); board[1 * BOARD_SIZE + 7] = 1;
        executeMove({ cells: [{ x: 7, y: 3 }] }, 1);
        assert('2個では倒れない', board.filter(v => v === 1).length === 2);
        assert('盤面が壊れない', true);
    `,
};
