// SENRYUGO — 川柳碁: 石が山なり (三連の山型) を成せばおかしみ。終局時に山型1つ+1目
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
    file: 'senryugo.html',
    en: 'SENRYUGO',
    jp: '川柳碁',
    prefix: 'senryugo',
    desc: '石が山なり (三連の山型) を成せばおかしみ点。終局時に1山+1目。',
    kind: 'stone',
    icon: 'senryugo',
    spec: [
        ...K.rb('SENRYUGO', '川柳碁', 'senryugo'),
        K.params([
            { key: 'hill_pts', label: '山なり1つの得点', min: 1, max: 5, def: 1, unit: '点' },
        ]),
        // おかしみ集計: 山型 (x,y)+(x+1,y-1)+(x+2,y) と谷型 (x,y)+(x+1,y+1)+(x+2,y) の同色3石
        [K.ONE, `        function endGameByScore() {`, `        // 川柳: 山なり三連 (上または下に張り出した同色3石) を数える
        function senryuBonus() {
            const b = { 1: 0, 2: 0 };
            const at = (x, y) => (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE)
                ? board[y * BOARD_SIZE + x] : 0;
            for (let y = 0; y < BOARD_SIZE; y++)
                for (let x = 0; x + 2 < BOARD_SIZE; x++) {
                    const v = at(x, y);
                    if (v !== 1 && v !== 2) continue;
                    // 山型: 中点が上に張り出す
                    if (at(x + 1, y - 1) === v && at(x + 2, y) === v) b[v] += Math.max(1, P('hill_pts') || 1);
                    // 谷型: 中点が下に張り出す
                    if (at(x + 1, y + 1) === v && at(x + 2, y) === v) b[v] += Math.max(1, P('hill_pts') || 1);
                }
            return b;
        }

        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 川柳ルール: 山なり三連は+1目
            {
                const sb = senryuBonus();
                territory.black += sb[1];
                territory.white += sb[2];
            }`],
        // 山なりを三角の輪郭で示す
        ...K.STONE_MARKS_SPEC(`            // 山なり: 三連を結ぶ三角の輪郭
            {
                const at = (x, y) => (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE)
                    ? board[y * BOARD_SIZE + x] : 0;
                ctx.save();
                ctx.lineWidth = Math.max(1.1, cellSize * 0.045);
                ctx.lineJoin = 'round';
                for (let y = 0; y < BOARD_SIZE; y++)
                    for (let x = 0; x + 2 < BOARD_SIZE; x++) {
                        const v = at(x, y);
                        if (v !== 1 && v !== 2) continue;
                        const px = (xx, yy) => [padding + xx * cellSize, padding + yy * cellSize];
                        ctx.strokeStyle = v === 1 ? 'rgba(134, 239, 172, 0.9)' : 'rgba(22, 163, 74, 0.8)';
                        for (const dy of [-1, 1]) {
                            if (at(x + 1, y + dy) !== v || at(x + 2, y) !== v) continue;
                            const [x0, y0] = px(x, y);
                            const [x1, y1] = px(x + 1, y + dy);
                            const [x2, y2] = px(x + 2, y);
                            ctx.beginPath();
                            ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
                            ctx.stroke();
                        }
                    }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'おかしみ ' + (() => { const b = typeof senryuBonus === 'function' ? senryuBonus() : { 1: 0, 2: 0 }; return '黒' + b[1] + ' 白' + b[2]; })()`),
        [K.ONE, K.INFO_ALGO, `            川柳碁: 山なりの同色3連 (真中が1点張り出す形) は終局時+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同じ色が「∧」や「∨」の山なり3連を成せばおかしみ点、終局時+1目。',
            '川柳は軽みが命 — 駄目に走る余所見が実は得点源。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board.fill(0); pieces = []; history.length = 0;
        board[I(3, 5)] = 1; board[I(4, 4)] = 1; board[I(5, 5)] = 1; // 山型
        assert('山なり三連は+1目', senryuBonus()[1] === 1);
        board[I(4, 4)] = 2; // 中点が敵色
        assert('中点が敵なら山にならない', senryuBonus()[1] === 0);
        board.fill(0); pieces = []; history.length = 0;
        board[I(3, 5)] = 2; board[I(4, 6)] = 2; board[I(5, 5)] = 2; // 谷型
        assert('谷なりも+1目', senryuBonus()[2] === 1);
        assert('通常着手は合法', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
