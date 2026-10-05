// STRINGFIELDGO — 絃楽碁: 一直線に3石以上の連は「絃」。張った絃は振動で両端の孤立敵石を揺らす
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
    file: 'stringfieldgo.html',
    en: 'STRINGFIELDGO',
    jp: '絃楽碁',
    prefix: 'stringfieldgo',
    desc: '一直線3石以上の連は絃。絃を張ると両端に隣接する孤立敵石が振動で落ちる。',
    kind: 'stone',
    icon: 'stringfieldgo',
    spec: [
        ...K.rb('STRINGFIELDGO', '絃楽碁', 'stringfieldgo'),
        K.params([
            { key: 'string_len', label: '絃に必要な石数', min: 2, max: 6, def: 3, unit: '石' },
        ]),
        // 絃の張力: 着手で一直線3石以上の連が張られると、両端に接する孤立敵石が振動で落ちる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 絃: 着手点を通る一直線 (横・縦) の自石が3石以上 → 弦が張った。その両端の孤立敵石が落ちる
            {
                const x0 = move.cells[0].x, y0 = move.cells[0].y;
                const dirs = [[1, 0], [0, 1]];
                let dropped = 0;
                for (const [dx, dy] of dirs) {
                    // 着手点を通る方向の連続自石を集める
                    const line = [y0 * BOARD_SIZE + x0];
                    for (let s = 1; ; s++) { const x = x0 + dx * s, y = y0 + dy * s; if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y * BOARD_SIZE + x] !== player) break; line.push(y * BOARD_SIZE + x); }
                    for (let s = 1; ; s++) { const x = x0 - dx * s, y = y0 - dy * s; if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y * BOARD_SIZE + x] !== player) break; line.push(y * BOARD_SIZE + x); }
                    if (line.length < (P('string_len') || 3)) continue; // 規定数未満は絃にならない
                    // 絃の両端の外側のマスを調べる
                    const coords = line.map(i => [i % BOARD_SIZE, Math.floor(i / BOARD_SIZE)]);
                    const minD = Math.min.apply(null, coords.map(c => dx ? c[0] : c[1]));
                    const maxD = Math.max.apply(null, coords.map(c => dx ? c[0] : c[1]));
                    for (const d2 of [minD - 1, maxD + 1]) {
                        const ex = dx ? d2 : x0, ey = dx ? y0 : d2;
                        if (ex < 0 || ex >= BOARD_SIZE || ey < 0 || ey >= BOARD_SIZE) continue;
                        const ei = ey * BOARD_SIZE + ex;
                        if (board[ei] !== opponent) continue;
                        const g = getConnectedGroup(ei, opponent);
                        if (g.length === 1) { // 孤立敵石だけが振動で落ちる
                            board[ei] = 0;
                            captures[player]++;
                            dropped++;
                            fxBurst(ei, '#f0abfc', 10, 1.5);
                            fxText(ei, '弦が弾いた!', '#f0abfc', 1100);
                        }
                    }
                    if (line.length >= (P('string_len') || 3)) line.forEach(j => fxGlow(j, '#e879f9', 600));
                }
                if (dropped) { fxShake(5, 320); cleanUpPieces(); }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'直線3連で絃が張る — 両端の孤立敵が落ちる'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            絃楽碁: 着手点を通る横/縦の自石が一直線3石以上で絃が張る。絃の両端に接する孤立敵石が振動で落ちる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手点を通る横または縦の連続自石が3石以上になると「絃」が張る。',
            '張った絃の両端に接する孤立した敵石 (連1石) は振動で落ちてアゲハマに。敵は連ねれば落ちない。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1;
        board[4 * BOARD_SIZE + 7] = 2; // 絃の右端の外に孤立敵石
        board[4 * BOARD_SIZE + 2] = 2; board[3 * BOARD_SIZE + 2] = 2; // 左端の外は敵連 (2石) — 連は耐える
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1); // (4,4)-(6,4) で横3連 → 絃
        assert('絃の右端の孤立敵が落ちる', board[4 * BOARD_SIZE + 7] === 0 && captures[1] === 1);
        assert('連ねた敵は落ちない', board[4 * BOARD_SIZE + 2] === 2 && board[3 * BOARD_SIZE + 2] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
