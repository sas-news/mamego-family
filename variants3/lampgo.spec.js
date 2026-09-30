// LAMPGO — 燈火碁: 石は灯り。自分の灯り (石の周囲2マス) と中央の常夜灯の届く範囲だけ着手可
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'lampgo.html',
    en: 'LAMPGO',
    jp: '燈火碁',
    prefix: 'lampgo',
    desc: '灯りの届く範囲だけ着手可 — 自分の石の周囲2マスと中央の常夜灯の周り。',
    kind: 'stone',
    icon: 'lampgo',
    spec: [
        ...K.rb('LAMPGO', '燈火碁', 'lampgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 燈火: 中央の常夜灯と自分の石の周囲2マスが灯り
        const LAMP_C = Math.floor(BOARD_SIZE / 2);
        const LAMP_R = Math.max(2, Math.round(BOARD_SIZE * 0.23));
        function isLitFor(x, y, p) {
            if (Math.abs(x - LAMP_C) + Math.abs(y - LAMP_C) <= 0) return true;
            if (Math.max(Math.abs(x - LAMP_C), Math.abs(y - LAMP_C)) <= LAMP_R) return true;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                if (Math.max(Math.abs(dx), Math.abs(dy)) <= 2 && board[ny * BOARD_SIZE + nx] === p) return true;
            }
            return false;
        }`],
        // 灯りの届く範囲だけ着手可
        [K.ONE, K.VALID_BOUNDS, `            {
                const p0 = cells[0];
                if (p0.x < 0 || p0.x >= BOARD_SIZE || p0.y < 0 || p0.y >= BOARD_SIZE) return false;
                if (board[p0.y * BOARD_SIZE + p0.x] !== 0) return false;
                if (!isLitFor(p0.x, p0.y, player)) return false; // 闇には置けない
            }`],
        // 盤は夜: 自分の灯りの外は暗い
        K.CUE_GRID(`            // 闇: 手番の灯りが届かない場所を薄暗く
            {
                ctx.save();
                ctx.fillStyle = 'rgba(10, 12, 30, 0.34)';
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!isLitFor(x, y, turn)) {
                        ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                    }
                }
                ctx.restore();
            }`),
        K.CUE_STARS(`            // 中央の常夜灯
            {
                const cx = padding + LAMP_C * cellSize, cy = padding + LAMP_C * cellSize;
                ctx.save();
                const flick = 0.75 + Math.sin(fxNow() * 0.006) * 0.2;
                ctx.fillStyle = 'rgba(255, 190, 80, ' + (0.18 * flick) + ')';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * (LAMP_R + 0.6), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 200, 90, 0.95)';
                ctx.beginPath();
                ctx.arc(cx, cy - cellSize * 0.12, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(60, 40, 20, 0.9)';
                ctx.fillRect(cx - cellSize * 0.1, cy + cellSize * 0.04, cellSize * 0.2, cellSize * 0.22);
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_MIST('rgba(255, 190, 90, 0.05)')],
        [K.ONE, K.INFO_ALGO, `            燈火碁: 自分の石の周囲2マスと常夜灯の周りだけ着手可。闇には置けない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手できるのは灯りの届く範囲だけ: 中央の常夜灯の周囲と、自分の石の周囲2マス。',
            '石を進めるほど灯りも進む。相手の灯りの中にも侵入できる (灯りは自分の石依存)。',
            '取られると灯りが消える — 前線の石は灯りでもある。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = Math.floor(BOARD_SIZE / 2);
        assert('常夜灯の周りは灯り', isLitFor(c, c, 1) && isLitFor(c + 1, c, 1));
        assert('盤端の闇には置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('灯りの中には置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        board[I(0, 0)] = 1;
        assert('自分の石の周囲2マスは灯り', isLitFor(2, 0, 1));
        assert('灯りは2マスまで', !isLitFor(3, 0, 1));
        assert('敵の石は灯りにならない', !isLitFor(2, 0, 2));
    `,
};
