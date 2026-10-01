// MONOGATARIGO — 物語碁: 起承転結。四隅の象限を順に制すと物語が完結して+5目 (周回可)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
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
const ST_INIT = `{ tale: { 1: 0, 2: 0 }, score: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'monogatarigo.html',
    en: 'MONOGATARIGO',
    jp: '物語碁',
    prefix: 'monogatarigo',
    desc: '起・承・転・結 — 四隅を順に制すと物語が完結して+5目。',
    kind: 'stone',
    icon: 'monogatarigo',
    spec: [
        ...K.rb('MONOGATARIGO', '物語碁', 'monogatarigo'),
        K.params([
            { key: 'tale_pts', label: '物語完成の得点', min: 1, max: 20, def: 5, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 物語の四場面: 左上=起 (0), 右上=承 (1), 右下=転 (2), 左下=結 (3)
        const TALE_SCENE = (function () {
            const m = Math.floor(BOARD_SIZE / 2);
            return [
                { x0: 1, y0: 1, x1: m - 1, y1: m - 1 },               // 起 左上
                { x0: m + 1, y0: 1, x1: BOARD_SIZE - 2, y1: m - 1 },   // 承 右上
                { x0: m + 1, y0: m + 1, x1: BOARD_SIZE - 2, y1: BOARD_SIZE - 2 }, // 転 右下
                { x0: 1, y0: m + 1, x1: m - 1, y1: BOARD_SIZE - 2 },   // 結 左下
            ];
        })();
        const taleQuadrant = (x, y) => {
            for (let q = 0; q < 4; q++) {
                const s = TALE_SCENE[q];
                if (x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1) return q;
            }
            return -1;
        };`],
        // 場面の進行: 着手象限が次の場面なら進む。4場面完結で+5目して0に戻る (何周でも)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 物語: 次の場面の象限に置けば物語が進む。結 (4場面目) まで進めば完結+5目
            {
                const mc = move.cells[0];
                const q = taleQuadrant(mc.x, mc.y);
                if (q === st.tale[player]) {
                    st.tale[player]++;
                    if (st.tale[player] >= 4) {
                        st.tale[player] = 0;
                        st.score[player] += (P('tale_pts') ?? 5);
                        fxText(q === -1 ? 0 : (TALE_SCENE[q].y0 * BOARD_SIZE + TALE_SCENE[q].x0), '完結!', '#f472b6', 1500);
                        fxBurst(q === -1 ? 0 : (TALE_SCENE[q].y0 * BOARD_SIZE + TALE_SCENE[q].x0), '#ec4899', 14);
                    }
                }
            }

            turn = opponent;`],
        // 完結加点
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 物語ルール: 完結した物語は+5目ずつ加算済み
            territory.black += st.score[1];
            territory.white += st.score[2];`],
        // 四場面の枠
        K.CUE_GRID(`            // 物語の四場面: 象限の淡い枠
            {
                const labels = ['起', '承', '転', '結'];
                ctx.save();
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.25, cellSize * 0.12]);
                ctx.font = 'bold ' + (cellSize * 0.5) + 'px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let q = 0; q < 4; q++) {
                    const s = TALE_SCENE[q];
                    ctx.strokeStyle = 'rgba(190, 24, 93,' + (0.35 + q * 0.06) + ')';
                    ctx.strokeRect(
                        padding + s.x0 * cellSize - cellSize * 0.5,
                        padding + s.y0 * cellSize - cellSize * 0.5,
                        (s.x1 - s.x0 + 1) * cellSize, (s.y1 - s.y0 + 1) * cellSize);
                    ctx.fillStyle = 'rgba(190, 24, 93, 0.45)';
                    ctx.fillText(labels[q],
                        padding + (s.x0 + s.x1) / 2 * cellSize,
                        padding + (s.y0 + s.y1) / 2 * cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'物語 黒' + '起承転結'.slice(0, st.tale ? st.tale[1] : 0) + '/' + (st.score ? st.score[1] : 0) + '目 白' + '起承転結'.slice(0, st.tale ? st.tale[2] : 0) + '/' + (st.score ? st.score[2] : 0) + '目'`),
        [K.ONE, K.INFO_ALGO, `            物語碁: 左上→右上→右下→左下の象限に順に置けば物語が完結して+5目 (周回可)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅の象限が「起・承・転・結」の四場面。次の場面の象限に石を置くたび物語が進み、結まで進めば+5目でまた起に戻る。',
            '順序を外れた着手は物語を戻さない — 気長に巡るか、急いで制すか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const m = Math.floor(BOARD_SIZE / 2);
        assert('左上は起', taleQuadrant(1, 1) === 0);
        assert('右上は承', taleQuadrant(m + 1, 1) === 1);
        board.fill(0); pieces = []; history.length = 0;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 起
        executeMove({ cells: [{ x: m + 1, y: m + 1 }] }, 1); // 転は飛ばせない (白番のつもりでも player は渡す値)
        executeMove({ cells: [{ x: m + 1, y: 1 }] }, 1); // 承
        assert('順に進む', st.tale[1] === 2);
        executeMove({ cells: [{ x: m + 1, y: m + 1 }] }, 1); // 転
        executeMove({ cells: [{ x: 1, y: m + 1 }] }, 1); // 結 → 完結
        assert('完結で+5目', st.score[1] === 5 && st.tale[1] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: m, y: m }], 1) === true);
    `,
};
