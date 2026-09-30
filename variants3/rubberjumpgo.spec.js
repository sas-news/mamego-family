// RUBBERJUMPGO — ゴム跳碁: 自石-敵石連-自石の直線を完成させるとゴム跳び越え得点 (方向ごとに+1目)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'rubberjumpgo.html',
    en: 'RUBBERJUMPGO',
    jp: 'ゴム跳碁',
    prefix: 'rubberjumpgo',
    desc: '新しい石が敵連の列を跳び越える形 (自-敵+-自の直線) を作ると方向ごとに+1目。',
    kind: 'stone',
    icon: 'rubberjumpgo',
    spec: [
        ...K.rb('RUBBERJUMPGO', 'ゴム跳碁', 'rubberjumpgo'),

        // ゴム跳び: 置いた石から各方向に 敵(1個以上)-自石 と並べば跳び越し得点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ゴム跳碁: 新着手-敵連-自石の直線を作ると跳び越し +1目/方向
            {
                const bx = move.cells[0].x, by = move.cells[0].y;
                let jumps = 0;
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    let x = bx + dx, y = by + dy, sawFoe = false;
                    while (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) {
                        const v = board[y * BOARD_SIZE + x];
                        if (v === opponent) { sawFoe = true; x += dx; y += dy; continue; }
                        if (v === player && sawFoe) jumps++;
                        break;
                    }
                });
                if (jumps > 0) {
                    captures[player] += jumps;
                    fxText(by * BOARD_SIZE + bx, jumps + '人跳び!', '#4ade80', 1200);
                    fxGlow(by * BOARD_SIZE + bx, '#4ade80', 800);
                }
            }

            turn = opponent;`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            ゴム跳碁: 新着手が敵連と自石の直線 (自-敵-自) を完成させると跳び越し得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '新たに置いた石から一直線に「敵石1個以上 → 自石」と続く形ができると、その敵連を跳び越えたことになり方向ごとに+1目。',
            '跳び越えても敵石は取れない (得点のみ)。一度に複数方向へ跳べる。',
            '敵の列を挟み込む攻めと跳び越し得点の二重の圧力。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 6] = 2; board[4 * BOARD_SIZE + 7] = 2; board[4 * BOARD_SIZE + 8] = 1; // 白2連-黒
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 黒-白白-黒 で跳び越え
        assert('敵連を跳び越して+1目', captures[1] === 1);
        assert('跳んだ敵は取られない', board[4 * BOARD_SIZE + 6] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('跳べない着手は得点なし', captures[2] === 0);
    `,
};
