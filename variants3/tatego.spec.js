// TATEGO — 楯碁: 両側を同色で挟まれた石は「楯」。楯を含む連は+1呼吸
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
    file: 'tatego.html',
    en: 'TATEGO',
    jp: '楯碁',
    prefix: 'tatego',
    desc: '両側 (左右or上下) を同色で挟まれた石は楯。楯を含む連は+1呼吸。',
    kind: 'stone',
    icon: 'tatego',
    spec: [
        ...K.rb('TATEGO', '楯碁', 'tatego'),
        K.params([
            { key: 'tate_liberty', label: '楯の追加呼吸', min: 1, max: 4, def: 1 },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.9, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 楯: 左右または上下の両側を同色の石で挟まれた石
        function isTate(b, i) {
            const pl = b[i];
            if (pl !== 1 && pl !== 2) return false;
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            if (x > 0 && x < BOARD_SIZE - 1 && b[i - 1] === pl && b[i + 1] === pl) return true;
            if (y > 0 && y < BOARD_SIZE - 1 && b[i - BOARD_SIZE] === pl && b[i + BOARD_SIZE] === pl) return true;
            return false;
        }`],
        // 捕獲判定: 楯を含む連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (group.some(gi => isTate(boardState, gi))) liberties += (P('tate_liberty') || 1); // 楯が後ろを守る

                    if (liberties <= 0) {`],
        // 楯の印を描く
        ...K.STONE_MARKS_SPEC(`            // 楯: 両側挟まれた石に小さな盾形
            ctx.save();
            for (let i = 0; i < board.length; i++) {
                if (!isTate(board, i)) continue;
                const pl = board[i];
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.strokeStyle = pl === 1 ? 'rgba(250,220,120,0.9)' : 'rgba(120,80,20,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.14, cy - cellSize * 0.12);
                ctx.lineTo(cx + cellSize * 0.14, cy - cellSize * 0.12);
                ctx.lineTo(cx + cellSize * 0.14, cy + cellSize * 0.04);
                ctx.lineTo(cx, cy + cellSize * 0.18);
                ctx.lineTo(cx - cellSize * 0.14, cy + cellSize * 0.04);
                ctx.closePath(); ctx.stroke();
            }
            ctx.restore();`),
        [K.ONE, K.INFO_BASE, `            楯碁: 両側 (左右か上下) を同色で挟まれた石は「楯」。楯を含む連は+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '左右または上下の両側を自分の石で挟まれた石は「楯」になる (盾印)。',
            '楯を含む連は後ろが守られ呼吸点+1 — 列を整えて楯を立てろ。',
            '楯は双方に同じ条件 — 敵の楯を崩すか自陣に並べるか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        // 横に3連: 中央が楯
        board[I(4, 4)] = 1; board[I(5, 4)] = 1; board[I(6, 4)] = 1;
        assert('挟まれた石は楯', isTate(board, I(5, 4)) === true);
        assert('端は楯でない', isTate(board, I(4, 4)) === false);
        // 楯の連は呼吸0でも+1で生きる: 3連の全隣接点を白で埋める
        [[3,4],[4,3],[4,5],[5,3],[5,5],[7,4],[6,3],[6,5]].forEach(([x,y]) => board[I(x,y)] = 2);
        assert('楯の連は取られない', !getCapturedStones(board, 1).includes(I(5, 4)));
        // 楯でない孤立石は取られる
        board.fill(0);
        board[I(7, 7)] = 1;
        board[I(6, 7)] = 2; board[I(8, 7)] = 2; board[I(7, 6)] = 2; board[I(7, 8)] = 2;
        assert('楯なしの連は取られる', getCapturedStones(board, 1).includes(I(7, 7)));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
