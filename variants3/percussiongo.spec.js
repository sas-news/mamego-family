// PERCUSSIONGO — 打楽碁: 太鼓(石)を打つリズムで盤が震える。偶数手は通常、8の倍数の着手は大太鼓
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'percussiongo.html',
    en: 'PERCUSSIONGO',
    jp: '打楽碁',
    prefix: 'percussiongo',
    desc: '着手は鼓の一打。8の倍数の手番は大太鼓 — 着手点から盤が震え、隣の孤立敵石が跳ねて消える。',
    kind: 'stone',
    icon: 'percussiongo',
    spec: [
        ...K.rb('PERCUSSIONGO', '打楽碁', 'percussiongo'),
        K.params([{ key: 'don_every', label: '大太鼓の間隔', min: 2, max: 16, def: 8, unit: '打' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' }]),
        // 大太鼓: 8の倍数の自分の着手は震盪 — 隣接する孤立敵石を跳ね飛ばす
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 大太鼓: 自分の8手ごとの着手は震盪 — 隣の孤立敵石 (連1石) が跳ねて消える
            {
                const movesP = history.filter(h => h.turn === player).length;
                if (movesP % Math.max(1, P('don_every') || 8) === 0 && movesP > 0) {
                    const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    let bounced = 0;
                    getNeighbors(mi).forEach(n => {
                        if (board[n] !== opponent) return;
                        const g = getConnectedGroup(n, opponent);
                        if (g.length === 1) {
                            board[n] = 0;
                            captures[player]++;
                            bounced++;
                            fxBurst(n, '#fbbf24', 10, 1.6);
                            fxText(n, '跳ねた!', '#fbbf24', 1100);
                        }
                    });
                    fxShake(4 + bounced * 2, 320);
                    if (bounced) cleanUpPieces();
                    fxText(mi, 'ドン!', '#f59e0b', 900);
                }
            }

            turn = opponent;`],
        // 鼓面: 盤面全体が鼓。常に薄い同心円が揺れる
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 鼓面の揺れ: 盤中央から広がる薄い波紋
        fxAmbient((ctx2, now, pad, cs) => {
            const cx = pad + (BOARD_SIZE - 1) * cs / 2;
            const t = (now % 3600) / 3600;
            ctx2.save();
            ctx2.globalAlpha = (1 - t) * 0.18;
            ctx2.strokeStyle = '#fbbf24';
            ctx2.lineWidth = Math.max(1, cs * 0.06);
            ctx2.beginPath();
            ctx2.arc(cx, cx, t * BOARD_SIZE * cs * 0.8, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`((history.filter(h => h.turn === turn).length + 1) % (P('don_every') || 8) === 0 || history.filter(h => h.turn === turn).length === (P('don_every') || 8) - 1) ? '次は大太鼓!' : '次の大太鼓まであと ' + ((P('don_every') || 8) - (history.filter(h => h.turn === turn).length % (P('don_every') || 8))) + ' 打'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            打楽碁: 着手は鼓の一打。自分の8手ごとの着手は大太鼓 — 盤が震え、隣の孤立敵石が跳ねて消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は鼓の一打。自分の8手ごとの着手は大太鼓となり盤が震盪する。',
            '震盪で隣接する「孤立した敵石」(連が1石) が跳ねて消え、アゲハマになる。連は石を連ねて震えに耐えろ。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        for (let i = 0; i < 7; i++) { history.push({ turn: 1 }); } // 黒はあと1手で8手目
        board[4 * BOARD_SIZE + 5] = 2; // 孤立敵石
        board[4 * BOARD_SIZE + 8] = 2; board[4 * BOARD_SIZE + 9] = 2; // 敵連 (2石) — 連は耐える
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 8手目 = 大太鼓
        assert('孤立敵石は跳ねる', board[4 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('連ねた敵は跳ねない', board[4 * BOARD_SIZE + 8] === 2 && board[4 * BOARD_SIZE + 9] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 9手目 = 通常 (周囲に孤立敵なしのはず)
        assert('9打目は通常一打', board[4 * BOARD_SIZE + 8] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 2) === true);
    `,
};
