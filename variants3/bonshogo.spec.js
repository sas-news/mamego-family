// BONSHOGO — 鐘撞碁: 天元の梵鐘を撞く(着手)と音が響き、周囲1目の石が1つ外に押される
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
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
    file: 'bonshogo.html',
    en: 'BONSHOGO',
    jp: '鐘撞碁',
    prefix: 'bonshogo',
    desc: '天元は梵鐘。撞く(着手)と音が響き、周囲1目の石が1つ外へ押される。',
    kind: 'stone',
    icon: 'bonshogo',
    spec: [
        ...K.rb('BONSHOGO', '鐘撞碁', 'bonshogo'),
        K.params([
            { key: 'push_dist', label: '押し出し距離', min: 1, max: 3, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        // 鐘の音: 天元着手で周囲1目を外へ押す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鐘撞: 天元に打つと梵鐘が鳴り、周囲1目の石が1つ外へ押される
            {
                const c = Math.floor(BOARD_SIZE / 2);
                if (move.cells[0].x === c && move.cells[0].y === c) {
                    const pushes = [];
                    const pd = Math.max(1, P('push_dist') || 1);
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const sx = c + dx, sy = c + dy, tx = c + dx * (1 + pd), ty = c + dy * (1 + pd);
                        const si = sy * BOARD_SIZE + sx, ti = ty * BOARD_SIZE + tx;
                        if (board[si] !== 0 && board[si] !== 4 &&
                            tx >= 0 && ty >= 0 && tx < BOARD_SIZE && ty < BOARD_SIZE &&
                            board[ti] === 0) {
                            pushes.push([si, ti]);
                        }
                    }
                    pushes.forEach(([si, ti]) => {
                        board[ti] = board[si];
                        board[si] = 0;
                        fxSlide(si, ti, board[ti] === 1 ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', 300);
                    });
                    if (pushes.length) cleanUpPieces();
                    fxBurst(c * BOARD_SIZE + c, '#fde047', 18);
                    fxText(c * BOARD_SIZE + c, 'ゴーン', '#fde047', 1400);
                    fxShake(6, 500);
                }
            }

            turn = opponent;`],
        // 天元に鐘を描く
        K.CUE_STARS(`            // 鐘撞: 天元に小さな梵鐘を描く
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                const r = cellSize * 0.30;
                ctx.save();
                ctx.fillStyle = 'rgba(161,98,7,0.9)';
                ctx.beginPath();
                ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0); // 鐘の胴
                ctx.rect(cx - r, cy - r * 0.1, r * 2, r * 0.8);
                ctx.fill();
                ctx.fillStyle = 'rgba(253,224,71,0.95)';
                ctx.fillRect(cx - r * 0.12, cy - r * 0.55, r * 0.24, r * 0.35); // 撞座
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            鐘撞碁: 天元は梵鐘。天元に着手すると音が響き、周囲1目の石が1つ外へ押される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は梵鐘。天元に着手すると鐘が鳴り、鐘の周囲1目にある石がそれぞれ外側へ1つ押される。',
            '押し先が盤外・他の石で埋まっている石は動かない。押された石は普通に取られ得る。',
            '鐘は誰でも撞ける — 双方同じ条件。天元の石自体は普通の石。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[(c - 1) * B + c] = 2; // 鐘の真上に白石
        executeMove({ cells: [{ x: c, y: c }] }, 1); // 撞く
        assert('上の白石が1つ外へ', board[(c - 2) * B + c] === 2 && board[(c - 1) * B + c] === 0);
        board[c * B + c - 1] = 1; board[c * B + c - 2] = 2; // 左外が埋まっていると動かない
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('押し先が埋まると動かない', board[c * B + c - 1] === 1);
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 鐘以外の着手
        assert('鐘以外では鳴らない', board[1 * B + 1] === 1);
    `,
};
