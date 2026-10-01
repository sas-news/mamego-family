// ARITHMETICGO — 公差碁: 自分の直前2手と等差 (同じ方向・同じ間隔) で石を置くと+2目
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
            if (!capFired && history.length >= (P('ply_cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'arithmeticgo.html',
    en: 'ARITHMETICGO',
    jp: '公差碁',
    prefix: 'arithmeticgo',
    desc: '自分の直前2手と同じ方向・同じ間隔 (等差) で打つと+2目の公差ボーナス。',
    kind: 'stone',
    icon: 'arithmeticgo',
    spec: [
        ...K.rb('ARITHMETICGO', '公差碁', 'arithmeticgo'),
        K.params([
            { key: 'diff_bonus', label: '公差ボーナス', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } }; // 公差ボーナス・直前2手の座標`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 公差ボーナス: 直前2手と同じベクトルで置くと等差数列完成 → +2目
            {
                const p = move.cells[0];
                const h = st.last2[player];
                if (h.length >= 2) {
                    const [a, b] = h;
                    if ((b.x - a.x === p.x - b.x) && (b.y - a.y === p.y - b.y)
                        && (p.x !== b.x || p.y !== b.y)) {
                        st.bonus[player] += (P('diff_bonus') || 2);
                        const ci = p.y * BOARD_SIZE + p.x;
                        fxGlow(ci, '#a3e635', 700);
                        fxText(ci, '公差 +' + (P('diff_bonus') || 2) + '目', '#a3e635', 1200);
                    }
                }
                st.last2[player] = [h[h.length - 1] || null, { x: p.x, y: p.y }].filter(Boolean).slice(-2);
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の公差:</span> <strong>\${st.bonus[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の公差:</span> <strong>\${st.bonus[2]}</strong></div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            公差碁: 自分の直前2手と同じ方向・間隔で打つと+2目の公差ボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の直前の2手と「同じ方向に同じ間隔」で打つと等差数列が完成し+2目。',
            '例: (2,2)→(4,2)→(6,2) なら横2マスの等差。止まらず同じ公差で伸ばし続けると連続ボーナス。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, last2: { 1: [], 2: [] } };
        executeMove({ cells: [{ x: 1, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // (1,3)→(3,3): 公差+2
        assert('2手目ではまだボーナスなし', st.bonus[1] === 0);
        executeMove({ cells: [{ x: 8, y: 7 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 3 }] }, 1); // (3,3)→(5,3): 同じ公差 → +2
        assert('等差3手目で+2目', st.bonus[1] === 2);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // (3,3)→(5,3)→(5,4): 公差違い
        assert('公差が違えば加点なし', st.bonus[1] === 2);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
