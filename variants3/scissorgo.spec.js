// SCISSORGO — 鋏碁: 敵石を自石で挟むと切断する (挟まれた敵石は切り落とされる)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'scissorgo.html',
    en: 'SCISSORGO',
    jp: '鋏碁',
    prefix: 'scissorgo',
    desc: '敵石を自石で挟むと鋏が入る。挟まれた敵石は切り落とされる。',
    kind: 'stone',
    icon: 'scissorgo',
    spec: [
        ...K.rb('SCISSORGO', '鋏碁', 'scissorgo'),
        K.params([
            { key: 'scissor_len', label: '鋏のリーチ', min: 2, max: 4, def: 2, unit: 'マス', hint: '対側の自石までの距離' },
        ]),
        // 鋏: 新しい石と既存の自石で敵石を直線に挟むと切り落とす (呼吸点に関係なく)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鋏: 着手石の隣の敵石が、その反対側にも自石を持つなら切り落とす
            {
                const bc = move.cells[0];
                const cuts = [];
                const L = Math.max(2, P('scissor_len') || 2);
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const ox = bc.x + dx * L, oy = bc.y + dy * L;
                    if (ox < 0 || oy < 0 || ox >= BOARD_SIZE || oy >= BOARD_SIZE) continue;
                    if (board[oy * BOARD_SIZE + ox] !== player) continue;
                    const line = [];
                    let ok = true;
                    for (let d = 1; d < L; d++) {
                        const ex = bc.x + dx * d, ey = bc.y + dy * d;
                        const ei = ey * BOARD_SIZE + ex;
                        if (board[ei] !== opponent) { ok = false; break; }
                        line.push(ei);
                    }
                    if (ok) cuts.push(...line);
                }
                if (cuts.length > 0) {
                    cuts.forEach(ei => {
                        board[ei] = 0;
                        captures[player]++;
                        fxBurst(ei, '#f472b6', 10, 1.7);
                    });
                    const ci = bc.y * BOARD_SIZE + bc.x;
                    fxText(ci, 'チョッキン!', '#ec4899', 1000);
                    cleanUpPieces();
                    // 切り落としの結果、残った敵連が窒息すれば通常通り取る
                    const dead = getCapturedStones(board, opponent);
                    if (dead.length > 0) {
                        dead.forEach(i => board[i] = 0);
                        captures[player] += dead.length;
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 鋏の刃: 挟みうる敵石に小さな鋏マーク (予告)
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(236,72,153,0.55)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                ctx.lineCap = 'round';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== (turn === 1 ? 2 : 1)) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                        const ax = x + dx, ay = y + dy, bx2 = x - dx, by2 = y - dy;
                        if (ax < 0 || ay < 0 || ax >= BOARD_SIZE || ay >= BOARD_SIZE) continue;
                        if (bx2 < 0 || by2 < 0 || bx2 >= BOARD_SIZE || by2 >= BOARD_SIZE) continue;
                        if (board[ay * BOARD_SIZE + ax] !== turn) continue;
                        if (board[by2 * BOARD_SIZE + bx2] !== 0) continue;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.30);
                        ctx.lineTo(cx + cellSize * 0.18, cy + cellSize * 0.30);
                        ctx.moveTo(cx + cellSize * 0.18, cy - cellSize * 0.30);
                        ctx.lineTo(cx - cellSize * 0.18, cy + cellSize * 0.30);
                        ctx.stroke();
                        break;
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鋏: 敵石を自石で挟んで切る'`),
        [K.ONE, K.INFO_ALGO, `            鋏碁: 敵石を自石で直線に挟むと鋏が入る。挟まれた敵石は切り落とされる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石の隣の敵石が、その反対側にも自石を持つと「鋏」が発動。',
            '挟まれた敵石は呼吸点に関係なく切り落とされる (連の分断)。',
            '切り落としで残った敵連が窒息すれば通常通り取れる。鋏は両者に開かれる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 黒(4,3) とこれから置く黒(4,5) で白(4,4)を挟む
        board[I(4, 3)] = 1; board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('挟んだ敵石を切断', board[I(4, 4)] === 0);
        assert('切った石はアゲハマに', captures[1] === 1);
        // 片側だけでは切れない
        board[I(7, 7)] = 2;
        executeMove({ cells: [{ x: 7, y: 8 }] }, 1);
        assert('片側だけでは切れない', board[I(7, 7)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
