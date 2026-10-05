// ORDERCARDGO — 手順碁: 着手は「順番カード」が示す区域のみ。4枚使い切ると巡って再利用できる
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
const ST_INIT = `{ cnt: { 1: 0, 2: 0 } }`;
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
    file: 'ordercardgo.html',
    en: 'ORDERCARDGO',
    jp: '手順碁',
    prefix: 'ordercardgo',
    desc: '順番カードが指示する区域にしか打てない。4枚を使い切ると巡って再利用。',
    kind: 'stone',
    icon: 'ordercardgo',
    spec: [
        ...K.rb('ORDERCARDGO', '手順碁', 'ordercardgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 順番カード機構: 自分の手数 mod 4 が必須区域 (左上→右上→右下→左下) を決める
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 手順碁: 順番カード (区域は時計回りに巡回、使い切るまで前の区域は使えない)
        const ORDER_ZONES = ['左上', '右上', '右下', '左下'];
        function orderZoneOK(p, player) {
            const mid = (BOARD_SIZE - 1) / 2;
            const z = st.cnt[player] % 4;
            const L = p.x <= mid, R = p.x >= mid, T = p.y <= mid, B = p.y >= mid;
            if (z === 0) return L && T;
            if (z === 1) return R && T;
            if (z === 2) return R && B;
            return L && B;
        }
        function isValidPlacement(cells, player) {`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 手順碁: 順番カードが示す区域外には打てない
            if (!orderZoneOK(cells[0], player)) return false;`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            st.cnt[player]++; // 手順カードを1枚消費

            turn = opponent;`],
        // 現在の必須区域を薄くハイライト
        K.CUE_GRID(`            // 手順カードの必須区域ハイライト
            if (!gameOver && gamePhase === 'playing') {
                const mid = (BOARD_SIZE - 1) / 2;
                const z = st.cnt[turn] % 4;
                const x0 = (z === 0 || z === 3) ? -0.5 : mid;
                const y0 = (z < 2) ? -0.5 : mid;
                ctx.save();
                ctx.fillStyle = 'rgba(56,189,248,0.07)';
                ctx.fillRect(padding + x0 * cellSize, padding + y0 * cellSize,
                    (mid + 0.5) * cellSize + (z === 0 || z === 3 ? cellSize * 0.5 : cellSize * 0.5),
                    (mid + 0.5) * cellSize + (z < 2 ? cellSize * 0.5 : cellSize * 0.5));
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'手順カード: ' + ORDER_ZONES[st.cnt[turn] % 4]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            手順碁: 着手できる区域は順番カードの指示通り (左上→右上→右下→左下)。4枚使い切ると巡る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '毎手、順番カードが示す区域 (四象限) にしか石を置けない。',
            'カードは左上→右上→右下→左下の順。4枚使い切ると最初から巡って再利用できる。',
            '打てる区域が限られるので、進行方向を読んで布石する読み合いの碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cnt = { 1: 0, 2: 0 };
        const mid = (BOARD_SIZE - 1) / 2;
        assert('1枚目は左上区域のみ', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
        assert('左上以外は不可', isValidPlacement([{ x: Math.ceil(mid) + 2, y: Math.ceil(mid) + 2 }], 1) === false);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('カードを消費', st.cnt[1] === 1);
        assert('2枚目は右上区域のみ', isValidPlacement([{ x: Math.ceil(mid) + 2, y: 2 }], 1) === true);
        executeMove({ cells: [{ x: Math.ceil(mid) + 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('白も1枚消費', st.cnt[2] === 1);
        assert('起動して通常着手可', typeof orderZoneOK === 'function');
    `,
};
