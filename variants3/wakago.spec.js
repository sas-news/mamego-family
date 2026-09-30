// WAKAGO — 和歌碁: 2点空けて同じ色が向かい合えば歌が結ばれる。終局時に結ばれた句1つ+1目
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
    file: 'wakago.html',
    en: 'WAKAGO',
    jp: '和歌碁',
    prefix: 'wakago',
    desc: '句は石、結びは間。2点空けて同色が向かい合えば歌が結ばれ+1目。',
    kind: 'stone',
    icon: 'wakago',
    spec: [
        ...K.rb('WAKAGO', '和歌碁', 'wakago'),
        // 結び集計: (x,y) と (x+3,y) / (x,y+3) が同色で間の2点が空なら+1目
        [K.ONE, `        function endGameByScore() {`, `        // 歌の結び: 2点空けて向かい合う同色の句を数える (各向き1回ずつ)
        function wakaBonus() {
            const b = { 1: 0, 2: 0 };
            for (let y = 0; y < BOARD_SIZE; y++)
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    // 右に2点空け (x+3)
                    if (x + 3 < BOARD_SIZE &&
                        board[i + 1] === 0 && board[i + 2] === 0 && board[i + 3] === v)
                        b[v]++;
                    // 下に2点空け (y+3)
                    if (y + 3 < BOARD_SIZE &&
                        board[i + BOARD_SIZE] === 0 && board[i + 2 * BOARD_SIZE] === 0 &&
                        board[i + 3 * BOARD_SIZE] === v)
                        b[v]++;
                }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 和歌ルール: 結ばれた句は+1目
            {
                const wb = wakaBonus();
                territory.black += wb[1];
                territory.white += wb[2];
            }`],
        // 結ばれた句を短冊の線で示す
        ...K.STONE_MARKS_SPEC(`            // 結ばれた句: 2点を跨ぐ短冊の線
            {
                ctx.save();
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.lineCap = 'round';
                for (let y = 0; y < BOARD_SIZE; y++)
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x;
                        const v = board[i];
                        if (v !== 1 && v !== 2) continue;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.strokeStyle = v === 1 ? 'rgba(244, 114, 182, 0.9)' : 'rgba(190, 24, 93, 0.8)';
                        if (x + 3 < BOARD_SIZE && board[i + 1] === 0 && board[i + 2] === 0 && board[i + 3] === v) {
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(cx + cellSize * 3, cy);
                            ctx.stroke();
                        }
                        if (y + 3 < BOARD_SIZE && board[i + BOARD_SIZE] === 0 && board[i + 2 * BOARD_SIZE] === 0 && board[i + 3 * BOARD_SIZE] === v) {
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(cx, cy + cellSize * 3);
                            ctx.stroke();
                        }
                    }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'結び ' + (() => { const b = typeof wakaBonus === 'function' ? wakaBonus() : { 1: 0, 2: 0 }; return '黒' + b[1] + ' 白' + b[2]; })()`),
        [K.ONE, K.INFO_ALGO, `            和歌碁: 2点空けて同色が向かい合えば歌が結ばれ、終局時に1結び+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '上の句と下の句: 同じ色の石が縦か横にちょうど2点空けて向かい合うと歌が結ばれ、終局時+1目。',
            '間に石を置かれると歌は破れる。結びを積むか、地に勢いを留めるか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        board[I(2, 5)] = 1; board[I(5, 5)] = 1; // 2点空けて向かい合う
        assert('向かい合う句は結ばれる', wakaBonus()[1] === 1);
        board[I(3, 5)] = 2; // 間に敵石
        assert('間に石があれば結ばれない', wakaBonus()[1] === 0);
        board.fill(0); pieces = []; history.length = 0;
        board[I(1, 1)] = 2; board[I(1, 2)] = 2; // 連続は間が空でない
        board[I(1, 4)] = 2;
        assert('間が空いていなければ結ばれない', wakaBonus()[2] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
