// SUNFLOWERGO — 向日葵碁: 太陽の方角は8手ごとに回る。向いている先が空か味方なら日向で終局時+1目
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sunflowergo.html',
    en: 'SUNFLOWERGO',
    jp: '向日葵碁',
    prefix: 'sunflowergo',
    desc: '太陽の方角は8手ごとに北→東→南→西と回る。向いた先が空か味方の石は日向となり終局時+1目。',
    kind: 'stone',
    icon: 'sunflowergo',
    spec: [
        ...K.rb('SUNFLOWERGO', '向日葵碁', 'sunflowergo'),
        // 日向判定: 太陽方向の隣が空点か味方 → その石は日向 (+1目)
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            {
                const SDIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const sd = SDIRS[Math.floor(history.length / 8) % 4];
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const nx = x + sd[0], ny = y + sd[1];
                    const lit = nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE ||
                        board[ny * BOARD_SIZE + nx] === 0 || board[ny * BOARD_SIZE + nx] === board[i];
                    if (!lit) continue;
                    if (board[i] === 1) territory.black += 1;
                    else territory.white += 1;
                }
            }`],
        // 日向の石は橙の花冠。盤上に太陽の方角を表示
        ...K.STONE_MARKS_SPEC(`            // 向日葵: 太陽の方角に向く石に橙の花冠
            {
                const SDIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const sd = SDIRS[Math.floor(history.length / 8) % 4];
                ctx.save();
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const nx = x + sd[0], ny = y + sd[1];
                    const lit = nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE ||
                        board[ny * BOARD_SIZE + nx] === 0 || board[ny * BOARD_SIZE + nx] === board[i];
                    if (!lit) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(251,146,60,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(253,224,71,0.9)';
                    ctx.beginPath();
                    ctx.arc(cx + sd[0] * cellSize * 0.32, cy + sd[1] * cellSize * 0.32, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC('"太陽 " + ["北","東","南","西"][Math.floor(history.length / 8) % 4]'),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            向日葵碁: 太陽の方角は8手ごとに回る。向いた先が空か味方なら日向 — 終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '太陽の方角は8手ごとに北→東→南→西と時計回りに回る。',
            '石の太陽方向の隣点が空・盤外・味方ならその石は「日向」 — 終局時1個につき+1目。',
            '敵石に背を向けられた石は日陰。方向の読み合い。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('石が置かれる', board[I(4, 4)] === 1 && board[I(9, 9)] === 2);
        assert('太陽方向の隣も置ける', isValidPlacement([{ x: 4, y: 3 }], 1) === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        assert('2連目も置ける', isValidPlacement([{ x: 5, y: 4 }], 1) === true);
    `,
};
