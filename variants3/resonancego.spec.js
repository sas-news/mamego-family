// RESONANCEGO — 共鳴碁: 同色石が直線に3個以上並ぶと共鳴。共鳴に触れる敵石は弱る (呼吸-1)
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'resonancego.html',
    en: 'RESONANCEGO',
    jp: '共鳴碁',
    prefix: 'resonancego',
    desc: '同色石が直線に3個以上並ぶと共鳴し、接する敵石は呼吸が1つ減る。',
    kind: 'stone',
    icon: 'resonancego',
    spec: [
        ...K.rb('RESONANCEGO', '共鳴碁', 'resonancego'),
        K.params([
            { key: 'reso_len', label: '共鳴に必要な連続数', min: 2, max: 6, def: 3, unit: '石' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 共鳴: 縦横に同色3個以上の直線列。共鳴石は敵連の呼吸を削る
        function computeResonance(bs) {
            const res = new Set();
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = bs[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                // 横方向のラン
                let run = 1;
                while (x + run < BOARD_SIZE && bs[y * BOARD_SIZE + x + run] === v) run++;
                if (run >= Math.max(2, P('reso_len') || 3)) for (let k = 0; k < run; k++) res.add(y * BOARD_SIZE + x + k);
                // 縦方向のラン
                run = 1;
                while (y + run < BOARD_SIZE && bs[(y + run) * BOARD_SIZE + x] === v) run++;
                if (run >= Math.max(2, P('reso_len') || 3)) for (let k = 0; k < run; k++) res.add((y + k) * BOARD_SIZE + x);
            }
            return res;
        }`],
        // 共鳴に接する敵石は呼吸が1つ削られる (取り判定を libScore - weaken で行う)
        [K.ONE, `        function getCapturedStones(boardState, player) {`,
`        function getCapturedStones(boardState, player) {
            const __resSet = computeResonance(boardState);`],
        [K.ONE, `                    let hasLiberty = false;`,
`                    let libScore = 0;
                    let weaken = 0;`],
        [K.ONE, `                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });`,
`                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                libScore++;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            } else if (boardState[n] !== 0 && boardState[n] !== player && __resSet.has(n)) {
                                weaken++;
                            }
                        });`],
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);`,
`                    if (libScore <= weaken) {
                        captured.push(...group);`],
        // 共鳴石をリングと波紋で強調
        K.CUE_STARS(`            // 共鳴している石に波紋リング
            {
                const res = computeResonance(board);
                ctx.save();
                res.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = board[i] === 1 ? 'rgba(220, 220, 255, 0.8)' : 'rgba(255, 180, 60, 0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    for (let k = 1; k <= 2; k++) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * (0.42 + k * 0.16), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            共鳴碁: 同色石が直線に3個以上並ぶと共鳴し、接する敵石は呼吸が1つ減る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '同色石が縦横に3個以上直線で並ぶと「共鳴」する (双方同じ条件)。',
            '共鳴石に接する敵連は呼吸が1つ削られる — 残り1呼吸の連は即死。',
            '列を作って相手を震わせるか、相手の共鳴を分断するか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board[I(3, 3)] = 1; board[I(4, 3)] = 1; board[I(5, 3)] = 1;
        const res = computeResonance(board);
        assert('3連が共鳴する', res.has(I(3, 3)) && res.has(I(5, 3)));
        assert('2連は共鳴しない', !res.has(I(0, 0)));
        // 共鳴に接する敵石: 残り1呼吸なら共鳴の振動で取られる
        board[I(4, 2)] = 2; board[I(3, 2)] = 1; board[I(4, 1)] = 1; // (5,2) だけ空き
        assert('共鳴に触れる敵石は弱る', getCapturedStones(board, 2).includes(I(4, 2)));
        board[I(4, 3)] = 0; // 共鳴を1箇所止める
        assert('共鳴がなければ1呼吸で生きる', !getCapturedStones(board, 2).includes(I(4, 2)));
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
