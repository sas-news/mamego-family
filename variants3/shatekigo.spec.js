// SHATEKIGO — 射的碁: 各側6手目の着手は弾丸。着地点の8近傍から敵石を1つ撃ち落とす (撃ち落としは景品で更に+1目)
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
const ST_INIT = `{ cnt: { 1: 0, 2: 0 }, prize: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'shatekigo.html',
    en: 'SHATEKIGO',
    jp: '射的碁',
    prefix: 'shatekigo',
    desc: '各側6手目は弾丸。着地点の8近傍から敵石を1つ撃ち落とし、景品で+1目。',
    kind: 'stone',
    icon: 'shatekigo',
    spec: [
        ...K.rb('SHATEKIGO', '射的碁', 'shatekigo'),
        K.params([
            { key: 'bullet_interval', label: '弾丸の間隔', min: 2, max: 12, def: 6, unit: '手' },
            { key: 'prize_pts', label: '景品の得点', min: 0, max: 5, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        // 各側6手目の着手は弾丸: 8近傍の敵石を1つ撃ち落とす (景品+1目)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 射的碁: 6手ごとの着手は弾丸 — 8近傍の敵石を1つ撃ち落とす
            st.cnt[player] = (st.cnt[player] || 0) + 1;
            if (st.cnt[player] % Math.max(1, P('bullet_interval') || 6) === 0) {
                const bc = move.cells[0];
                let target = -1;
                for (let dy = -1; dy <= 1 && target < 0; dy++) {
                    for (let dx = -1; dx <= 1 && target < 0; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = bc.x + dx, ny = bc.y + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                        if (board[ny * BOARD_SIZE + nx] === opponent) target = ny * BOARD_SIZE + nx;
                    }
                }
                if (target >= 0) {
                    board[target] = 0;
                    captures[player]++;
                    st.prize[player] += Math.max(1, P('prize_pts') || 1);
                    fxBurst(target, '#f43f5e', 12, 1.8);
                    fxText(target, '命中!', '#fb7185', 1000);
                    fxShake(3, 220);
                    cleanUpPieces();
                } else {
                    fxText(bc.y * BOARD_SIZE + bc.x, '空振り…', '#94a3b8', 800);
                }
            }

            turn = opponent;`],
        // 景品ボーナス: 撃ち落とし1つにつき+1目
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.prize[1];
            const whiteTotal = territory.white + captures[2] + komi + st.prize[2];`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>射的の景品:</span> <strong>黒 \${st.prize[1]} / 白 \${st.prize[2]}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        ...K.EVENT_CHIP_SPEC(`'弾丸まで ' + ((P('bullet_interval') || 6) - ((st.cnt[turn] || 0) % (P('bullet_interval') || 6))) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            射的碁: 各側6手目の着手は弾丸。着地点の8近傍から敵石を1つ撃ち落とす (景品+1目)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーの6手目ごとの着手は「弾丸」。着地点の8近傍にある敵石を1つ撃ち落とす。',
            '撃ち落とした敵石はアゲハマに加え「景品」として終局時に+1目。的が無ければ空振り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cnt = { 1: 0, 2: 0 }; st.prize = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[5 * BOARD_SIZE + 5] = 2; // 的
        for (let i = 0; i < 5; i++) executeMove({ cells: [{ x: i, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 6手目 = 弾丸 → (5,5)を撃ち落とす
        assert('的を撃ち落とした', board[5 * BOARD_SIZE + 5] === 0);
        assert('景品を獲得', st.prize[1] === 1 && captures[1] === 1);
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 12 }] }, 2);
        assert('白も6手目に弾丸を撃つ (的なし→空振りで景品0)', st.prize[2] === 0);
    `,
};
