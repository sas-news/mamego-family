// ROSARYGO — 数珠碁: 石は数珠玉。同色で囲んだ空点は「念珠の環」になり、環ごとに+4目
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
    file: 'rosarygo.html',
    en: 'ROSARYGO',
    jp: '数珠碁',
    prefix: 'rosarygo',
    desc: '同色石で囲んだ空点は「念珠の環」— 環1つにつき+4目の功徳。',
    kind: 'stone',
    icon: 'rosarygo',
    spec: [
        ...K.rb('ROSARYGO', '数珠碁', 'rosarygo'),
        K.params([
            { key: 'ring_bonus', label: '環1つの得点', min: 0, max: 16, def: 4, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 環: 四方を同色で囲まれた空点 = 念珠の環 (双方同じ判定)
        function rosaryRings(bs, p) {
            const rings = [];
            for (let i = 0; i < bs.length; i++) {
                if (bs[i] !== 0) continue;
                const ns = getNeighbors(i);
                if (ns.length >= 3 && ns.every(n => bs[n] === p)) rings.push(i);
            }
            return rings;
        }`],
        // 環ごとに+4目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            territory.black += rosaryRings(board, 1).length * (P('ring_bonus') ?? 4);
            territory.white += rosaryRings(board, 2).length * (P('ring_bonus') ?? 4);`],
        // 環を金色の輪で描く
        K.CUE_STARS(`            // 念珠の環: 囲まれた空点に金の輪
            {
                ctx.save();
                [1, 2].forEach(p => {
                    ctx.strokeStyle = p === 1 ? 'rgba(250, 204, 21, 0.85)' : 'rgba(251, 146, 60, 0.85)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                    rosaryRings(board, p).forEach(i => {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.3, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            数珠碁: 同色で囲んだ空点は「念珠の環」— 環ごとに+4目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '四方 (角は3方向) を同色で囲んだ空点は「念珠の環」になる。',
            '環は1つにつき終局+4目 — 目の形を作るだけでも加点。',
            '相手の環の中心を埋めるのは自殺手 — 環を乱すなら横から。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board[I(4, 3)] = 1; board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 5)] = 1;
        const rings = rosaryRings(board, 1);
        assert('囲んだ空点は環', rings.length === 1 && rings[0] === I(4, 4));
        assert('環は相手の色で判定される', rosaryRings(board, 2).length === 0);
        board[I(4, 4)] = 2;
        assert('埋めると環は消える', rosaryRings(board, 1).length === 0);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
