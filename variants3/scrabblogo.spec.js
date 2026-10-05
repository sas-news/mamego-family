// SCRABBLOGO — 文字碁: 石は文字タイル。着手で横に3つ以上連なると「単語」ボーナス地
const K = require('../gen_kit.js');
module.exports = {
    file: 'scrabblogo.html',
    en: 'SCRABBLOGO',
    jp: '文字碁',
    prefix: 'scrabblogo',
    desc: '石は文字タイル。着手で横向きに3つ以上自石が連なると、連の長さ-2目のボーナス。',
    kind: 'stone',
    icon: 'scrabblogo',
    spec: [
        ...K.rb('SCRABBLOGO', '文字碁', 'scrabblogo'),
        K.params([
            { key: 'word_min', label: '単語になる最小の長さ', min: 2, max: 6, def: 3, unit: '字' },
            { key: 'word_bonus', label: 'ボーナス計算の減算値', min: 0, max: 4, def: 2, hint: '連の長さ-この値の目' },
        ]),
        // 文字タイル: 各点の文字は座標から決定論的
        [K.ONE, '        function executeMove(move, player) {',
`        // 文字碁: 各交点のタイル文字 (座標から決定論的)
        function tileChar(x, y) {
            const s = Math.sin((x * 31 + y * 17) * 12.9898 + 78.233) * 43758.5453;
            const r = s - Math.floor(s);
            return 'アイウエオカキクケコサシスセソタチツテト'[Math.floor(r * 20)];
        }
        // 横方向の自石連の長さ (該当点を含む)
        function wordRun(x, y, player) {
            let len = 1, cx = x - 1;
            while (cx >= 0 && board[y * BOARD_SIZE + cx] === player) { len++; cx--; }
            cx = x + 1;
            while (cx < BOARD_SIZE && board[y * BOARD_SIZE + cx] === player) { len++; cx++; }
            return len;
        }

        function executeMove(move, player) {`],
        // 単語ボーナス: 横に3連以上を作ると連の長さ-2目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 単語ルール: 着手で横向きに3つ以上自石が連なると連の長さ-2目のボーナス
            {
                const p = move.cells[0];
                const len = wordRun(p.x, p.y, player);
                if (len >= Math.max(1, P('word_min') || 3)) {
                    captures[player] += len - (P('word_bonus') ?? 2);
                    const ci = p.y * BOARD_SIZE + p.x;
                    fxText(ci, '単語 +' + (len - (P('word_bonus') ?? 2)), '#f59e0b', 1200);
                    fxGlow(ci, '#fcd34d', 700);
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 石の上にタイル文字を描く
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.round(cellSize * 0.4) + 'px sans-serif';
                pieces.forEach(pc => {
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] !== pc.player) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.fillStyle = pc.player === 1 ? '#fef3c7' : '#1c1917';
                        ctx.fillText(tileChar(p.x, p.y), cx, cy + cellSize * 0.03);
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            文字碁: 石は文字タイル。横に3つ以上連なると連の長さ-2目のボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石は文字タイル (交点ごとに固有の文字が描かれる)。',
            '着手で横向きに自分の石が3つ以上連なると「単語」成立: 連の長さ-2目のボーナス。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof tileChar === 'function');
        assert('文字は定まる', tileChar(3, 3) === tileChar(3, 3));
        assert('文字は一覧のもの', 'アイウエオカキクケコサシスセソタチツテト'.includes(tileChar(3, 3)));
        board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 横3連
        assert('3連で+1', captures[1] === 1);
        board[6 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // 縦2連だけ → ボーナスなし
        assert('縦連はボーナスなし', captures[1] === 1);
    `,
};
