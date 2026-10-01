// KAIKIGO — 回忌碁: 7手ごとの回忌法要で、互いの取り石(故人)が徳点に変わる
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
const ST_INIT = `{ ply: 0, done: 0, merit: { 1: 0, 2: 0 } }`;
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
    file: 'kaikigo.html',
    en: 'KAIKIGO',
    jp: '回忌碁',
    prefix: 'kaikigo',
    desc: '7手ごとに回忌法要。取り石(故人)1つにつき徳+1点として双方に振り込まれる。',
    kind: 'stone',
    icon: 'kaikigo',
    spec: [
        ...K.rb('KAIKIGO', '回忌碁', 'kaikigo'),
        K.params([
            { key: 'kaiki_interval', label: '回忌法要の間隔', min: 2, max: 20, def: 7, unit: '手' },
            { key: 'merit_div', label: '徳点の換算 (取り石÷N)', min: 1, max: 5, def: 2 },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 採点に徳点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.merit[1];
            const whiteTotal = territory.white + captures[2] + komi + st.merit[2];`],
        // 回忌: 7手ごとに両者の取り石を半分ずつ徳点へ (取った側に+)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 回忌: N手ごとの法要 — 取り石÷Nの差を徳点として清算 (間隔・換算は設定で調整)
            st.ply++;
            const __iv = Math.max(1, P('kaiki_interval') || 7);
            const __dv = Math.max(1, P('merit_div') || 2);
            if (st.ply % __iv === 0) {
                const m1 = Math.floor(captures[1] / __dv) - 0; // 黒が取った白石→黒の徳
                const m2 = Math.floor(captures[2] / __dv);
                const diff = Math.abs(m1 - m2);
                const hi = m1 >= m2 ? 1 : 2;
                st.merit[hi] += diff;
                const c = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxGlow(c, '#a5f3fc', 900);
                fxText(c, '回忌法要 ' + (st.ply / __iv), '#67e8f9', 1400);
                fxShake(3, 250);
            }

            turn = opponent;`],
        // 天元に位牌を描く
        K.CUE_STARS(`            // 回忌: 天元に小さな位牌を描く
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(103,232,249,0.85)';
                const w = cellSize * 0.28, h = cellSize * 0.42;
                ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
                ctx.fillStyle = 'rgba(12,74,110,0.9)';
                ctx.fillRect(cx - w / 2, cy + h * 0.18, w, h * 0.22);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'法要: ' + (st.ply % Math.max(1, P('kaiki_interval') || 7) === 0 ? '今!' : (Math.max(1, P('kaiki_interval') || 7) - st.ply % Math.max(1, P('kaiki_interval') || 7)) + '手後')`),
        [K.ONE, K.INFO_ALGO, `            回忌碁: 7手ごとに回忌法要。互いの取り石(故人)の差が徳点になる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手7手ごとに回忌法要が営まれる。両者の取り石数の半分同士を比べ、多い側にその差だけ徳点が入る。',
            '徳点は採点に加算される蓄積点 — 石が取り返されても徳は消えない。',
            '取り合いが激しいほど徳の差が開く。法要は双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.ply = 0; st.merit = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        captures[1] = 8; captures[2] = 2; // 黒8石・白2石を取った状態
        st.ply = 6;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 7手目 → 法要
        assert('法要で徳差+3 (4-1)', st.merit[1] === 3 && st.merit[2] === 0);
        captures[2] = 10;
        st.ply = 13;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2); // 14手目 → 法要 (4 vs 5)
        assert('二回目は白に徳差+1', st.merit[2] === 1);
        st.ply = 5;
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1); // 6手目 → 法要なし
        assert('7手ごと以外は静か', st.merit[1] === 3 && st.merit[2] === 1);
    `,
};
