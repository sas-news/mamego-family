// ONMYOGO — 陰陽碁: 列は五行(木火土金水)。相生の向きで隣の敵石を砕き、生じる側は砕かれる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'onmyogo.html',
    en: 'ONMYOGO',
    jp: '陰陽碁',
    prefix: 'onmyogo',
    desc: '列は五行 (木火土金水) が巡る。置いた石は右隣の敵石を砕き、左隣に敵石があれば自石が砕かれる。',
    kind: 'stone',
    icon: 'onmyogo',
    spec: [
        ...K.rb('ONMYOGO', '陰陽碁', 'onmyogo'),
        K.params([
            { key: 'flow', label: '相生の向き', options: [{ v: 'fwd', l: '右へ流れる' }, { v: 'rev', l: '左へ流れる' }], def: 'fwd' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        // 五行ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 五行: 列 x%5 が木火土金水。相生は e が (e+1)%5 を生じる一方向
        const ONMYO_EL = ['木', '火', '土', '金', '水'];
        function onmyoEl(i) { return (i % BOARD_SIZE) % 5; }
        function onmyoElColor(e) {
            return ['#22c55e', '#ef4444', '#eab308', '#e2e8f0', '#3b82f6'][e];
        }

        function endGameByScore() {`],
        // 相生: 通常の取りの後に五行の力を適用
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 相生: 着手石は右隣 (相生の先) の敵石を砕き、左隣 (相生の元) に敵石があれば自石が砕かれる
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[cell] === player) {
                    const el = onmyoEl(cell);
                    const __f = P('flow') === 'rev' ? 4 : 1; // 相生の向き (rev は逆向き)
                    const targets = [], threats = [];
                    getNeighbors(cell).forEach(nb => {
                        if (board[nb] === opponent) {
                            if (onmyoEl(nb) === (el + __f) % 5) targets.push(nb);       // 自分が生じる側 → 砕く
                            else if (el === (onmyoEl(nb) + __f) % 5) threats.push(nb);  // 相手に生じられる → 砕かれる
                        }
                    });
                    targets.forEach(nb => {
                        board[nb] = 0;
                        captures[player]++;
                        fxBurst(nb, onmyoElColor(onmyoEl(nb)), 12);
                    });
                    if (threats.length) {
                        board[cell] = 0;
                        captures[opponent]++;
                        fxBurst(cell, '#64748b', 14);
                        fxText(cell, '破', '#cbd5e1', 1100);
                    }
                    if (targets.length || threats.length) {
                        cleanUpPieces();
                        fxShake(4, 300);
                    }
                }
            }

            turn = opponent;`],
        // 列ごとの五行色を帯に描く
        K.CUE_GRID(`            // 陰陽: 列の五行を下端の帯に
            {
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.fillStyle = onmyoElColor(x % 5);
                    ctx.globalAlpha = 0.28;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (BOARD_SIZE - 0.5) * cellSize - 3, cellSize, 3);
                }
                ctx.globalAlpha = 1;
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            陰陽碁: 列は五行が巡る。置いた石は右隣の敵石を砕き、左隣に敵石があれば自石が砕かれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各列は左から木→火→土→金→水の五行が巡り、相生 (木生火・火生土・土生金・金生水・水生木) の力が右へ流れる (盤下端の帯で確認)。',
            '置いた石は右隣の列 (生じる先) の敵石を砕いて取り石にする。逆に左隣 (生じる元) に敵石があると、置いた石自身が砕かれて相手の取り石になる。',
            '同じ列の上下は同じ行なので影響しない。普通の取り (呼吸) とは別に働く。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[0 * B + 2] = 2; // (x=2) 土列に白石
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // (x=1) 火列 → 土は火の生じる先
        assert('火は土(右隣)を砕く', board[0 * B + 2] === 0 && captures[1] === 1);
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[0 * B + 0] = 2; // (x=0) 木列に白石
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // (x=1) 火列 → 木(左隣)に生じられ砕かれる
        assert('火は木(左隣)に砕かれる', board[0 * B + 1] === 0 && captures[2] === 1);
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[0 * B + 4] = 2; // (x=4) 水列に白石
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // (x=5) 木列 → 水(左隣)に生じられ砕かれる
        assert('木は水(左隣)に砕かれる', board[0 * B + 5] === 0 && captures[2] === 1);
        board.fill(0); captures = { 1: 0, 2: 0 };
        board[0 * B + 2] = 2; // (x=2) 土列に白石
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1); // 同じ土列の上下 → 影響なし
        assert('同じ行の上下は影響なし', board[0 * B + 2] === 2 && board[1 * B + 2] === 1);
    `,
};
