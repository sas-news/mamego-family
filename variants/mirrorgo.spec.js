// MIRRORGO — 鏡面碁: 一手置くと左右対称の鏡像位置にも自動的に同じ石が置かれる
const K = require('../gen_kit.js');
module.exports = {
    file: 'mirrorgo.html',
    en: 'MIRRORGO',
    jp: '鏡面碁',
    prefix: 'mirrorgo',
    desc: '一手置くと左右対称の鏡像位置にも自動で石が生まれる。中央軸は映らない。',
    kind: 'stone',
    icon: 'mirrorgo',
    spec: [
        ...K.rb('MIRRORGO', '鏡面碁', 'mirrorgo'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 着手時: 鏡像位置にも自動配置
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 鏡面: 左右対称位置にも同じ石を置く
            move.cells.forEach(p => {
                const mx = BOARD_SIZE - 1 - p.x;
                const mi = p.y * BOARD_SIZE + mx;
                if (mx !== p.x && board[mi] === 0) {
                    board[mi] = player;
                    pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: [{ x: mx, y: p.y }] });
                    fxSlide(p.y * BOARD_SIZE + p.x, mi, 380);
                    fxGlow(mi, '#e879f9', 500);
                }
            });`],
        // 鏡像が自爆した場合は消える (アゲハマにならない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            const echoed = getCapturedStones(board, player);
            if (echoed.length > 0) {
                echoed.forEach(i => { board[i] = 0; fxBurst(i, '#e879f9', 6); });
                cleanUpPieces();
            }
            turn = opponent;`],
        // 中央軸の描画
        ...K.STONE_MARKS_SPEC(`            {
                const cx = padding + (BOARD_SIZE - 1) / 2 * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(232,121,249,0.5)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.22]);
                ctx.beginPath();
                ctx.moveTo(cx, padding - cellSize * 1.5);
                ctx.lineTo(cx, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 1.5);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            鏡面碁: 一手置くと左右対称の鏡像位置にも自動で石が生まれる (点線が鏡軸)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を置くと中央の鏡軸 (紫点線) に対称な位置にも自動で石が置かれる。',
            '鏡像が取り囲まれて死ぬとアゲハマにならず消えるだけ。中央軸上の着手は映らない。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = [];
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        assert('鏡像が置かれる', board[I(BOARD_SIZE - 1 - 2, 3)] === 1);
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: 0 }] }, 2);
        assert('端の鏡像は端に出る', board[I(0, 0)] === 2);
        executeMove({ cells: [{ x: (BOARD_SIZE - 1) / 2, y: 5 }] }, 1);
        assert('中央軸は映らない', board[I((BOARD_SIZE - 1) / 2, 5)] === 1 && pieces.filter(pc => pc.player === 1).length === 3);
    `,
};
