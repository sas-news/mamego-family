// DICEGO — 賽碁: 手番ごとに出目が決まり、6は取り2倍・1は取り不可
const K = require('../gen_kit.js');
module.exports = {
    file: 'dicego.html',
    en: 'DICEGO',
    jp: '賽碁',
    prefix: 'dicego',
    desc: '手番ごとに賽が振られる。出目6は取り2倍、出目1は取り不可。',
    kind: 'dice',
    spec: [
        ...K.rb('DICEGO', '賽碁', 'dicego'),
        [K.ONE, '        function executeMove(move, player) {',
`        // 賽碁: 手数 mod 6 +1 がその手の出目 (6=取り2倍, 1=取り不可)
        function dieRoll(n) { return (n === undefined ? history.length : n) % 6 + 1; }

        function executeMove(move, player) {`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            const die = dieRoll();
            if (captured.length > 0 && die !== 1) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length * (die === 6 ? 2 : 1);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'出目 ' + dieRoll() + (dieRoll() === 6 ? ' (取り2倍!)' : dieRoll() === 1 ? ' (取り不可)' : '')`),
        K.CUE_STARS(`            // 出目6の手は盤に金の祝福、出目1は灰色の不運
            {
                const d = dieRoll();
                if (d === 6 || d === 1) {
                    const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                    ctx.save();
                    ctx.fillStyle = d === 6 ? 'rgba(250, 204, 21, 0.10)' : 'rgba(100, 116, 139, 0.14)';
                    ctx.fillRect(0, 0, w, w);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            賽碁: 手番ごとに出目1〜6が振られる。6は取り2倍、1は取り不可<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '手番ごとに賽が振られ出目が決まる (出目は手数で周期的に巡る)。',
            '出目6の手は取り点2倍、出目1の手はどんなに囲んでも取れない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('5手目の出目は6', dieRoll(5) === 6);
        assert('6手目の出目は1', dieRoll(6) === 1);
        assert('1手目の出目は2', dieRoll(1) === 2);
        // 出目6 (5手目) で取る → 2倍
        board[1 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 2] = 1;
        history.length = 4;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1); // history.length=5 → 出目6
        assert('出目6で2倍の取り', captures[1] === 2);
        // 出目1 (6手目) では取れない
        board[5 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 4] = 1; board[6 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1); // history.length=6 → 出目1
        assert('出目1では取れない', board[5 * BOARD_SIZE + 5] === 2 && captures[1] === 2);
    `,
};
