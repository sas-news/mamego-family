// RUSTZONEGO — 錆地帯碁: 盤中央の錆びた地帯では石が腐食し、2回の錆周期で砕け落ちる
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
const ST_INIT = `{ rust: {} }`;
module.exports = {
    file: 'rustzonego.html',
    en: 'RUSTZONEGO',
    jp: '錆地帯碁',
    prefix: 'rustzonego',
    desc: '盤中央の錆地帯では石が腐食し、2回の錆周期で砕け落ちる。',
    kind: 'stone',
    icon: 'rustzonego',
    spec: [
        ...K.rb('RUSTZONEGO', '錆地帯碁', 'rustzonego'),
        K.params([
            { key: 'rust_interval', label: '錆周期の間隔', min: 4, max: 30, def: 10, unit: '手' },
            { key: 'rust_limit', label: '砕けるまでの腐食回数', min: 1, max: 5, def: 2, unit: '回' },
            { key: 'zone_radius', label: '錆地帯の半径', min: 1, max: 6, def: 2 },
        ]),
        ...ST(ST_INIT),
        // 錆周期: 10手ごとに地帯内の石が腐食進行。2度腐食すると砕けて消える (アゲハマにもならない)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 錆地帯: 10手ごとに地帯の石が腐食。2度で砕けて消える
            if (history.length > 0 && history.length % Math.max(1, P('rust_interval') || 10) === 0) {
                const c = Math.floor(BOARD_SIZE / 2);
                Object.keys(st.rust).forEach(k => { if (board[+k] !== 1 && board[+k] !== 2) delete st.rust[k]; });
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (Math.abs(x - c) + Math.abs(y - c) > Math.max(1, P('zone_radius') || 2)) continue;
                        const i = y * BOARD_SIZE + x;
                        if (board[i] !== 1 && board[i] !== 2) continue;
                        st.rust[i] = (st.rust[i] || 0) + 1;
                        if (st.rust[i] >= Math.max(1, P('rust_limit') || 2)) {
                            board[i] = 0;
                            delete st.rust[i];
                            fxText(i, '腐食!', '#b45309', 1100);
                        } else {
                            fxGlow(i, '#b45309', 600);
                        }
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        // 錆地帯の地色 (常時オーバーレイ)
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            ctx2.save();
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (Math.abs(x - c) + Math.abs(y - c) > Math.max(1, P('zone_radius') || 2)) continue;
                    const cx = pad + x * cs, cy = pad + y * cs;
                    const pulse = 0.10 + 0.05 * Math.sin(now / 700 + x * 3 + y * 5);
                    ctx2.fillStyle = 'rgba(146,64,14,' + pulse + ')';
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, cs * 0.42, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
        ...K.STONE_MARKS_SPEC(`            // 腐食進行中の石: 錆の斑
            {
                ctx.save();
                Object.keys(st.rust || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(180,83,9,0.8)';
                    for (let d = 0; d < st.rust[i]; d++) {
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(d * 2.4 + i) * cellSize * 0.2, cy + Math.sin(d * 2.4 + i) * cellSize * 0.2, cellSize * 0.08, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'錆周期まで ' + ((P('rust_interval') || 10) - history.length % (P('rust_interval') || 10)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            錆地帯碁: 盤中央の錆地帯では石が腐食し、2回の錆周期 (20手) で砕け落ちる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央のひし形は「錆地帯」。そこに置いた石は10手ごとの錆周期で腐食が進む。',
            '2度腐食すると砕けて消える (アゲハマにもならない)。中心は早く通り抜けるべし。',
            '両者に同じ腐食条件。取り・コウ・パス終局は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.rust = {};
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + c] = 1; // 錆地帯のど真ん中
        history.length = 9;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 10手目 → 1度目の腐食
        assert('1度目は腐食するだけ', st.rust[c * BOARD_SIZE + c] === 1 && board[c * BOARD_SIZE + c] === 1);
        history.length = 19;
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2); // 20手目 → 2度目で砕ける
        assert('2度目で砕けて消える', board[c * BOARD_SIZE + c] === 0);
        assert('地帯外の石は無事', board[0] === 1 && board[BOARD_SIZE] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
