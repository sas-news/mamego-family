// BATTLEDOREGO — 羽根碁: 石は羽根突きの羽。相手の奥の段 (バックライン) に届けるとラリー得点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ rally: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'battledorego.html',
    en: 'BATTLEDOREGO',
    jp: '羽根碁',
    prefix: 'battledorego',
    desc: '石は羽根突きの羽。相手側の最奥ラインに届けるごとにラリー+1点。',
    kind: 'stone',
    icon: 'battledorego',
    spec: [
        ...K.rb('BATTLEDOREGO', '羽根碁', 'battledorego'),
        K.params([
            { key: 'rally_pts', label: 'ラリー1回の得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 相手のバックライン到達でラリー点 (黒は最上段、白は最下段)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 羽根突き: 相手側の最奥ラインに石を届けるとラリー+1
            {
                const bc = move.cells[0];
                const goalRow = player === 1 ? 0 : BOARD_SIZE - 1;
                if (bc.y === goalRow) {
                    st.rally[player]++;
                    const gi = bc.y * BOARD_SIZE + bc.x;
                    fxGlow(gi, '#f472b6', 800);
                    fxText(gi, 'ラリー+1!', '#ec4899', 1000);
                }
            }

            turn = opponent;`],
        // ラリー点を採点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.rally[1] * (P('rally_pts') || 2);
            const whiteTotal = territory.white + captures[2] + komi + st.rally[2] * (P('rally_pts') || 2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒のラリー:</span> <strong>+\${st.rally[1] * (P('rally_pts') || 2)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白のラリー:</span> <strong>+\${st.rally[2] * (P('rally_pts') || 2)}</strong></div>`],
        // バックラインを羽根のゴール帯として描く
        K.CUE_GRID(`            // 羽根のゴール帯: 最上段 (黒のゴール) と最下段 (白のゴール)
            {
                ctx.save();
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.fillStyle = 'rgba(236,72,153,0.07)';
                ctx.fillRect(0, padding - cellSize * 0.5, w, cellSize);
                ctx.fillRect(0, padding + (BOARD_SIZE - 1) * cellSize - cellSize * 0.5, w, cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'ラリー 黒' + st.rally[1] + ' 白' + st.rally[2]`),
        [K.ONE, K.INFO_BASE, `            羽根碁: 石は羽根突きの羽。相手側の最奥ラインに届けるごとにラリー+1 (終局時+2目)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '黒は盤の最上段、白は最下段が「相手のゴールライン」。',
            '自分の石を相手のゴールラインに置くごとにラリー+1 (終局時に+2目)。',
            '置いた石が後で取られてもラリー点は残る。往復を狙う羽根突きの勝負。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.rally = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // 黒が最上段へ
        assert('黒のラリー+1', st.rally[1] === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 黒が中央へ (白の手番を飛ばすため黒で)
        executeMove({ cells: [{ x: 6, y: BOARD_SIZE - 1 }] }, 2); // 白が最下段へ
        assert('白のラリー+1', st.rally[2] === 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 白が中央へ — ラリーは増えない
        assert('中央では増えない', st.rally[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
