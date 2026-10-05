// HORAGAIGO — 法螺碁: 四辺中央の法螺貝を吹くと山伏(石)が集まる。吹いた瞬間+3目
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
    file: 'horagaigo.html',
    en: 'HORAGAIGO',
    jp: '法螺碁',
    prefix: 'horagaigo',
    desc: '四辺の中央点は法螺貝。吹く(置く)と山伏が集まり即座に+3目のアゲハマ。',
    kind: 'stone',
    icon: 'horagaigo',
    spec: [
        ...K.rb('HORAGAIGO', '法螺碁', 'horagaigo'),
        K.params([
            { key: 'conch_pts', label: '法螺の得点', min: 1, max: 9, def: 3, unit: '目' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 法螺貝の点: 四辺の中央
        function conchIdxs() {
            const c = Math.floor(BOARD_SIZE / 2);
            return [c, c * BOARD_SIZE, c * BOARD_SIZE + BOARD_SIZE - 1,
                    (BOARD_SIZE - 1) * BOARD_SIZE + c];
        }`],
        // 法螺貝を吹く: 吹いた瞬間に山伏が集まり+3
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 法螺ルール: 法螺貝の点に置くと吹き鳴らされ、山伏が集まって+3
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (conchIdxs().includes(mi)) {
                    captures[player] += (P('conch_pts') || 3);
                    fxGlow(mi, '#f97316', 900);
                    fxText(mi, '法螺 +' + (P('conch_pts') || 3), '#fb923c', 1300);
                    fxShake(4, 300);
                    fxBurst(mi, '#fdba74', 12, 1.6);
                }
            }

            turn = opponent;`],
        // 法螺貝の描画: 四辺中央に貝殻マーク
        K.CUE_STARS(`            // 法螺貝: 四辺中央の空点に貝殻の印
            {
                conchIdxs().forEach(i => {
                    if (board[i] !== 0) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(234,88,12,0.7)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.24, Math.PI * 0.3, Math.PI * 1.9);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.11, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'法螺: 四辺中央を吹くと+3'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            法螺碁: 四辺の中央点は法螺貝。吹くと山伏が集まり即座に+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '四辺の中央点には法螺貝が置かれている。そこに石を置くと吹き鳴らされ、山伏が集まって即座に+3目。',
            '四点全てが双方に開かれた対称ルール — 端の法螺を先に制するか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: 0 }] }, 1); // 上辺中央の法螺
        assert('法螺で+3', captures[1] === 3);
        executeMove({ cells: [{ x: 0, y: c }] }, 2); // 左辺中央
        assert('白も吹ける', captures[2] === 3);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('法螺でない点は+0', captures[1] === 3);
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
