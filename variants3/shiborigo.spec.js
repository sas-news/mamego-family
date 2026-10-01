// SHIBORIGO — 絞染碁: 全周を同色で絞った空点は「絞り目」。絞り目を持つ連は染め残され+1呼吸
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
    file: 'shiborigo.html',
    en: 'SHIBORIGO',
    jp: '絞染碁',
    prefix: 'shiborigo',
    desc: '全周を同色で絞った空点は絞り目。絞り目を持つ連は+1呼吸。',
    kind: 'stone',
    icon: 'shiborigo',
    spec: [
        ...K.rb('SHIBORIGO', '絞染碁', 'shiborigo'),
        K.params([
            { key: 'shibori_bonus', label: '絞り目の追加呼吸', min: 0, max: 3, def: 1, unit: '点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 絞り目: 空点で全ての隣接点が同色の石 (端・隅でも成立)
        function isShibori(b, i, pl) {
            if (b[i] !== 0) return false;
            const nb = getNeighbors(i);
            return nb.length > 0 && nb.every(n => b[n] === pl);
        }`],
        // 捕獲判定: 絞り目を持つ連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0; let resist = false;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;
                                if (!resist && getNeighbors(n).every(m => boardState[m] === player)) resist = true; // 絞り目発見`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (resist) liberties += Math.max(0, P('shibori_bonus') ?? 1); // 絞り目を持つ連は染め残され追加呼吸

                    if (liberties <= 0) {`],
        // 絞り目の描画: 結び目の菱形マーク
        ...K.STONE_MARKS_SPEC(`            // 絞り目: 全周同色に絞られた空点に小さな結び目
            ctx.save();
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0) continue;
                const pl = isShibori(board, i, 1) ? 1 : (isShibori(board, i, 2) ? 2 : 0);
                if (!pl) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.strokeStyle = pl === 1 ? 'rgba(240,220,120,0.9)' : 'rgba(150,100,40,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.16); ctx.lineTo(cx + cellSize * 0.16, cy);
                ctx.lineTo(cx, cy + cellSize * 0.16); ctx.lineTo(cx - cellSize * 0.16, cy);
                ctx.closePath();
                ctx.stroke();
            }
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            絞染碁: 全周を自分の石で絞った空点は「絞り目」。絞り目を持つ連は+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '空点の全ての隣接点を自分の石で絞ると「絞り目」になる (菱形の結び目)。',
            '絞り目を呼吸点に持つ連は染め残され、呼吸点+1 — 取られにくい。',
            '隅・端でも絞り目は成立する。布を絞るように盤を制しろ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        // (5,5)を黒4方で絞る → 絞り目
        board[I(4, 5)] = 1; board[I(6, 5)] = 1; board[I(5, 4)] = 1; board[I(5, 6)] = 1;
        assert('絞り目が認識される', isShibori(board, I(5, 5), 1) === true);
        assert('白には絞り目でない', isShibori(board, I(5, 5), 2) === false);
        // 絞り目を持つ連: (4,5)の連は呼吸0でも絞り目+1で生きる
        board[I(4, 4)] = 2; board[I(3, 5)] = 2; board[I(4, 6)] = 2; // (4,5)の残り3方を白で埋める
        assert('絞り目の連は取られない', !getCapturedStones(board, 1).includes(I(4, 5)));
        board.fill(0);
        board[I(5, 5)] = 1;
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        assert('絞り目なしの連は取られる', getCapturedStones(board, 1).includes(I(5, 5)));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
