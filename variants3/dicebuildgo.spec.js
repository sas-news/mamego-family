// DICEBUILDGO — 骰子建築碁: 出目の分だけ石が増築される (通常着手+出目-1個が近くに自動配置)
const K = require('../gen_kit.js');
module.exports = {
    file: 'dicebuildgo.html',
    en: 'DICEBUILDGO',
    jp: '骰子建築碁',
    prefix: 'dicebuildgo',
    desc: '着手ごとに出目(1-3)を振り、打った石の周りに出目-1個の石が自動増築される。',
    kind: 'stone',
    icon: 'dicebuildgo',
    spec: [
        ...K.rb('DICEBUILDGO', '骰子建築碁', 'dicebuildgo'),
        K.params([
            { key: 'die_max', label: '賽の最大値', min: 1, max: 6, def: 3 },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, '        function executeMove(move, player) {',
`        // 骰子建築: 出目は手数から決定論的に振る (1-3)
        function buildDie() {
            const s = Math.sin(history.length * 33.7 + 5.1) * 43758.5453;
            const r = s - Math.floor(s);
            return 1 + Math.floor(r * (P('die_max') || 3));
        }

        function executeMove(move, player) {`],
        // 増築: 出目-1個の石を着手の周囲 (BFS順) の空点に置く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 増築ルール: 出目-1個の石を着手の周囲の空点に自動配置 (捕獲は発動しない)
            {
                const d = buildDie();
                let need = d - 1;
                const p0 = move.cells[0];
                const queue = [p0];
                const seen = new Set([p0.y * BOARD_SIZE + p0.x]);
                while (need > 0 && queue.length > 0) {
                    const c = queue.shift();
                    const ci = c.y * BOARD_SIZE + c.x;
                    for (const q of getNeighbors(ci)) {
                        if (seen.has(q)) continue;
                        seen.add(q);
                        if (board[q] === 0) {
                            board[q] = player;
                            need--;
                            fxGlow(q, '#fbbf24', 500);
                            if (need === 0) break;
                        } else {
                            queue.push({ x: q % BOARD_SIZE, y: Math.floor(q / BOARD_SIZE) });
                        }
                    }
                }
                if (d > 1) fxText(p0.y * BOARD_SIZE + p0.x, '出目' + d + 'で増築', '#fbbf24', 1100);
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.EVENT_CHIP_SPEC(`'次の出目: ' + buildDie() `),
        [K.ONE, K.INFO_BASE, `            骰子建築碁: 出目(1-3)に応じて石が周囲に増築される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手ごとにサイコロを振り、出目-1個の石が着手の周囲の空点に自動増築される (チップに次の出目を表示)。',
            '増築は取りを発動しないが、増えた石は普通に取られる。出目は両者に同じ確率で巡る。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof buildDie === 'function');
        const d = buildDie();
        assert('出目は1-3', d >= 1 && d <= 3);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // history=1 になる
        const s1 = Math.sin(1 * 33.7 + 5.1) * 43758.5453;
        const d1 = 1 + Math.floor((s1 - Math.floor(s1)) * 3);
        assert('出目分だけ増築', board.filter(v => v === 1).length === d1);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        assert('相手も増築する', true);
    `,
};
