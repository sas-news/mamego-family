// NUMBGO — 数読碁: 全ての石の連の呼吸点数が石の上に数字で表示される
const K = require('../gen_kit.js');
module.exports = {
    file: 'numbgo.html',
    en: 'NUMBGO',
    jp: '数読碁',
    prefix: 'numbgo',
    desc: '全ての連の呼吸点数が見える。アタリはもう見逃さない。',
    kind: 'number',
    spec: [
        ...K.rb('NUMBGO', '数読碁', 'numbgo'),
        ...K.STONE_MARKS_SPEC(`            // 各連の呼吸点数を石の上に数字で表示 (同色連は同じ数)
            {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(9, cellSize * 0.42) + 'px sans-serif';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const libs = getLiberties(board, i);
                    // 呼吸1は警告色で強調
                    ctx.fillStyle = libs <= 1 ? '#ef4444' : (v === 1 ? '#ffffff' : '#111827');
                    ctx.fillText(String(libs), cx, cy);
                    // 呼吸1は赤い警告リングでも強調
                    if (libs <= 1) {
                        ctx.strokeStyle = 'rgba(239,68,68,' + (0.55 + 0.3 * Math.sin(fxNow() / 280)) + ')';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            数読碁: 全ての石の連の呼吸点数が石の上に表示される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '全ての石に、その連の呼吸点数が数字で表示される (同色の連は同じ数)。',
            '呼吸1の連は赤く警告される。アタリ・取り掛けの読み違いがなくなる計算補助碁。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[4 * BOARD_SIZE + 4] = 1;
        assert('単石の呼吸は4', getLiberties(board, 4 * BOARD_SIZE + 4) === 4);
        board[4 * BOARD_SIZE + 5] = 1;
        assert('2連の呼吸は6', getLiberties(board, 4 * BOARD_SIZE + 4) === 6);
        assert('連の端からでも同じ呼吸数', getLiberties(board, 4 * BOARD_SIZE + 5) === 6);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
