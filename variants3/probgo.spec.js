// PROBGO — 確率碁: 着手は約15%の確率で隣接する空点に「ズレる」。(決定的ハッシュで再現可能)
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'probgo.html',
    en: 'PROBGO',
    jp: '確率碁',
    prefix: 'probgo',
    desc: '着手は約15%で隣の空点にズレる。狙い通りに置けるかは確率次第。',
    kind: 'stone',
    icon: 'probgo',
    spec: [
        ...K.rb('PROBGO', '確率碁', 'probgo'),
        K.params([{ key: 'slip_pct', label: '着手がズレる確率', min: 0, max: 60, def: 15, unit: '%' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        // 確率逸脱: 決定的ハッシュ (番地×手数) が15%未満なら隣接空点へズレる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            {
                const __p = move.cells[0];
                const __pi = __p.y * BOARD_SIZE + __p.x;
                let __final = __pi;
                const __roll = (__pi * 31 + history.length * 17) % 100;
                if (__roll < (P('slip_pct') || 15)) {
                    const __nb = getNeighbors(__pi).filter(i => board[i] === 0);
                    if (__nb.length > 0) {
                        const __t = __nb[(__pi + history.length) % __nb.length];
                        // 逸脱先が自殺点なら逸脱しない
                        const __tb = [...board];
                        __tb[__t] = player;
                        const __opp = player === 1 ? 2 : 1;
                        const __cap = getCapturedStones(__tb, __opp);
                        __cap.forEach(i => { __tb[i] = 0; });
                        if (getLiberties(__tb, __t) >= 1) __final = __t;
                    }
                }
                if (__final !== __pi) {
                    fxText(__final, 'ズレ!', '#fb7185', 1000);
                    fxGlow(__final, '#fb7185', 800);
                }
                board[__final] = player;
            }`],
        [K.ONE, K.INFO_ALGO, `            確率碁: 約15%の確率で着手が隣の空点にズレる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は約15%の確率で隣接する空点にズレて置かれる (確率分布に従う着陸)。',
            'ズレ先は盤面と手数から決まる — 双方同じ確率。自殺点へのズレは起きない。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // idx=3, history=1: roll=(93+17)%100=10 <15 → ズレる。nbr=[2,4,16] → t=nbr[(3+1)%3]=nbr[1]=4
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        assert('確率逸脱で隣に置かれる', board[3] === 0 && board[4] === 1);
        // idx=7, history=2: roll=(217+34)%100=51 ≥15 → そのまま
        executeMove({ cells: [{ x: 7, y: 0 }] }, 2);
        assert('確率外は所定の点', board[7] === 2);
        executeMove({ cells: [{ x: 0, y: 5 }] }, 1);
        assert('通常着手も可能', board[5 * BOARD_SIZE] === 1 || board[5 * BOARD_SIZE + 1] === 1 || board[4 * BOARD_SIZE] === 1 || board[6 * BOARD_SIZE] === 1);
    `,
};
