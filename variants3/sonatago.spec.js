// SONATAGO — 楽章碁: ソナタ形式。連は 呈示(単)→展開(増)→再現(前の形) の3楽章で構成
const K = require('../gen_kit.js');
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
const ST_INIT = `{ phase: { 1: 0, 2: 0 }, motif: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sonatago.html',
    en: 'SONATAGO',
    jp: '楽章碁',
    prefix: 'sonatago',
    desc: '連は楽章を追う: 呈示部(独立単石)→展開部(連結増殖)→再現部(同数の別連) で構成が完結し得点。',
    kind: 'stone',
    icon: 'sonatago',
    spec: [
        ...K.rb('SONATAGO', '楽章碁', 'sonatago'),
        K.params([
            { key: 'dev_len', label: '展開部に必要な連の大きさ', min: 2, max: 6, def: 3, unit: '石' },
            { key: 'rep_count', label: '再現に必要な同型の連数', min: 2, max: 4, def: 2, unit: '連' },
            { key: 'sonata_pts', label: '楽章完結の得点', min: 0, max: 9, def: 3, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // ソナタ形式: 呈示 (新しい単石で動機) → 展開 (その連が成長) → 再現 (同じ大きさの別連) で+3目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // ソナタ形式: 新規単石=呈示 (動機記憶) / 連が成長=展開 / 同型の別連出現=再現で完結 +3目
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[mi] === player) {
                    const s = getConnectedGroup(mi, player).length;
                    const ph = st.phase[player];
                    if (ph === 0 && s === 1) {
                        st.phase[player] = 1;
                        st.motif[player] = mi;
                        fxGlow(mi, '#7dd3fc', 500);
                    } else if (ph === 1 && s >= (P('dev_len') || 3)) {
                        st.phase[player] = 2;
                        st.motif[player] = s; // 動機の連の大きさを記憶
                        fxText(mi, '展開部', '#7dd3fc', 1000);
                    } else if (ph === 2) {
                        // 動機の連と同じ大きさの連が2つ以上あれば再現成立 → 完結
                        const seenS3 = {};
                        let cnt = 0;
                        for (let i = 0; i < board.length; i++) {
                            if (board[i] !== player || seenS3[i]) continue;
                            const g = getConnectedGroup(i, player);
                            g.forEach(j => { seenS3[j] = true; });
                            if (g.length === st.motif[player]) cnt++;
                        }
                        if (cnt >= (P('rep_count') || 2)) {
                            captures[player] += (P('sonata_pts') ?? 3);
                            st.phase[player] = 0;
                            fxText(mi, '再現部・完結 +' + (P('sonata_pts') ?? 3), '#facc15', 1400);
                            fxShake(3, 280);
                        }
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`['呈示部','展開部','再現部'][st.phase[turn]]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            楽章碁: 連はソナタ形式を追う。新しい単石=呈示部、その連が3石に成長=展開部、同じ大きさの別連が出現=再現部で完結し+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            'ソナタ形式: 独立した単石を置くと「呈示部」。その連が3石以上に育つと「展開部」。',
            'さらに同じ大きさの別の連が生まれると「再現部」で楽章が完結し+3目。形を複写する作曲。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.phase = { 1: 0, 2: 0 }; st.motif = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 呈示
        assert('単石で呈示部', st.phase[1] === 1);
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 2 }] }, 1); // 3連 → 展開
        assert('3連で展開部', st.phase[1] === 2 && st.motif[1] === 3);
        board[8 * BOARD_SIZE + 8] = 1; board[8 * BOARD_SIZE + 9] = 1;
        executeMove({ cells: [{ x: 10, y: 8 }] }, 1); // 別の3連 → 再現
        assert('同型の別連で再現+3', captures[1] === 3 && st.phase[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
