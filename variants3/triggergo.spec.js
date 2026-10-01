// TRIGGERGO — 引金碁: 盤の縁は引金。縁に置くとその列/行の石が連鎖爆発する
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'triggergo.html',
    en: 'TRIGGERGO',
    jp: '引金碁',
    prefix: 'triggergo',
    desc: '盤の縁は引金。縁に置くとその列/行の石が全て連鎖爆発する。',
    kind: 'stone',
    icon: 'triggergo',
    spec: [
        ...K.rb('TRIGGERGO', '引金碁', 'triggergo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        // 引金: 縁に置くと直角方向の列/行全体が爆発 (角は両方)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 引金: 縁への着手はその列/行の全石を爆破する
            {
                const bc = move.cells[0];
                const lines = [];
                if (bc.y === 0 || bc.y === BOARD_SIZE - 1) lines.push('col');
                if (bc.x === 0 || bc.x === BOARD_SIZE - 1) lines.push('row');
                if (lines.length > 0) {
                    const boom = [];
                    lines.forEach(axis => {
                        if (axis === 'col') {
                            for (let y = 0; y < BOARD_SIZE; y++) boom.push(y * BOARD_SIZE + bc.x);
                        } else {
                            for (let x = 0; x < BOARD_SIZE; x++) boom.push(bc.y * BOARD_SIZE + x);
                        }
                    });
                    // 着手石自身も爆発する (引金は使い捨て)
                    boom.forEach(i => {
                        if (board[i] === 1 || board[i] === 2) {
                            if (board[i] === opponent) captures[player]++;
                            board[i] = 0;
                            fxBurst(i, '#f97316', 6, 1.5);
                        }
                    });
                    fxShake(7, 360);
                    const ti = bc.y * BOARD_SIZE + bc.x;
                    fxText(ti, 'ドーン!', '#fb923c', 1100);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 縁を引金の朱色で縁取る
        K.CUE_GRID(`            // 引金の縁: 盤の周囲を朱色で縁取る
            {
                ctx.save();
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.strokeStyle = 'rgba(220,38,38,0.30)';
                ctx.lineWidth = Math.max(2, cellSize * 0.10);
                ctx.strokeRect(padding - cellSize * 0.5, padding - cellSize * 0.5, w - padding * 2 + cellSize, w - padding * 2 + cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'縁=引金: 列/行が連鎖爆発'`),
        [K.ONE, K.INFO_ALGO, `            引金碁: 盤の縁に置くとその列/行の石が全て連鎖爆発する (角は両方)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の縁は引金。縁に石を置くと、その列または行の全ての石が連鎖爆発する。',
            '角に置くと列と行の両方が爆発。敵石はアゲハマ、自石と着手石は消える。',
            '一撃で線上を更地にする大技 — 自分の石を巻き込まないよう狙おう。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 列x=4に白2つ — 黒が上端(4,0)に置くと列が爆発
        board[I(4, 2)] = 2; board[I(4, 8)] = 2;
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('列が連鎖爆発', board[I(4, 2)] === 0 && board[I(4, 8)] === 0);
        assert('敵石はアゲハマに', captures[1] === 2);
        assert('引金自身も消える', board[I(4, 0)] === 0);
        // 内側への着手は爆発しない
        board[I(7, 7)] = 2;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('内側は爆発しない', board[I(7, 7)] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
