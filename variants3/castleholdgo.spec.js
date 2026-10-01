// CASTLEHOLDGO — 篭城碁: 四隅の城内に完全に篭った連は外から取れないが、籠城は兵糧を食う
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
const IS_CASTLE = `                    const inCastle = (x, y) => (x < (P('castle_size') || 3) || x >= BOARD_SIZE - (P('castle_size') || 3)) && (y < (P('castle_size') || 3) || y >= BOARD_SIZE - (P('castle_size') || 3));`;
module.exports = {
    file: 'castleholdgo.html',
    en: 'CASTLEHOLDGO',
    jp: '篭城碁',
    prefix: 'castleholdgo',
    desc: '四隅3x3は城。城内に完全に篭った連は取れないが、4手ごとに籠城兵糧を食う。',
    kind: 'stone',
    icon: 'castleholdgo',
    spec: [
        ...K.rb('CASTLEHOLDGO', '篭城碁', 'castleholdgo'),
        K.params([
            { key: 'castle_size', label: '城の幅', min: 2, max: 6, def: 3, hint: '四隅の城域はこの幅の正方形' },
            { key: 'ration_every', label: '兵糧の間隔', min: 2, max: 12, def: 4, unit: '手' },
            { key: 'ration_min', label: '兵糧対象の最小連', min: 2, max: 5, def: 2, unit: '連' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 捕獲改変: 城内に完全に篭った連は外から取れない
        [K.ONE, K.CAPTURE_BLOCK, `            const captured0 = getCapturedStones(board, opponent);
            // 篭城: 四隅の城(角3x3)に完全に籠る連は城内で守られる
            const inCastle = (x, y) => (x < (P('castle_size') || 3) || x >= BOARD_SIZE - (P('castle_size') || 3)) && (y < (P('castle_size') || 3) || y >= BOARD_SIZE - (P('castle_size') || 3));
            const held = new Set();
            captured0.forEach(i => {
                const g = getConnectedGroup(i, opponent);
                if (g.every(j => inCastle(j % BOARD_SIZE, Math.floor(j / BOARD_SIZE)))) g.forEach(j => held.add(j));
            });
            const captured = captured0.filter(i => !held.has(i));
            if (held.size) {
                held.forEach(i => fxGlow(i, '#fbbf24', 800));
                fxText([...held][0], '篭城!', '#fbbf24', 1200);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 籠城の代償: 城内の自連は自分の4手ごとに兵糧を食い、兵士が1人落ちる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 籠城の兵糧: 自分の4手ごと、城内に完全に篭った自連(2石以上)から1人脱落
            {
                const inCastle = (x, y) => (x < (P('castle_size') || 3) || x >= BOARD_SIZE - (P('castle_size') || 3)) && (y < (P('castle_size') || 3) || y >= BOARD_SIZE - (P('castle_size') || 3));
                if (history.length % (P('ration_every') || 4) === (P('ration_every') || 4) - 1) {
                    const seenC = {};
                    let holdGroup = null;
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== player || seenC[i]) continue;
                        const g = getConnectedGroup(i, player);
                        g.forEach(j => { seenC[j] = true; });
                        if (g.length >= (P('ration_min') || 2) && g.every(j => inCastle(j % BOARD_SIZE, Math.floor(j / BOARD_SIZE)))) { holdGroup = g; break; }
                    }
                    if (holdGroup) {
                        const starve = Math.max.apply(null, holdGroup);
                        board[starve] = 0;
                        captures[opponent]++;
                        fxBurst(starve, '#a8a29e', 8, 1.4);
                        fxText(starve, '兵糧消費', '#d6d3d1', 1100);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 城域の描画: 四隅に石垣色の城内エリア
        ...K.CUE_GRID(`            // 城域: 四隅3x3に石垣色の帯
            {
                const inC = (x, y) => (x < (P('castle_size') || 3) || x >= BOARD_SIZE - (P('castle_size') || 3)) && (y < (P('castle_size') || 3) || y >= BOARD_SIZE - (P('castle_size') || 3));
                ctx.save();
                ctx.fillStyle = 'rgba(120,113,108,0.28)';
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!inC(x, y)) continue;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                }
                ctx.strokeStyle = 'rgba(87,83,78,0.6)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    if (inC(x, y)) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    if (x > 0 && inC(x - 1, y)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx - hh, cy + hh); }
                    if (x < BOARD_SIZE - 1 && inC(x + 1, y)) { ctx.moveTo(cx + hh, cy - hh); ctx.lineTo(cx + hh, cy + hh); }
                    if (y > 0 && inC(x, y - 1)) { ctx.moveTo(cx - hh, cy - hh); ctx.lineTo(cx + hh, cy - hh); }
                    if (y < BOARD_SIZE - 1 && inC(x, y + 1)) { ctx.moveTo(cx - hh, cy + hh); ctx.lineTo(cx + hh, cy + hh); }
                }
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'四隅は城内 — 篭れば不敗だが兵糧を食う'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            篭城碁: 四隅3x3は城。城内に完全に籠った連は外から取れないが、自分の4手ごとに籠城兵糧で1石脱落<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅の3x3は「城」。全ての石が城内に収まる連は外から取られない (城壁が守る)。',
            'ただし籠城は兵糧を食う: 自分の4手ごとに城内の連から1石が脱落する (相手のアゲハマ)。出たり入ったりの駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 城内に完全に篭った連: 角3x3内の石を敵に囲ませる
        board[0] = 1; board[1 * BOARD_SIZE + 0] = 1;
        board[1] = 2; board[1 * BOARD_SIZE + 1] = 2; board[2 * BOARD_SIZE + 0] = 2;
        executeMove({ cells: [{ x: 10, y: 10 }] }, 2); // どこかに着手 → 城内の連は呼吸0でも取られない
        assert('城内の連は取られない', board[0] === 1 && board[1 * BOARD_SIZE + 0] === 1);
        // 城外の連は普通に取られる
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[5 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 2);
        assert('城外なら普通に取られる', board[5 * BOARD_SIZE + 5] === 0 && captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
