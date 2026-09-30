// HURDLEGO — 跳欄碁: 自石に接する点か、自石を1つ飛び越えた2マス先にしか置けない
const K = require('../gen_kit.js');
module.exports = {
    file: 'hurdlego.html',
    en: 'HURDLEGO',
    jp: '跳欄碁',
    prefix: 'hurdlego',
    desc: '着手は自石の隣か、自石を1つ飛び越えた直線2マス先のみ。打てる場所がなければ自由。',
    kind: 'stone',
    icon: 'hurdlego',
    spec: [
        ...K.rb('HURDLEGO', '跳欄碁', 'hurdlego'),
        [K.ONE, '        function executeMove(move, player) {',
`        // 跳欄: 自石の隣接点か、自石を1つ飛び越えた2マス先
        function hurdleSet(player) {
            let has = false;
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) if (board[i] === player) { has = true; break; }
            if (!has) return null;
            const ok = new Set();
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                if (board[i] !== player) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                getNeighbors(i).forEach(n => {
                    if (board[n] === 0) ok.add(n);
                });
                [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dy]) => {
                    const mx = x + dx / 2, my = y + dy / 2;
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
                    // 中間の石は何色でもよい (飛び越えるハードル)
                    const ni = ny * BOARD_SIZE + nx;
                    const mi = my * BOARD_SIZE + mx;
                    if (board[mi] !== 0 && board[ni] === 0) ok.add(ni);
                });
            }
            if (ok.size === 0) return null; // 打てる場所がなければ自由
            return ok;
        }

        function executeMove(move, player) {`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 跳欄ルール: 自石に接するか、自石を1つ飛び越えた2マス先のみ
            {
                const ok = hurdleSet(player);
                if (ok !== null) {
                    for (const p of cells) {
                        if (!ok.has(p.y * BOARD_SIZE + p.x)) return false;
                    }
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

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
        // 飛越先を淡く示す
        ...K.STONE_MARKS_SPEC(`            {
                const ok = hurdleSet(turn);
                if (ok) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
                    ok.forEach(i => {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            跳欄碁: 着手は自石の隣か、自石を1つ飛び越えた2マス先のみ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は自分の石に接する点か、自分の石を1つ飛び越えた直線2マス先の点に限られる。',
            '飛び越えるハードルの石は敵味方どちらでもよい。打てる場所がなければどこでも置ける。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof hurdleSet === 'function');
        assert('初手はどこでも', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
        board[5 * BOARD_SIZE + 5] = 1;
        assert('隣接は合法', isValidPlacement([{ x: 6, y: 5 }], 1) === true);
        assert('遠隔は違法', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        // 飛越: 中間に石があれば2マス先も合法
        board[5 * BOARD_SIZE + 6] = 2;
        assert('石を飛び越えて2マス先', isValidPlacement([{ x: 7, y: 5 }], 1) === true);
        // 中間が空なら飛越は不可
        board[5 * BOARD_SIZE + 6] = 0;
        assert('空は飛べない', isValidPlacement([{ x: 7, y: 5 }], 1) === false);
    `,
};
