// DRAGON2GO — 竜巻碁: 15手ごとに竜巻が一段を横断し、通路上の石を全て吹き飛ばす
const K = require('../gen_kit.js');
module.exports = {
    file: 'dragon2go.html',
    en: 'DRAGON2GO',
    jp: '竜巻碁',
    prefix: 'dragon2go',
    desc: '15手ごとに竜巻が一段を横断。その段の石は色に関係なく全て吹き飛ばされる。',
    kind: 'stone',
    icon: 'dragon2go',
    spec: [
        ...K.rb('DRAGON2GO', '竜巻碁', 'dragon2go'),
        K.params([
            { key: 'tornado_interval', label: '竜巻の間隔', min: 5, max: 30, def: 15, unit: '手' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        // 竜巻: 15手ごとに一段の石を全て吹き飛ばす (アゲハマにはならない)
        [K.ONE, '        function executeMove(move, player) {',
`        // 竜巻の通路: 手数から決定論的に段を選ぶ
        function tornadoRow() {
            const n = Math.floor(history.length / (P('tornado_interval') || 15));
            const s = Math.sin(n * 157.3 + 23.7) * 43758.5453;
            return Math.floor((s - Math.floor(s)) * BOARD_SIZE);
        }

        function executeMove(move, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 竜巻ルール: 15手ごとに通路段の石を全て吹き飛ばす
            if (history.length % Math.max(1, P('tornado_interval') || 15) === 0) {
                const r = tornadoRow();
                let blew = 0;
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = r * BOARD_SIZE + x;
                    if (board[i] !== 0) {
                        board[i] = 0;
                        blew++;
                        fxBurst(i, '#cbd5e1', 6, 2.0);
                    }
                }
                cleanUpPieces();
                fxShake(7, 600);
                if (blew > 0) {
                    fxText(r * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '竜巻が' + blew + '石を吹き飛ばした', '#e2e8f0', 1500);
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
        // 次の竜巻の通路段を予告表示
        K.CUE_GRID(`            {
                const r = tornadoRow();
                ctx.save();
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.2]);
                ctx.strokeRect(
                    padding - cellSize / 2,
                    padding + r * cellSize - cellSize / 2,
                    BOARD_SIZE * cellSize,
                    cellSize
                );
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'竜巻 ' + ((P('tornado_interval') || 15) - history.length % (P('tornado_interval') || 15)) + '手後 ' + tornadoRow() + '段'`),
        [K.ONE, K.INFO_BASE, `            竜巻碁: 15手ごとに竜巻が点線の段を横断し、その段の石を全て吹き飛ばす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '15手ごとに竜巻が一段を横断し、通路上の石を色に関係なく全て吹き飛ばす (アゲハマにはならない)。',
            '次の通路は点線とチップで予告される。吹き飛ばされないように段を避けて打とう。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof tornadoRow === 'function');
        const r = tornadoRow();
        assert('段が決まる', r >= 0 && r < BOARD_SIZE);
        history.length = 15; // execute後に16手目になるので次の竜巻n=1の段
        const r2 = tornadoRow();
        history.length = 14;
        board[r2 * BOARD_SIZE + 2] = 1; board[r2 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 1, y: (r2 + 1) % BOARD_SIZE }] }, 1); // 15手目 → 竜巻
        assert('通路上の石が消える', board[r2 * BOARD_SIZE + 2] === 0);
        assert('白の石も消える', board[r2 * BOARD_SIZE + 5] === 0);
        assert('他の段は無事', board[(r2 + 1) % BOARD_SIZE * BOARD_SIZE + 1] === 1);
    `,
};
