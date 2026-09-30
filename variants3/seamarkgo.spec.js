// SEAMARKGO — 灯台碁: 4隅の灯台が航路を照らす。灯台の光 (マンハッタン3以内) にある連は+1呼吸
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
    file: 'seamarkgo.html',
    en: 'SEAMARKGO',
    jp: '灯台碁',
    prefix: 'seamarkgo',
    desc: '4隅の灯台の光 (3以内) にある連は安全で+1呼吸。',
    kind: 'stone',
    icon: 'seamarkgo',
    spec: [
        ...K.rb('SEAMARKGO', '灯台碁', 'seamarkgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 灯台: 四隅から1つ内側の4点
        function lighthouseIdx() {
            const B = BOARD_SIZE;
            return [B + 1, B + (B - 2), (B - 2) * B + 1, (B - 2) * B + (B - 2)];
        }
        // 灯台の光: いずれかの灯台からマンハッタン距離3以内
        function inBeam(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return lighthouseIdx().some(li => {
                const lx = li % BOARD_SIZE, ly = (li / BOARD_SIZE) | 0;
                return Math.abs(x - lx) + Math.abs(y - ly) <= 3;
            });
        }`],
        // 捕獲判定: 灯台の光の中の連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (group.some(gi => inBeam(gi))) liberties += 1; // 灯台の光に守られた連は+1呼吸

                    if (liberties <= 0) {`],
        // 灯台と光域を描く
        K.CUE_GRID(`            // 灯台: 四隅に光の輪、光域をうっすら照らす
            {
                ctx.save();
                lighthouseIdx().forEach(li => {
                    const lx = li % BOARD_SIZE, ly = (li / BOARD_SIZE) | 0;
                    const cx = padding + lx * cellSize, cy = padding + ly * cellSize;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 3.6);
                    g.addColorStop(0, 'rgba(250,204,21,0.25)');
                    g.addColorStop(1, 'rgba(250,204,21,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - cellSize * 3.6, cy - cellSize * 3.6, cellSize * 7.2, cellSize * 7.2);
                    ctx.fillStyle = 'rgba(202,138,4,0.9)';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - cellSize * 0.3); ctx.lineTo(cx + cellSize * 0.2, cy + cellSize * 0.2);
                    ctx.lineTo(cx - cellSize * 0.2, cy + cellSize * 0.2); ctx.closePath(); ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            灯台碁: 4隅の灯台の光 (3以内) にある連は安全水域で+1呼吸<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅の内側に4つの灯台 — 光 (黄の照らし) はマンハッタン3以内を照らす。',
            '灯台の光の中にある連は安全水域で呼吸点+1 — 取られにくい。',
            '光の外は荒海。隅を拠点にするか中央に出るか、航海の読みが勝負。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const li = lighthouseIdx();
        assert('灯台は4基', li.length === 4);
        assert('灯台近傍は光の中', inBeam(li[0]) === true && inBeam(li[0] + 1) === true);
        assert('中央は光の外', inBeam(I(6, 6)) === false);
        // 光の中の連は囲まれても+1で生きる
        board[li[0]] = 1;
        getNeighbors(li[0]).forEach(n => board[n] = 2);
        assert('灯台の光の連は取られない', !getCapturedStones(board, 1).includes(li[0]));
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
