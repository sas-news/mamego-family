// KARESANSUIGO — 枯山碁: 石と砂紋(空点)で山水を表現。単色の空区域は砂紋として倍の地
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'karesansuigo.html',
    en: 'KARESANSUIGO',
    jp: '枯山碁',
    prefix: 'karesansuigo',
    desc: '石と砂紋の山水。一色だけで囲んだ空区域は「砂紋」となり地が2倍になる。',
    kind: 'stone',
    icon: 'karesansuigo',
    spec: [
        ...K.rb('KARESANSUIGO', '枯山碁', 'karesansuigo'),
        K.params([
            { key: 'sand_mult', label: '砂紋ボーナス倍率', min: 0, max: 4, def: 1, hint: '区域の点数×この倍率' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 砂紋ボーナス: 一色だけに接する空区域の点ごとに+1 (通常の地に加算)
        [K.ONE, `        function endGameByScore() {`,
`        // 砂紋: 空区域が一方の色の石にだけ接していれば、その色の砂紋になる
        function sandBonus(player) {
            const visited = new Set();
            let bonus = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 0 || visited.has(i)) continue;
                const q = [i]; visited.add(i);
                let touch = true, edge = false, n = 0;
                while (q.length) {
                    const cur = q.shift(); n++;
                    const cx = cur % BOARD_SIZE, cy = Math.floor(cur / BOARD_SIZE);
                    if (cx === 0 || cy === 0 || cx === BOARD_SIZE - 1 || cy === BOARD_SIZE - 1) edge = true;
                    getNeighbors(cur).forEach(m => {
                        if (board[m] === 0) { if (!visited.has(m)) { visited.add(m); q.push(m); } }
                        else if (board[m] !== player) touch = false;
                    });
                }
                if (touch && !edge) bonus += n * (P('sand_mult') ?? 1); // 砂紋は盤端に届かない囲まれた区域のみ
            }
            return bonus;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + sandBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + sandBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>砂紋:</span> <strong>黒 \${sandBonus(1)} / 白 \${sandBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            枯山碁: 一色だけに囲まれた空区域は「砂紋」— その色に区域の点と同数のボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石は山、空点は砂。一方の色の石だけに接する空区域は「砂紋」となり、区域の点ごとに+1目のボーナス。',
            '単色で描いた大きな砂紋ほど価値が高い — 混色の荒れた区域には価値がない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        // (1,1) を黒4石で囲む → 1点の砂紋
        [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        assert('単色区域は砂紋ボーナス', sandBonus(1) === 1);
        assert('白には砂紋なし', sandBonus(2) === 0);
        board[5 * BOARD_SIZE + 5] = 2; // 白を遠くに置くと黒区域が伸びて失われる訳ではない (接続しない区域のみ)
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
