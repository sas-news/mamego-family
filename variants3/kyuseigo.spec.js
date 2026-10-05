// KYUSEIGO — 九星碁: 天元の周囲8方位を吉方・凶方が毎手回る。吉方に置くと+2点、凶方の石は消える
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ ply: 0, luck: { 1: 0, 2: 0 } }`;
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
    file: 'kyuseigo.html',
    en: 'KYUSEIGO',
    jp: '九星碁',
    prefix: 'kyuseigo',
    desc: '天元の周囲8方位を吉方・凶方が毎手回る。吉方に置くと+2点、凶方に置いた石は消える。',
    kind: 'stone',
    icon: 'kyuseigo',
    spec: [
        ...K.rb('KYUSEIGO', '九星碁', 'kyuseigo'),
        K.params([
            { key: 'ring_dist', label: '方位リングの距離', min: 1, max: 5, def: 2, unit: '点', hint: '天元からの距離' },
            { key: 'lucky_pts', label: '吉方の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 八方位リングヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 八方位: 天元からチェビシェフ距離2の8マス (北から時計回り)
        function kyuseiRing() {
            const c = Math.floor(BOARD_SIZE / 2);
            const rd = Math.min(Math.floor((BOARD_SIZE - 1) / 2), Math.max(1, P('ring_dist') || 2));
            return [
                { x: c, y: c - rd }, { x: c + rd, y: c - rd }, { x: c + rd, y: c },
                { x: c + rd, y: c + rd }, { x: c, y: c + rd }, { x: c - rd, y: c + rd },
                { x: c - rd, y: c }, { x: c - rd, y: c - rd },
            ].filter(p => p.x >= 0 && p.y >= 0 && p.x < BOARD_SIZE && p.y < BOARD_SIZE);
        }
        function kyuseiIdx(p) { return p.y * BOARD_SIZE + p.x; }

        function endGameByScore() {`],
        // 採点に吉運を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.luck[1];
            const whiteTotal = territory.white + captures[2] + komi + st.luck[2];`],
        // 九星: 着手で吉方・凶方が回る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 九星: 着手で方位が回り、吉方なら吉運+2、凶方なら置いた石が消える
            st.ply++;
            {
                const ring = kyuseiRing();
                if (ring.length === 8) {
                    const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    const lucky = kyuseiIdx(ring[st.ply % 8]);
                    const unlucky = kyuseiIdx(ring[(st.ply + 4) % 8]);
                    if (cell === lucky) {
                        st.luck[player] += (P('lucky_pts') ?? 2);
                        fxGlow(cell, '#fde047', 900);
                        fxText(cell, '吉方 +' + (P('lucky_pts') ?? 2), '#fde047', 1200);
                    }
                    if (cell === unlucky && board[cell] === player) {
                        board[cell] = 0;
                        cleanUpPieces();
                        fxBurst(cell, '#475569', 12);
                        fxText(cell, '凶方', '#94a3b8', 1200);
                        fxShake(5, 400);
                    }
                }
            }

            turn = opponent;`],
        // 現在の吉方・凶方を描く
        K.CUE_STARS(`            // 九星: 現在の吉方(金星)と凶方(灰点)を描く
            {
                const ring = kyuseiRing();
                if (ring.length === 8) {
                    const draw = (p, fill, stroke) => {
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.strokeStyle = stroke;
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.fillStyle = fill;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    draw(ring[(st.ply + 1) % 8], 'rgba(253,224,71,0.9)', 'rgba(202,138,4,0.8)'); // 次の吉方
                    draw(ring[(st.ply + 5) % 8], 'rgba(71,85,105,0.9)', 'rgba(30,41,59,0.8)'); // 次の凶方
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'吉方:' + ['北', '北東', '東', '南東', '南', '南西', '西', '北西'][(st.ply + 1) % 8]`),
        [K.ONE, K.INFO_BASE, `            九星碁: 天元の周囲8方位を吉方・凶方が毎手回る。吉方に置くと+2点、凶方の石は消える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '天元の周囲の8方位を、毎手、吉方 (金星) と凶方 (灰点) が時計回りに1つずつ回る。',
            '自分の着手がその手の吉方に入れば吉運+2点。凶方に置いた石はその場で消えてしまう。',
            '次の吉方・凶方は盤面に常時表示される。回転は双方共通。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        st.ply = 0; st.luck = { 1: 0, 2: 0 };
        const ring = kyuseiRing();
        assert('八方位リング', ring.length === 8);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        st.ply = 0; // 次の着手で ply=1 → 吉方 ring[1]=(c+2,c-2)
        executeMove({ cells: [{ x: ring[1].x, y: ring[1].y }] }, 1);
        assert('吉方で+2', st.luck[1] === 2);
        st.ply = 0; // ply=1 → 凶方 ring[5]=(c,c+2)
        executeMove({ cells: [{ x: ring[5].x, y: ring[5].y }] }, 2);
        assert('凶方の石は消える', board[kyuseiIdx(ring[5])] === 0);
        assert('凶方でも吉運は入らない', st.luck[2] === 0);
    `,
};
