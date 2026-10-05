// PACGO — 喰碁: 中立のパックマンが盤を巡回し、止まった点の石を食べる
const K = require('../gen_kit.js');
module.exports = {
    file: 'pacgo.html',
    en: 'PACGO',
    jp: '喰碁',
    prefix: 'pacgo',
    desc: '中立パックマンが斜め巡回。止まった点の石は色問わず食べられる。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('PACGO', '喰碁', 'pacgo'),
        K.params([
            { key: 'stride_off', label: 'パックマンの歩幅オフセット', min: 1, max: 5, def: 2 },
        ]),
        [K.ONE, K.BOARD_DECL, `        let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); // 0:空, 1:黒, 2:白
        let pacPos = 0; // パックマンの現在位置 (idx)`],
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            pacPos = 0;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 喰碁: パックマンが斜めに巡回し、止まった点の石を色問わず食べる
            {
                const prev = pacPos;
                pacPos = (pacPos + BOARD_SIZE + Math.max(1, P('stride_off') || 2)) % board.length;
                fxSlide(prev, pacPos, 360); // ワカワカ進む経路
                if (board[pacPos] === 1 || board[pacPos] === 2) {
                    fxBurst(pacPos, '#ffd23f', 10, 1.5);
                    fxText(pacPos, 'パクッ!', '#ffd23f', 1000);
                    board[pacPos] = 0;
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // パックマン描画
        ...K.STONE_MARKS_SPEC(`            {
                const px = pacPos % BOARD_SIZE, py = Math.floor(pacPos / BOARD_SIZE);
                const cx = padding + px * cellSize, cy = padding + py * cellSize;
                ctx.save();
                ctx.fillStyle = '#ffd23f';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.32, 0.45, Math.PI * 2 - 0.45);
                ctx.lineTo(cx, cy);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#9a7600';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            喰碁: 中立パックマンが盤を巡回し、止まった点の石を食べる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '毎手番、中立のパックマンが斜め方向に1区画進む (盤全体を巡回)。',
            'パックマンが止まった点に石があれば、色に関係なく食べられる (得点にもならない)。',
            '巡回路を読んで石を避けるか、わざと食べさせるかも戦略になる。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        pacPos = 0;
        const landing = (pacPos + BOARD_SIZE + 2) % board.length;
        board[landing] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('パックマンが石を食べる', board[landing] === 0);
        assert('他の石は残る', board[0] === 1);
        board.fill(0); pieces = [];
        const before = pacPos;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('空き地でも巡回する', pacPos === (before + BOARD_SIZE + 2) % board.length);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
