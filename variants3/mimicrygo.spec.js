// MIMICRYGO — 擬態碁: 5手ごとに擬態石が供給され、擬態石は一度だけ取りを免れる (擬態が解ける)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.max(1, P('cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mimicrygo.html',
    en: 'MIMICRYGO',
    jp: '擬態碁',
    prefix: 'mimicrygo',
    desc: '5手ごとに擬態石が供給される。擬態石は一度だけ取られるのを免れ、擬態が解ける。',
    kind: 'stone',
    icon: 'mimicrygo',
    spec: [
        ...K.rb('MIMICRYGO', '擬態碁', 'mimicrygo'),
        K.params([
            { key: 'interval', label: '擬態石の間隔', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { cnt: { 1: 0, 2: 0 }, mimic: {} }; // 着手数・擬態石`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { cnt: { 1: 0, 2: 0 }, mimic: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { cnt: { 1: 0, 2: 0 }, mimic: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { cnt: { 1: 0, 2: 0 }, mimic: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { cnt: { 1: 0, 2: 0 }, mimic: {} };`],
        // 擬態: 取り判定で擬態石だけが残り、擬態が解ける
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    if (!hasLiberty) {
                        // 擬態石は敵に紛れて一度だけ取りを免れる (擬態は解ける)
                        group.forEach(g => {
                            if (st.mimic[g]) {
                                delete st.mimic[g];
                                fxGlow(g, '#a78bfa', 800);
                                fxText(g, '擬態!', '#a78bfa', 1100);
                            } else {
                                captured.push(g);
                            }
                        });
                    }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 擬態供給: N手ごとの着手は擬態石になる (間隔は設定で調整)
            {
                st.cnt[player]++;
                if (st.cnt[player] % Math.max(1, P('interval') || 5) === 0) {
                    const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    st.mimic[li] = true;
                    fxText(li, '擬態石', '#a78bfa', 900);
                }
                Object.keys(st.mimic).forEach(i => { if (board[i] === 0) delete st.mimic[i]; });
            }

            turn = opponent;`],
        // 擬態石は薄紫の点線輪
        ...K.STONE_MARKS_SPEC(`            // 擬態石の保護色リング
            {
                ctx.save();
                Object.keys(st.mimic || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = '#a78bfa';
                    ctx.setLineDash([cellSize * 0.08, cellSize * 0.06]);
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(st.cnt[turn] || 0) % Math.max(1, P('interval') || 5) === Math.max(1, P('interval') || 5) - 1 ? '次は擬態石' : '擬態まで' + (Math.max(1, P('interval') || 5) - ((st.cnt[turn] || 0) % Math.max(1, P('interval') || 5))) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            擬態碁: 5手ごとの石は擬態し、一度だけ取りを免れる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '5手ごとの着手は擬態石 (紫の点線輪) — 敵に紛れ込み、一度だけ取られるのを免れて擬態が解ける。',
            '擬態石を敵地の要害に忍ばせ、二度必要な攻めで時間を稼げ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { cnt: { 1: 0, 2: 0 }, mimic: {} };
        for (let k = 0; k < 4; k++) executeMove({ cells: [{ x: k, y: 0 }] }, 1); // 黒1〜4
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 黒5: 擬態石
        assert('擬態石が供給される', st.mimic[I(6, 6)] === true);
        // 擬態石を囲んで取る → 擬態で生き残る
        board[I(5, 6)] = 2; board[I(7, 6)] = 2; board[I(6, 5)] = 2;
        executeMove({ cells: [{ x: 6, y: 7 }] }, 2);
        assert('擬態石は取りを免れる', board[I(6, 6)] === 1 && st.mimic[I(6, 6)] === undefined);
        // 二度目は普通に取られる
        board[I(5, 6)] = 2; board[I(7, 6)] = 2; board[I(6, 5)] = 2; board[I(6, 7)] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('擬態が解けた後は取られる', board[I(6, 6)] === 0);
    `,
};
