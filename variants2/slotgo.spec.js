// SLOTGO — 遊技碁: 着手ごとにスロットが回り、7手目はBAR(取り3倍)・3の倍数はCHERRY(取り2倍)
const K = require('../gen_kit.js');
module.exports = {
    file: 'slotgo.html',
    en: 'SLOTGO',
    jp: '遊技碁',
    prefix: 'slotgo',
    desc: '着手ごとにスロット。7手目はBARで取り3倍、3の倍数はCHERRYで2倍。',
    kind: 'slot',
    spec: [
        ...K.rb('SLOTGO', '遊技碁', 'slotgo'),
        [K.ONE, '        function executeMove(move, player) {',
`        // 遊技碁: 手数でスロットの役が決まる (7の倍数=BAR x3, 3の倍数=CHERRY x2, 他=ハズレ x1)
        function slotOf(n) {
            const m = n === undefined ? history.length : n;
            return m % 7 === 0 ? { name: 'BAR', mult: 3 } : m % 3 === 0 ? { name: 'CHERRY', mult: 2 } : { name: 'ハズレ', mult: 1 };
        }

        function executeMove(move, player) {`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                const slot = slotOf();
                captures[player] += captured.length * slot.mult;
                // 役が揃った取り: 役名と倍率がネオンに光る
                if (slot.mult > 1) {
                    const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    const col = slot.mult === 3 ? '#facc15' : '#f472b6';
                    captured.forEach(idx => fxGlow(idx, col, 800));
                    fxShake(4, 260);
                    fxText(ci, slot.name + ' ×' + slot.mult + '!', col, 1300);
                }
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'スロット: ' + slotOf().name + (slotOf().mult > 1 ? ' x' + slotOf().mult : '')`),
        K.CUE_STARS(`            // 役が揃う手は盤をネオンで照らす
            {
                const s = slotOf();
                if (s.mult > 1) {
                    const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                    ctx.save();
                    ctx.fillStyle = s.mult === 3 ? 'rgba(250, 204, 21, 0.12)' : 'rgba(244, 114, 182, 0.10)';
                    ctx.fillRect(0, 0, w, w);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            遊技碁: 着手ごとにスロットが回る。7手目はBAR(3倍)、3の倍数はCHERRY(2倍)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各着手でスロットの役が決まる: 7の倍数手はBARで取り点3倍、3の倍数手はCHERRYで2倍。',
            'ハズレ手は通常の1倍 — 大きな取りを役の手に合わせて放つのがコツ。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('7手目はBAR x3', slotOf(7).mult === 3);
        assert('3手目はCHERRY x2', slotOf(3).mult === 2);
        assert('1手目はハズレ x1', slotOf(1).mult === 1);
        board[1 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 2] = 1;
        history.length = 6;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1); // history.length=7 → BAR
        assert('BARで3倍の取り', captures[1] === 3);
    `,
};
