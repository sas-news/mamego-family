// MUKAEBIGO — 迎火碁: 彷徨う精霊(中立石)の隣に迎え火(石)を点し、多く点した側が精霊を迎える
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mukaebigo.html',
    en: 'MUKAEBIGO',
    jp: '迎火碁',
    prefix: 'mukaebigo',
    desc: '盤の精霊(中立)の隣に迎え火を点せ。隣接石が多い側が+4点で迎える。',
    kind: 'stone',
    icon: 'mukaebigo',
    spec: [
        ...K.rb('MUKAEBIGO', '迎火碁', 'mukaebigo'),
        K.params([
            { key: 'spirit_pts', label: '迎え火1箇所の得点', min: 0, max: 12, def: 4, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 精霊を四隅の星に配置 (中立障害 board=4)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            // 彷徨う精霊を四隅の星に置く (中立: 置けず呼吸も通らない)
            { const pts = getStarPoints(BOARD_SIZE).filter(pt =>
                pt.x !== Math.floor(BOARD_SIZE / 2) || pt.y !== Math.floor(BOARD_SIZE / 2));
              pts.forEach(pt => { board[pt.y * BOARD_SIZE + pt.x] = 4; }); }`],
        // 迎え判定ヘルパー: 精霊の隣の自石が相手より多ければ+4
        [K.ONE, `        function endGameByScore() {`, `        // 迎え判定: 各精霊について隣接する自石が相手より多ければ迎えた
        function mukaeBonus(pl) {
            const opp = pl === 1 ? 2 : 1;
            let n = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 4) continue;
                let a = 0, b = 0;
                getNeighbors(i).forEach(nb => {
                    if (board[nb] === pl) a++; else if (board[nb] === opp) b++;
                });
                if (a > 0 && a > b) n++;
            }
            return n * (P('spirit_pts') ?? 4);
        }

        function endGameByScore() {`],
        // 採点に迎え点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + mukaeBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + mukaeBonus(2);`],
        // 精霊を炎の玉で描く (デフォルトの幽霊円の上に重ねる)
        K.CUE_GRID(`            // 迎火: 中立の精霊を揺れる炎として描く
            {
                const now = fxNow();
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 4) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const fl = Math.sin(now / 300 + i) * cellSize * 0.04;
                    const g = ctx.createRadialGradient(cx, cy - fl, 0, cx, cy, cellSize * 0.5);
                    g.addColorStop(0, 'rgba(253,224,71,0.9)');
                    g.addColorStop(0.5, 'rgba(249,115,22,0.55)');
                    g.addColorStop(1, 'rgba(249,115,22,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy - cellSize * 0.05 - fl, cellSize * 0.26, cellSize * 0.38, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            迎火碁: 盤の星に彷徨う精霊がいる。精霊の隣に石(迎え火)を多く点した側が終局時に+4点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅の星には彷徨う精霊 (中立の炎) がいる。置けないが取られもしない。',
            '終局時、各精霊について隣接する自分の石が相手より多ければ、その精霊を迎えたとして+4点。',
            '同数ならどちらも迎えられない。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        const spts = getStarPoints(B).filter(pt => pt.x !== Math.floor(B / 2) || pt.y !== Math.floor(B / 2));
        const sp = spts[0];
        const si = sp.y * B + sp.x;
        board[si] = 4;
        assert('精霊の上には置けない', isValidPlacement([{ x: sp.x, y: sp.y }], 1) === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('迎え火なしは0点', mukaeBonus(1) === 0);
        getNeighbors(si).slice(0, 2).forEach(n => { board[n] = 1; });
        getNeighbors(si).slice(2).forEach(n => { board[n] = 2; });
        assert('同数なら迎えられない', mukaeBonus(1) === 0 && mukaeBonus(2) === 0);
        board[getNeighbors(si)[2]] = 1; // 3対1
        assert('多数派が迎える', mukaeBonus(1) === 4);
    `,
};
