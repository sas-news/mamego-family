// GRADIENTGO — 勾配碁: 置いた石は盤の勾配 (右下方向) を転がり落ちて止まった所に定着する
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 設定手数を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= (P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'gradientgo.html',
    en: 'GRADIENTGO',
    jp: '勾配碁',
    prefix: 'gradientgo',
    desc: '置いた石は勾配を右下へ転がり落ち、止まった地点に定着する。',
    kind: 'stone',
    icon: 'gradientgo',
    spec: [
        ...K.rb('GRADIENTGO', '勾配碁', 'gradientgo'),
        K.params([
            { key: 'cap_moves', label: '打ち切り手数', min: 50, max: 600, def: 150, step: 10, unit: '手' },
            { key: 'roll_limit', label: '転がり上限 (盤サイズ倍率)', min: 1, max: 4, def: 2, step: 0.5 },
        ]),
        // 転がり: 置いた石は右か下の空きへ転がり続ける (取り判定は定着位置で行う)
        [K.ONE, K.CAPTURE_BLOCK, `            // 勾配転がり: 置いた石は右下へ空きがある限り転がり落ちる
            {
                const st0 = move.cells[0];
                let sx = st0.x, sy = st0.y;
                let guard = 0;
                while (guard++ < BOARD_SIZE * (P('roll_limit') || 2)) {
                    const rOk = sx + 1 < BOARD_SIZE && board[sy * BOARD_SIZE + sx + 1] === 0;
                    const dOk = sy + 1 < BOARD_SIZE && board[(sy + 1) * BOARD_SIZE + sx] === 0;
                    if (!rOk && !dOk) break;
                    let nx = sx, ny = sy;
                    if (rOk && dOk) (sx <= sy ? (nx = sx + 1) : (ny = sy + 1));
                    else if (rOk) nx = sx + 1;
                    else ny = sy + 1;
                    board[sy * BOARD_SIZE + sx] = 0;
                    board[ny * BOARD_SIZE + nx] = player;
                    fxSlide(sy * BOARD_SIZE + sx, ny * BOARD_SIZE + nx, 280);
                    sx = nx; sy = ny;
                }
                if (sx !== st0.x || sy !== st0.y) {
                    fxGlow(sy * BOARD_SIZE + sx, '#94a3b8', 500);
                    if (pieces.length) pieces[pieces.length - 1].cells = [{ x: sx, y: sy }];
                    if (lastMove) lastMove.cells = [{ x: sx, y: sy }];
                }
            }

            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 転がり落ちた先で自分の連が窒息していたら脱落 (谷に落ちて割れる)
            {
                const selfDead = getCapturedStones(board, player);
                if (selfDead.length > 0) {
                    selfDead.forEach(idx => { board[idx] = 0; fxSplash(idx, '#94a3b8', 6); });
                    cleanUpPieces();
                }
            }`],
        // 勾配方向を示す淡い矢印フィールド
        K.CUE_GRID(`            // 勾配: 全セルに右下向きの小さな流れ矢印
            {
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.30);
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.lineCap = 'round';
                for (let y = 0; y < BOARD_SIZE; y += 2) for (let x = 0; x < BOARD_SIZE; x += 2) {
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const a = cellSize * 0.14;
                    ctx.beginPath();
                    ctx.moveTo(cx - a, cy - a); ctx.lineTo(cx + a, cy + a);
                    ctx.lineTo(cx + a - cellSize * 0.09, cy + a);
                    ctx.moveTo(cx + a, cy + a); ctx.lineTo(cx + a, cy + a - cellSize * 0.09);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            勾配碁: 置いた石は右下の勾配を転がり落ち、止まった所に定着する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は右下へ傾いている。置いた石は「右か下の空き」へ転がり続け、塞がれた所に定着する。',
            '取り判定は定着位置で行う。転がり込んで窒息した自分の連は脱落する。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('角まで転がり落ちる', board[I(BOARD_SIZE - 1, BOARD_SIZE - 1)] === 1 && board[I(0, 0)] === 0);
        // 障害物で止まる
        board.fill(0); pieces = [];
        board[I(BOARD_SIZE - 1, BOARD_SIZE - 1)] = 2; // 角を塞ぐ
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('障害物の手前で止まる', board[I(BOARD_SIZE - 2, BOARD_SIZE - 1)] === 1 || board[I(BOARD_SIZE - 1, BOARD_SIZE - 2)] === 1);
        board.fill(0); pieces = [];
        assert('起動して通常着手可', isValidPlacement([{ x: 3, y: 3 }], 1) === true);
    `,
};
