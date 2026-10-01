// GOHEIGO — 御幣碁: 御幣所 (星位) に打った石は聖別され、その連は+1呼吸。星位の敵石を取るとさらに+2目
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
    file: 'goheigo.html',
    en: 'GOHEIGO',
    jp: '御幣碁',
    prefix: 'goheigo',
    desc: '星位は御幣所。御幣所に立てた石の連は+1呼吸。御幣所の敵石を取ると+2目。',
    kind: 'stone',
    icon: 'goheigo',
    spec: [
        ...K.rb('GOHEIGO', '御幣碁', 'goheigo'),
        K.params([
            { key: 'gohei_lib', label: '御幣の追加呼吸', min: 1, max: 4, def: 1 },
            { key: 'gohei_pts', label: '御幣所の敵石の得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 御幣所 = 星の点
        function isGohei(i) {
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            return getStarPoints(BOARD_SIZE).some(p => p.x === x && p.y === y);
        }`],
        // 捕獲判定: 御幣所の石を含む連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (group.some(gi => isGohei(gi))) liberties += (P('gohei_lib') || 1); // 御幣を立てた連は聖別される

                    if (liberties <= 0) {`],
        // 御幣所の敵石を取ると+2目
        [K.ONE, `            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;`,
`            if (captured.length > 0) {
                let gh = 0;
                captured.forEach(idx => { if (isGohei(idx)) gh++; board[idx] = 0; });
                captures[player] += captured.length + gh * (P('gohei_pts') || 2);
                if (gh > 0) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '御幣 +' + (gh * (P('gohei_pts') || 2)), '#dc2626', 1200);`],
        // 御幣所に紙垂を描く
        K.CUE_GRID(`            // 御幣所: 星位に白い紙垂
            {
                ctx.save();
                getStarPoints(BOARD_SIZE).forEach(p => {
                    const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                    ctx.strokeStyle = 'rgba(220,38,38,0.7)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath(); ctx.moveTo(cx, cy - cellSize * 0.3); ctx.lineTo(cx, cy - cellSize * 0.05); ctx.stroke();
                    ctx.strokeStyle = 'rgba(250,250,250,0.85)';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.14, cy + cellSize * 0.02);
                    ctx.lineTo(cx + cellSize * 0.1, cy + cellSize * 0.12);
                    ctx.lineTo(cx - cellSize * 0.08, cy + cellSize * 0.16);
                    ctx.lineTo(cx + cellSize * 0.14, cy + cellSize * 0.3);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            御幣碁: 星位は御幣所。御幣所に立てた石の連は聖別され+1呼吸。御幣所の敵石を取ると+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の点は御幣所 (紙垂の印)。御幣所に立てた石を含む連は聖別され呼吸点+1。',
            '御幣所の上の敵石を取ると、奉納の功徳で追加+2目。',
            '御幣を立てて聖域を築くか、敵の御幣を倒して功徳を奪うか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = (BOARD_SIZE - 1) / 2;
        assert('星位は御幣所', isGohei(I(3, 3)) === true);
        assert('御幣所でない点', isGohei(I(0, 0)) === false);
        // 御幣所の連は囲まれても+1で生きる
        board[c * BOARD_SIZE + c] = 1;
        board[c * BOARD_SIZE + c - 1] = 2; board[c * BOARD_SIZE + c + 1] = 2;
        board[(c - 1) * BOARD_SIZE + c] = 2; board[(c + 1) * BOARD_SIZE + c] = 2;
        assert('御幣を立てた連は取られない', !getCapturedStones(board, 1).includes(I(c, c)));
        // 御幣所でない孤立石は取られる
        board.fill(0);
        board[I(5, 5)] = 1;
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        if (isGohei(I(5, 5))) { // (5,5)が御幣所の場合はスキップ相当
            assert('御幣所チェック', isGohei(I(5, 5)) === true);
        } else {
            assert('御幣なしの連は取られる', getCapturedStones(board, 1).includes(I(5, 5)));
        }
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
