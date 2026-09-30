// MOATGO — 内堀碁: 城を取り巻く環状の内堀。堀に落ちた石は流されて水門から出ていく
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
    file: 'moatgo.html',
    en: 'MOATGO',
    jp: '内堀碁',
    prefix: 'moatgo',
    desc: '城を取り巻く内堀。堀に置いた石は流れに乗り、水門から流れ出る。',
    kind: 'stone',
    icon: 'moatgo',
    spec: [
        ...K.rb('MOATGO', '内堀碁', 'moatgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 内堀: 城郭の周りを時計回りに流れる環状の濠 (着手可)
        const MOAT_R = Math.max(2, Math.floor(BOARD_SIZE * 0.30));
        const MOAT_C = Math.floor(BOARD_SIZE / 2);
        const MOAT = [];
        for (let x = MOAT_C - MOAT_R; x <= MOAT_C + MOAT_R; x++) MOAT.push((MOAT_C - MOAT_R) * BOARD_SIZE + x);
        for (let y = MOAT_C - MOAT_R + 1; y <= MOAT_C + MOAT_R; y++) MOAT.push(y * BOARD_SIZE + MOAT_C + MOAT_R);
        for (let x = MOAT_C + MOAT_R - 1; x >= MOAT_C - MOAT_R; x--) MOAT.push((MOAT_C + MOAT_R) * BOARD_SIZE + x);
        for (let y = MOAT_C + MOAT_R - 1; y > MOAT_C - MOAT_R; y--) MOAT.push(y * BOARD_SIZE + MOAT_C - MOAT_R);
        const MOAT_SET = new Set(MOAT);`],
        // 毎手、堀の石は1マス流れる — 水門 (環の末尾) に達すると流出する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 内堀: 堀の石は毎手1マス下流へ。水門に達した石は流出する
            {
                let flowed = false;
                for (let k = MOAT.length - 1; k >= 0; k--) {
                    const i = MOAT[k];
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    if (k === MOAT.length - 1) {
                        board[i] = 0; // 水門から城外へ流出
                        fxSplash(i, '#38bdf8', 10);
                        flowed = true;
                    } else if (board[MOAT[k + 1]] === 0) {
                        board[MOAT[k + 1]] = v;
                        board[i] = 0;
                        fxSlide(i, MOAT[k + 1], 360);
                        flowed = true;
                    }
                }
                if (flowed) cleanUpPieces();
            }

            turn = opponent;`],
        // 堀と天守の描画
        K.CUE_GRID(`            // 内堀: 青い環状の水面と流れの矢印 + 中央の天守
            {
                ctx.save();
                MOAT_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(40, 130, 200, 0.30)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                const kx = padding + MOAT_C * cellSize, ky = padding + MOAT_C * cellSize;
                ctx.fillStyle = 'rgba(90, 66, 40, 0.35)';
                ctx.fillRect(kx - cellSize * 0.7, ky - cellSize * 0.7, cellSize * 1.4, cellSize * 1.4);
                ctx.fillStyle = 'rgba(70, 50, 30, 0.75)';
                ctx.beginPath();
                ctx.moveTo(kx - cellSize * 0.55, ky - cellSize * 0.2);
                ctx.lineTo(kx, ky - cellSize * 0.6);
                ctx.lineTo(kx + cellSize * 0.55, ky - cellSize * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.fillRect(kx - cellSize * 0.4, ky - cellSize * 0.2, cellSize * 0.8, cellSize * 0.6);
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            内堀碁: 城を取り巻く環状の堀。堀の石は流れて水門から出ていく<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央を環状の内堀が時計回りに流れる (着手可・呼吸も通常)。',
            '堀の中の石は毎手1マス下流へ流され、水門に達すると城外へ流出して失われる。',
            '堀は一時的な足場。城を囲う地取りと流れの読み合いが勝負。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('環状の堀がある', MOAT.length >= 8 && MOAT_SET.size === MOAT.length);
        assert('堀は着手できる', isValidPlacement([{ x: MOAT[0] % BOARD_SIZE, y: (MOAT[0] / BOARD_SIZE) | 0 }], 1) === true);
        // 水門の石は流出する
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const last = MOAT[MOAT.length - 1];
        board[last] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('水門の石は流出', board[last] === 0);
        // 堀の石は1マス流れる
        board.fill(0); history.length = 0;
        board[MOAT[0]] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('堀の石は下流へ流れる', board[MOAT[1]] === 1 && board[MOAT[0]] === 0);
    `,
};
