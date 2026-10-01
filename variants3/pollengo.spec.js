// POLLENGO — 花粉碁: 打った石から風下に花粉が飛び、受粉マス (空き) に芽が出る
const K = require('../gen_kit.js');
module.exports = {
    file: 'pollengo.html',
    en: 'POLLENGO',
    jp: '花粉碁',
    prefix: 'pollengo',
    desc: '風は一定方向に吹き、打った石から花粉が2マス飛ぶ。空きマスならそこに自分の石が芽吹く。',
    kind: 'stone',
    icon: 'pollengo',
    spec: [
        ...K.rb('POLLENGO', '花粉碁', 'pollengo'),
        K.params([{ key: 'wind_turn', label: '風向きの変わる間隔', min: 2, max: 20, def: 8, unit: '手' }, { key: 'fly_dist', label: '花粉の飛距離', min: 1, max: 4, def: 2, unit: 'マス' }, { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 300, def: 140, unit: '手' }]),
        // 風向き: 手数で巡回 (東→南→西→北)
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function windDir() {
            return [[1, 0], [0, 1], [-1, 0], [0, -1]][Math.floor(history.length / Math.max(1, P('wind_turn') || 8)) % 4];
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 花粉散布: 打った石から風下2マスに花粉が飛び、空きマスなら芽吹く
            {
                const [wdx, wdy] = windDir();
                const last = move.cells[0];
                const _fd = Math.max(1, P('fly_dist') || 2), tx = last.x + wdx * _fd, ty = last.y + wdy * _fd;
                if (tx >= 0 && ty >= 0 && tx < BOARD_SIZE && ty < BOARD_SIZE) {
                    const ti = ty * BOARD_SIZE + tx;
                    if (board[ti] === 0) {
                        board[ti] = player;
                        fxSlide(last.y * BOARD_SIZE + last.x, ti, 400);
                        fxBurst(ti, '#fbcfe8', 8, 1.4);
                        fxText(ti, '受粉', '#fbcfe8', 900);
                        cleanUpPieces();
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= (P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 風向きの矢印を盤端に描く
        K.CUE_STARS(`            // 風向き: 盤上端中央に矢羽根
            {
                const [wdx, wdy] = windDir();
                const cx = padding + BOARD_SIZE * cellSize / 2, cy = padding - cellSize * 0.4;
                ctx.save();
                ctx.strokeStyle = 'rgba(244,114,182,0.9)';
                ctx.fillStyle = 'rgba(244,114,182,0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                const len = cellSize * 0.5;
                const ex = cx + wdx * len, ey = cy + wdy * len;
                ctx.beginPath();
                ctx.moveTo(cx - wdx * len * 0.5, cy - wdy * len * 0.5);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                const ang = Math.atan2(wdy, wdx);
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex - Math.cos(ang - 0.5) * len * 0.4, ey - Math.sin(ang - 0.5) * len * 0.4);
                ctx.lineTo(ex - Math.cos(ang + 0.5) * len * 0.4, ey - Math.sin(ang + 0.5) * len * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'風' + ['→','↓','←','↑'][Math.floor(history.length / Math.max(1, P('wind_turn') || 8)) % 4]`),
        [K.ONE, K.INFO_ALGO, `            花粉碁: 風下2マスに花粉が飛び、空きマスに自分の石が芽吹く<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上には風が吹き、8手ごとに向きが変わる (上端の矢羽根を見よ)。打った石から風下ちょうど2マスに花粉が飛び、空きマスならそこにもう1つ自分の石が芽吹く。',
            '花粉石は普通の石と同じく取られる。風を読んで布石を広げよう。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('初手の風は東', JSON.stringify(windDir()) === '[1,0]');
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('風下2マスに芽吹く', board[4 * BOARD_SIZE + 6] === 1);
        // 風が変わると方向も変わる
        for (let i = 0; i < 8; i++) history.push({ turn: 1 });
        assert('8手後は南風', JSON.stringify(windDir()) === '[0,1]');
        executeMove({ cells: [{ x: 4, y: 7 }] }, 1);
        assert('南へ芽吹く', board[9 * BOARD_SIZE + 4] === 1);
        // 花粉の着地点が塞がっていれば芽吹かない
        board.fill(0); history.length = 0;
        board[4 * BOARD_SIZE + 6] = 2;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('塞がっていれば芽吹かない', board[4 * BOARD_SIZE + 6] === 2);
    `,
};
