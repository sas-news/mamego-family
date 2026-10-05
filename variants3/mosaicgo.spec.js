// MOSAICGO — 嵌像碁: 自石で「鶴」の模様 (V字5連) を完成させると即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'mosaicgo.html',
    en: 'MOSAICGO',
    jp: '嵌像碁',
    prefix: 'mosaicgo',
    desc: '自石でV字の鶴模様 (5個) を完成させると嵌像勝ち。',
    kind: 'stone',
    icon: 'mosaicgo',
    spec: [
        ...K.rb('MOSAICGO', '嵌像碁', 'mosaicgo'),
        K.params([
            { key: 'crane_span', label: '鶴紋の大きさ', min: 1, max: 5, def: 2, unit: 'マス', hint: '斜めに並ぶ羽根のマス数' },
            { key: 'cap', label: '打ち切り手数', min: 50, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 鶴判定関数 + 手番終了時の模様チェック
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 鶴模様: 頂点から翼へ広がるV字5連を4方向で検査
        function craneHit(player) {
            const __sp = Math.max(1, P('crane_span') || 2);
            const base = [[0, 0]];
            for (let k = 1; k <= __sp; k++) { base.push([-k, k], [k, k]); }
            const rots = [
                base,
                base.map(([x, y]) => [y, -x]),
                base.map(([x, y]) => [-x, -y]),
                base.map(([x, y]) => [-y, x])
            ];
            for (let py = 0; py < BOARD_SIZE; py++) {
                for (let px = 0; px < BOARD_SIZE; px++) {
                    for (const r of rots) {
                        let ok = true;
                        for (const [dx, dy] of r) {
                            const x = px + dx, y = py + dy;
                            if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE
                                || board[y * BOARD_SIZE + x] !== player) { ok = false; break; }
                        }
                        if (ok) return { x: px, y: py };
                    }
                }
            }
            return null;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 嵌像判定: 自石で鶴模様が完成していれば即勝ち
            {
                const hit = craneHit(player);
                if (hit) {
                    const ci = hit.y * BOARD_SIZE + hit.x;
                    fxGlow(ci, '#facc15', 1000);
                    fxText(ci, '鶴の舞!', '#facc15', 1400);
                    fxShake(6, 380);
                    winByRule(player, '嵌像勝ち', '石で鶴の模様を完成させました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, K.INFO_BASE, `            嵌像碁: 自石でV字の鶴模様 (5個) を完成させると嵌像勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石が「鶴」の模様 — 頂点1つから左右へ2つずつ翼を広げたV字5連 — をどこかに完成させると嵌像勝ち。',
            '向きは4方向どれでもよい。模様の石は普通に取られるので、嵌め合いと崩し合いの攻防になる。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof craneHit === 'function');
        // V字: 頂点(4,4) 翼(3,5)(5,5) 翼端(2,6)(6,6)
        board[4 * BOARD_SIZE + 4] = 1;
        board[5 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 5] = 1;
        board[6 * BOARD_SIZE + 2] = 1; board[6 * BOARD_SIZE + 6] = 1;
        assert('鶴模様を検出', craneHit(1) !== null);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('鶴完成で即勝ち', gameOver === true && gameResultData && gameResultData.title.includes('嵌像'));
        board.fill(0); gameOver = false;
        board[4 * BOARD_SIZE + 4] = 1;
        board[5 * BOARD_SIZE + 3] = 1; board[5 * BOARD_SIZE + 5] = 1;
        board[6 * BOARD_SIZE + 2] = 1; // 翼端が1つ欠けた不完全形
        assert('不完全なら検出しない', craneHit(1) === null);
    `,
};
