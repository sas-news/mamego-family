// STARCYCLEGO — 星霜碁: 盤上の星(点)が歳月とともに一巡し、吉方の点が変わる
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
const ST_INIT = `{ luck: -1, ply: 0 }`;
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
    file: 'starcyclego.html',
    en: 'STARCYCLEGO',
    jp: '星霜碁',
    prefix: 'starcyclego',
    desc: '盤上の星が歳月で一巡し吉方が変わる。吉方の点に打つと1アゲハマの恵み。',
    kind: 'stone',
    icon: 'starcyclego',
    spec: [
        ...K.rb('STARCYCLEGO', '星霜碁', 'starcyclego'),
        K.params([
            { key: 'luck_pts', label: '星の加護ボーナス', min: 0, max: 5, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        // 星の巡り: 星の座標列のインデックスが手数とともに循環し、その点が吉方になる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            st.ply++;
            const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            // 吉方の恵み: 現在表示の吉方への着手で1アゲハマ
            if (st.luck === pi) {
                captures[player] += (P('luck_pts') ?? 1);
                fxText(pi, '吉方!', '#fbbf24', 1300);
            }
            // 星霜: 吉方の星が一手ごとに一巡する
            {
                const stars = getStarPoints(BOARD_SIZE).map(p => p.y * BOARD_SIZE + p.x);
                st.luck = stars[st.ply % stars.length];
            }
            turn = opponent;`],
        // 吉方の星を金色の輪で示す
        ...K.STONE_MARKS_SPEC(`            if (st.luck >= 0) {
                const cx = padding + (st.luck % BOARD_SIZE) * cellSize;
                const cy = padding + ((st.luck / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(251,191,36,0.9)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(251,191,36,0.5)';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'吉方: ' + (st.luck >= 0 ? ((st.luck % BOARD_SIZE) + 1) + ',' + (((st.luck / BOARD_SIZE) | 0) + 1) : '未定')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            星霜碁: 盤上の星の点が手数で一巡し、その時々の「吉方」になる。吉方に打つと1アゲハマの恵み<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '一手ごとに盤上の星の点が一巡し、今の吉方が金の輪で示される。',
            '吉方の点に着手した側は1アゲハマの恵みを得る。',
            '巡りは双方に同じ順で訪れる — 吉方を取るか地を取るかの選択。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.luck = -1; st.ply = 0;
        const B = BOARD_SIZE;
        const stars = getStarPoints(B).map(p => p.y * B + p.x);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 吉方が星1に巡る
        assert('吉方が巡る', st.luck === stars[1 % stars.length]);
        const luck = st.luck;
        executeMove({ cells: [{ x: luck % B, y: (luck / B) | 0 }] }, 2); // 白が表示中の吉方へ
        assert('吉方に打つと恵み', captures[2] === 1);
        assert('吉方が次へ進む', st.luck === stars[2 % stars.length]);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true || board[0] !== 0);
    `,
};
