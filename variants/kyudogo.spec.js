// KYUDOGO — 弓道碁: 着手は弓。四方の直線上で3点以上離れた敵石を、道が空いていれば射抜く
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            // 簡略化: 連続パスはそのまま採点終局
            if (consecutivePasses >= 2) {
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'kyudogo.html',
    en: 'KYUDOGO',
    jp: '弓道碁',
    prefix: 'kyudogo',
    desc: '着手は放たれる矢 — 四方の直線で3点以上離れ、途中が空の敵石を射抜く。',
    kind: 'stone',
    icon: 'kyudogo',
    spec: [
        ...K.rb('KYUDOGO', '弓道碁', 'kyudogo'),
        K.params([
            { key: 'arrow_min', label: '矢が届く最小距離', min: 2, max: 6, def: 3, unit: '点' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 弓道碁: 四方の直線で3点以上離れた敵石を射抜く (途中は空点のみ)
            {
                const mx = move.cells[0].x, my = move.cells[0].y;
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
                    for (let dist = Math.max(2, P('arrow_min') || 3); dist < BOARD_SIZE; dist++) {
                        const x = mx + d[0] * dist, y = my + d[1] * dist;
                        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) break;
                        const t = y * BOARD_SIZE + x;
                        if (board[t] !== 0) {
                            if (board[t] === opponent) {
                                // 間が全て空なら射抜く
                                let clear = true;
                                for (let s = 1; s < dist; s++) {
                                    if (board[(my + d[1] * s) * BOARD_SIZE + (mx + d[0] * s)] !== 0) { clear = false; break; }
                                }
                                if (clear) {
                                    board[t] = 0;
                                    captures[player]++;
                                    fxSlide((my * BOARD_SIZE + mx), t, '#f59e0b');
                                    fxBurst(t, '#fbbf24', 14);
                                    fxText(t, '的中', '#f59e0b', 1100);
                                }
                            }
                            break; // 直線上の最初の石で止まる
                        }
                    }
                });
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            弓道碁: 着手は矢 — 四方の直線で3点以上離れた敵石を、道が空いていれば射抜く<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いた石は弓を放つ: 四方の直線で3点以上離れた敵石を射抜いて取る。',
            '矢は途中に石があると届かない — 遮蔽のない正対のみ。',
            '遠間の敵を射る — 列・行のライン感覚が鍵。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[I(4, 4)] = 2; // (4,1)の下3点先
        board[I(4, 2)] = 2; // 近すぎる敵 (dist 2)
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1); // 上から放つ — (4,2)が遮蔽で(4,4)には届かず
        assert('遮蔽の向こうは射抜けない', board[I(4, 4)] === 2);
        board.fill(0); pieces = []; captures = { 1: 0, 2: 0 };
        board[I(4, 4)] = 2; // 下レイ遠間 (dist4)
        board[I(3, 0)] = 2; // 左レイ至近 (dist1)
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('道が空けば遠くを射抜く', board[I(4, 4)] === 0 && captures[1] === 1);
        assert('至近の敵は射抜かない', board[I(3, 0)] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
