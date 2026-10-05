// FORMULARYGO — 処方碁: 黒の処方は横3連、白は縦3連。完成すると隣接する敵石を最大2個「治す」
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'formularygo.html',
    en: 'FORMULARYGO',
    jp: '処方碁',
    prefix: 'formularygo',
    desc: '黒の処方=横3連、白の処方=縦3連。完成で隣接する敵石を最大2個除去。',
    kind: 'stone',
    icon: 'formularygo',
    spec: [
        ...K.rb('FORMULARYGO', '処方碁', 'formularygo'),
        K.params([
            { key: 'run_need', label: '解毒に必要な連の長さ', min: 2, max: 6, def: 3, unit: '連' },
            { key: 'cure_max', label: '一度に解毒できる数', min: 1, max: 8, def: 2, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        // 処方完成: 着手した石を通る処方方向 (黒=横, 白=縦) の3連以上で、隣接する敵石を治療除去
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 処方碁: 自分の処方方向 (黒=横, 白=縦) の直線3連以上が完成すると発動
            {
                const dir = player === 1 ? [1, 0] : [0, 1]; // 黒=横の処方 / 白=縦の処方
                const perp = [dir[1], dir[0]];
                const c0 = move.cells[0];
                const at = (x, y) => (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) ? -1 : y * BOARD_SIZE + x;
                const run = [c0];
                for (const s of [1, -1]) {
                    let nx = c0.x + dir[0] * s, ny = c0.y + dir[1] * s;
                    while (at(nx, ny) >= 0 && board[at(nx, ny)] === player) {
                        run.push({ x: nx, y: ny });
                        nx += dir[0] * s; ny += dir[1] * s;
                    }
                }
                if (run.length >= (P('run_need') || 3)) {
                    const cured = [];
                    for (const r of run) {
                        for (const s of [1, -1]) {
                            const ni = at(r.x + perp[0] * s, r.y + perp[1] * s);
                            if (ni >= 0 && board[ni] === opponent && !cured.includes(ni)) cured.push(ni);
                        }
                    }
                    cured.slice(0, P('cure_max') || 2).forEach(ni => {
                        board[ni] = 0;
                        captures[player]++;
                        fxBurst(ni, '#34d399', 10, 1.5);
                        fxText(ni, '治癒', '#34d399', 1000);
                    });
                    if (cured.length) {
                        fxText(c0.y * BOARD_SIZE + c0.x, '処方完了', '#059669', 1200);
                        fxShake(3, 240);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 処方方向の帯描画: 黒は横罫線、白は縦罫線が常に薄く
        K.CUE_GRID(`            // 処方箋の罫線: 盤を薄い横罫で覆う (黒の処方を暗示)
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(5,150,105,0.16)';
                ctx.lineWidth = Math.max(1, cellSize * 0.06);
                for (let y = 0; y < BOARD_SIZE; y += 2) {
                    const cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(padding - cellSize * 0.4, cy);
                    ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.4, cy);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            処方碁: 黒の処方=横3連、白の処方=縦3連。完成すると連に隣接する敵石を最大2個除去<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '黒の処方箋は「横一列3連」、白の処方箋は「縦一列3連」。',
            '自分の着手で処方が完成すると、その連に直角に隣接する敵石を最大2個「治癒」= アゲハマにする。',
            '通常の囲碁の取りに加えて発動する。相手の処方形を作らせない布石が要。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒の横3連を完成させ、上下の敵石が治癒される
        board[I(2, 3)] = 1; board[I(3, 3)] = 1;
        board[I(3, 2)] = 2; board[I(3, 4)] = 2; // 完成予定の横連の上下に白石
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 横 (2,3)(3,3)(4,3) 完成
        assert('処方完成で敵石除去', board[I(3, 2)] === 0 && board[I(3, 4)] === 0);
        assert('治癒はアゲハマに', captures[1] === 2);
        // 白は縦3連: 縦の隣(横方向)の敵を治癒
        board.fill(0); pieces = []; history.length = 0; captures = { 1: 0, 2: 0 };
        board[I(6, 5)] = 2; board[I(6, 6)] = 2;
        board[I(5, 6)] = 1; board[I(7, 6)] = 1;
        executeMove({ cells: [{ x: 6, y: 7 }] }, 2); // 縦 (6,5)(6,6)(6,7) 完成
        assert('白の縦処方で敵石除去', board[I(5, 6)] === 0 && board[I(7, 6)] === 0);
        assert('白の治癒もアゲハマ', captures[2] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
