// MITATEGO — 見立碁: 石のL字の曲がりを名物に見立てる。終局時に角の連結1箇所+1目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mitatego.html',
    en: 'MITATEGO',
    jp: '見立碁',
    prefix: 'mitatego',
    desc: '石が曲がってL字を成せば名物の見立て。終局時に角の連結1箇所+1目。',
    kind: 'stone',
    icon: 'mitatego',
    spec: [
        ...K.rb('MITATEGO', '見立碁', 'mitatego'),
        K.params([
            { key: 'corner_pts', label: '曲がり角1箇所の得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 見立て集計: 縦横両方向に同色と繋がる石 (曲がり角) は+1目
        [K.ONE, `        function endGameByScore() {`, `        // 見立て: 曲がり角の石を数える
        function mitateBonus() {
            const b = { 1: 0, 2: 0 };
            const same = (i, j) => j >= 0 && j < board.length && board[j] !== 0 && board[j] === board[i];
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if (v !== 1 && v !== 2) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const hasH = (x > 0 && same(i, i - 1)) || (x < BOARD_SIZE - 1 && same(i, i + 1));
                const hasV = (y > 0 && same(i, i - BOARD_SIZE)) || (y < BOARD_SIZE - 1 && same(i, i + BOARD_SIZE));
                // 縦と横の両方向に同色がいればL字の曲がり角
                if (hasH && hasV) b[v] += (P('corner_pts') ?? 1);
            }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 見立てルール: L字の曲がり角の石は+1目
            {
                const mb = mitateBonus();
                territory.black += mb[1];
                territory.white += mb[2];
            }`],
        // 曲がり角に薄い印
        ...K.STONE_MARKS_SPEC(`            // 見立ての曲がり角: 石の上に小さな◺印
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    const v = board[i];
                    if (v !== 1 && v !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const same = (j) => j >= 0 && j < board.length && board[j] === v;
                    const hasH = (x > 0 && same(i - 1)) || (x < BOARD_SIZE - 1 && same(i + 1));
                    const hasV = (y > 0 && same(i - BOARD_SIZE)) || (y < BOARD_SIZE - 1 && same(i + BOARD_SIZE));
                    if (!hasH || !hasV) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = v === 1 ? 'rgba(253, 224, 71, 0.9)' : 'rgba(180, 83, 9, 0.9)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.13, cy - cellSize * 0.13, cellSize * 0.26, cellSize * 0.26);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'見立て ' + (() => { const b = typeof mitateBonus === 'function' ? mitateBonus() : { 1: 0, 2: 0 }; return '黒' + b[1] + ' 白' + b[2]; })()`),
        [K.ONE, K.INFO_ALGO, `            見立碁: 縦横両方向に同色と繋がる石 (L字の角) は終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が縦と横の両方向に同色と繋がる「曲がり角」は、名物に見立てられて終局時+1目。',
            '真っ直ぐ並べるだけでは点にならない — 折れ曲がる形を作る遊び。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        board[I(4, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 5)] = 1; // L字 (4,4) が角
        assert('L字の角は+1目', mitateBonus()[1] === 1);
        board[I(5, 5)] = 2; // 白の孤立石は角でない
        assert('孤立石は角でない', mitateBonus()[2] === 0);
        board[I(5, 5)] = 1; // 2x2 にすると4つ全てが曲がり角
        assert('2x2は全て曲がり角', mitateBonus()[1] === 4);
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
