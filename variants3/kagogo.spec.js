// KAGOGO — 駕籠碁: 中央4星は「要人」。要人を囲んだ連は駕籠となり、要人ごと護送費+2目
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kagogo.html',
    en: 'KAGOGO',
    jp: '駕籠碁',
    prefix: 'kagogo',
    desc: '星は中立の要人。座の四方を自石で塞ぐと駕籠で担ぎ+2目。',
    kind: 'stone',
    icon: 'kagogo',
    spec: [
        ...K.rb('KAGOGO', '駕籠碁', 'kagogo'),
        K.params([
            { key: 'kago_pts', label: '駕籠の護送費', min: 0, max: 6, def: 2, unit: '目' },
        ]),
        // 駕籠: 着手で要人(中央4星)の四方を自石が全て塞ぐと、要人を担いで+2目 (要人は中立のまま)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 駕籠: 星の座(要人)の隣接4方が全て自石なら担ぎ上げ+2目。要人は中立で消えない
            {
                const palanquins = getStarPoints(BOARD_SIZE);
                let carried = 0;
                palanquins.forEach(pt => {
                    const vi = pt.y * BOARD_SIZE + pt.x;
                    if (board[vi] !== 0) return; // 要人の座が空いている時だけ
                    const nb = getNeighbors(vi);
                    if (nb.length === 4 && nb.every(n => board[n] === player)) {
                        carried++;
                        nb.forEach(n => fxGlow(n, '#fde68a', 700));
                        fxText(vi, '駕籠で担ぐ +2', '#fbbf24', 1300);
                    }
                });
                if (carried) {
                    captures[player] += carried * (P('kago_pts') ?? 2);
                    fxShake(3, 260);
                }
            }

            turn = opponent;`],
        // 要人の座: 中央4星に印
        ...K.CUE_STARS(`            // 要人の座: 全ての星に金の印
            {
                getStarPoints(BOARD_SIZE).forEach(pt => {
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(251,191,36,0.8)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(251,191,36,0.5)';
                    ctx.font = (cellSize * 0.24) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('要', cx, cy);
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'要人の四方を塞いで駕籠 +' + (P('kago_pts') ?? 2)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            駕籠碁: 星は中立の要人。座の隣接4方を自石で塞ぐと駕籠で担ぎ+2目 (要人は空点のまま残る)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '全ての星は中立の「要人」の座。座の上下左右4方を自分の石で全て塞ぐと駕籠で担ぎ+2目。',
            '座自体は空点のまま残り、取り合いになる。ただし座の四方は実質的に囲い争い — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const pt = getStarPoints(BOARD_SIZE)[0]; // 要人の座
        board[(pt.y - 1) * BOARD_SIZE + pt.x] = 1;
        board[(pt.y + 1) * BOARD_SIZE + pt.x] = 1;
        board[pt.y * BOARD_SIZE + pt.x - 1] = 1;
        executeMove({ cells: [{ x: pt.x + 1, y: pt.y }] }, 1); // 最後の方角を塞ぐ
        assert('四方を塞ぐと駕籠+2', captures[1] === 2);
        assert('要人の座は空点のまま', board[pt.y * BOARD_SIZE + pt.x] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
