// PINOGO — 擲碁: 三角形に並んだピンを、打った石の隣から倒して得点化
const K = require('../gen_kit.js');
module.exports = {
    file: 'pinogo.html',
    en: 'PINOGO',
    jp: '擲碁',
    prefix: 'pinogo',
    desc: '盤中央に10本のピン。石を隣に置いて倒せば1本1点。障害物にもなる。',
    kind: 'stone',
    spec: [
        ...K.rb('PINOGO', '擲碁', 'pinogo'),
        K.params([{ key: 'pin_rows', label: 'ピンの段数', min: 2, max: 6, def: 4, unit: '段' }, { key: 'pin_pts', label: 'ピン1本の得点', min: 1, max: 5, def: 1, unit: '点' }]),
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 擲碁: 盤の中央寄りに10本のピンを三角形に立てる
            {
                const pc = Math.floor(BOARD_SIZE / 2);
                const pins = [];
                const _pr = Math.max(1, P('pin_rows') || 4);
                for (let r = 1; r <= _pr; r++) for (let k = 0; k < r; k++) pins.push([pc - (r - 1) + 2 * k, r]);
                pins.forEach(([px, py]) => {
                    if (px >= 0 && px < BOARD_SIZE && py < BOARD_SIZE) board[py * BOARD_SIZE + px] = 3;
                });
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 擲碁: 打った石に隣接するピンは倒れ、1本1点になる
            move.cells.forEach(p => {
                getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                    if (board[n] === 3) {
                        board[n] = 0; captures[player] += (P('pin_pts') || 1);
                        // ピンが弾け倒れて得点になる
                        fxBurst(n, '#f2f0e4', 10, 1.6);
                        fxGlow(n, '#fca5a5', 700);
                        fxText(n, '+1', '#facc15', 1000);
                        fxShake(3, 200);
                    }
                });
            });

            turn = opponent;`],
        ...K.WALL_SPEC,
        // ピン描画 (白いピン形)
        ...K.STONE_MARKS_SPEC(`            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 3) continue;
                const px = i % BOARD_SIZE, py = Math.floor(i / BOARD_SIZE);
                const cx = padding + px * cellSize, cy = padding + py * cellSize;
                ctx.save();
                ctx.fillStyle = '#f2f0e4';
                ctx.beginPath();
                ctx.arc(cx, cy - cellSize * 0.13, cellSize * 0.15, 0, Math.PI * 2);
                ctx.arc(cx, cy + cellSize * 0.13, cellSize * 0.21, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#c03a3a';
                ctx.fillRect(cx - cellSize * 0.11, cy - cellSize * 0.09, cellSize * 0.22, cellSize * 0.07);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            擲碁: ピンを石の隣に置いて倒す。1本1点のボウリング碁<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央に10本のピンが三角形に立つ。ピンのマスには石を置けない障害物。',
            '打った石の隣にあるピンは倒れ、倒した側のアゲハマ得点になる。',
            'ピンを壁として活かすか、得点に変えるか — 通常の地取り勝負も残る。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[7] = 3;
        executeMove({ cells: [{ x: 6, y: 0 }] }, 1);
        assert('ピンが倒れる', board[7] === 0);
        assert('ピンは得点になる', captures[1] === 1);
        resetGame();
        assert('対局開始にピンが立つ', board.filter(v => v === 3).length === 10);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
