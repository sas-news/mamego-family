// JITTEGO — 十手碁: 敵石に対向で挟まれた空点への着手は「十手捕」— 両刃を受け止めてその2石を捕らえる
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
    file: 'jittego.html',
    en: 'JITTEGO',
    jp: '十手碁',
    prefix: 'jittego',
    desc: '敵石に対向で挟まれた空点に打つと十手捕 — 挟んでいた2石を捕らえる。',
    kind: 'stone',
    icon: 'jittego',
    spec: [
        ...K.rb('JITTEGO', '十手碁', 'jittego'),
        K.params([
            { key: 'blade_mode', label: '十手の挟み方', options: [{ v: 'ortho', l: '直交のみ' }, { v: 'diag', l: '直交+斜め' }], def: 'ortho' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 十手捕の刃: 対向 (左右/上下) 両側が敵石の空点 — その両石が捕らえられる
        function jitteBlades(b, idx, pl) {
            const opp = pl === 1 ? 2 : 1;
            const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
            const caught = [];
            if (x > 0 && x < BOARD_SIZE - 1 && b[idx - 1] === opp && b[idx + 1] === opp) caught.push(idx - 1, idx + 1);
            if (y > 0 && y < BOARD_SIZE - 1 && b[idx - BOARD_SIZE] === opp && b[idx + BOARD_SIZE] === opp) caught.push(idx - BOARD_SIZE, idx + BOARD_SIZE);
            // 設定: 斜めの対向も刃にする
            if ((P('blade_mode') || 'ortho') === 'diag' && x > 0 && y > 0 && x < BOARD_SIZE - 1 && y < BOARD_SIZE - 1) {
                if (b[idx - BOARD_SIZE - 1] === opp && b[idx + BOARD_SIZE + 1] === opp) caught.push(idx - BOARD_SIZE - 1, idx + BOARD_SIZE + 1);
                if (b[idx - BOARD_SIZE + 1] === opp && b[idx + BOARD_SIZE - 1] === opp) caught.push(idx - BOARD_SIZE + 1, idx + BOARD_SIZE - 1);
            }
            return caught;
        }`],
        // 自殺手免除: 十手捕の刃がある空点への着手は禁止されない (捕らえるから)
        [K.ONE, `            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;`,
`            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) {
                const gi = cells[0].y * BOARD_SIZE + cells[0].x;
                if (jitteBlades(board, gi, player).length === 0) return false; // 十手捕なら有効
            }`],
        // 十手捕: 着手後、対向に挟んでいた敵石を捕らえる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const gi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const blades = jitteBlades(board, gi, player);
                if (blades.length > 0) {
                    blades.forEach(bi => { board[bi] = 0; captures[player]++; fxBurst(bi, '#60a5fa', 8, 1.4); });
                    cleanUpPieces();
                    fxText(gi, '捕!', '#2563eb', 1100);
                }
            }

            turn = opponent;`],
        // 十手捕の機会を示す: 対向挟みの空点に鉤印
        ...K.STONE_MARKS_SPEC(`            // 十手捕の隙: 対向に敵石が並ぶ空点に小さな鉤
            ctx.save();
            ctx.strokeStyle = 'rgba(37,99,235,0.55)';
            ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                if (jitteBlades(board, i, 1).length === 0 && jitteBlades(board, i, 2).length === 0) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.16); ctx.lineTo(cx, cy + cellSize * 0.12);
                ctx.moveTo(cx, cy - cellSize * 0.08); ctx.lineTo(cx + cellSize * 0.13, cy + cellSize * 0.02);
                ctx.stroke();
            }
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            十手碁: 敵石に対向 (左右か上下) で挟まれた空点に打つと十手捕 — 挟んだ2石を捕らえる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '左右または上下の両側が敵石の空点 (鉤印) は十手の隙 — そこに打つと挟んでいた敵2石を捕らえる。',
            '十手捕は自殺禁止の例外 — 敵に挟まれた死地こそ捕物の好機。',
            '連を長く伸ばす敵ほど刃を挟まれる隙が増える。十手で敵を捕らえろ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 十手捕の隙: (5,5)の左右に白石
        board[I(4, 5)] = 2; board[I(6, 5)] = 2;
        assert('刃が検出される', jitteBlades(board, I(5, 5), 1).length === 2);
        assert('十手の隙は打てる', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('挟んだ敵は捕らえられる', board[I(4, 5)] === 0 && board[I(6, 5)] === 0);
        assert('捕りはアゲハマに', captures[1] === 2);
        assert('十手石は残る', board[I(5, 5)] === 1);
        // 非対向の自殺手は禁止のまま: (5,4)は左右が自/空で刃なし、連全体が窒息
        board.fill(0);
        board[I(6, 4)] = 1; board[I(5, 5)] = 1; // 自石の逃げなし連
        [[4,4],[5,3],[6,3],[6,5],[7,4],[4,5],[5,6]].forEach(([x,y]) => board[I(x,y)] = 2);
        assert('十手でない自殺手は禁止', isValidPlacement([{ x: 5, y: 4 }], 1) === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
