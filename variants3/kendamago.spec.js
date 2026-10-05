// KENDAMAGO — けん玉碁: 捕獲するたび技が進む: 小皿+1、中皿+2、剣先+4のボーナス。剣先で一周
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
const ST_INIT = `{ stage: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'kendamago.html',
    en: 'KENDAMAGO',
    jp: 'けん玉碁',
    prefix: 'kendamago',
    desc: '捕獲のたび技が進む。小皿+1→中皿+2→剣先+4のボーナス目。剣先で一段落。',
    kind: 'stone',
    icon: 'kendamago',
    spec: [
        ...K.rb('KENDAMAGO', 'けん玉碁', 'kendamago'),
        K.params([
            { key: 'kenzaki_pts', label: '剣先のボーナス', min: 1, max: 10, def: 4, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),

        // けん玉: 捕獲で技が進みボーナス (小皿+1 中皿+2 剣先+4、剣先でリセット)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                st.stage[player] = (st.stage[player] || 0) + 1;
                const bonus = st.stage[player] >= 3 ? (P('kenzaki_pts') ?? 4) : st.stage[player];
                captures[player] += bonus;
                const waza = ['', '小皿', '中皿', '剣先'][st.stage[player]];
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxText(pi, waza + ' +' + bonus, '#f97316', 1300);
                fxGlow(pi, '#f97316', 800);
                if (st.stage[player] >= 3) st.stage[player] = 0;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`['次の技: 小皿', '次の技: 中皿', '次の技: 剣先'][st.stage[turn] || 0]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            けん玉碁: 捕獲のたび技が進む。小皿+1→中皿+2→剣先+4のボーナス目 (剣先で一段落)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '捕獲するたび自分の技が一段進む: 1回目=小皿+1目、2回目=中皿+2目、3回目=剣先+4目。',
            '剣先を決めると一段落して小皿に戻る。捕獲ボーナスは地とは別に加点。',
            '小さい獲りで技を温め、剣先で大きな連を獲るタイミング勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.stage = { 1: 0, 2: 0 };
        // 白1石を囲んで獲る ×3回で剣先まで確認
        for (let k = 0; k < 3; k++) {
            const bx = 1 + k * 3, by = 1;
            board.fill(0);
            board[by * BOARD_SIZE + bx] = 2;
            board[(by - 1) * BOARD_SIZE + bx] = 1; board[by * BOARD_SIZE + bx - 1] = 1; board[(by + 1) * BOARD_SIZE + bx] = 1;
            executeMove({ cells: [{ x: bx + 1, y: by }] }, 1);
        }
        assert('3回の捕獲でボーナス 3石+1+2+4=10', captures[1] === 10);
        assert('剣先で技が一段落', st.stage[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 1) === true);
    `,
};
