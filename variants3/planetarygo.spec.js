// PLANETARYGO — 七曜碁: 盤を7帯に分け、手数ごとに当番の曜が巡る。当番帯への着手+2。
const K = require('../gen_kit.js');
const ST = (init, extraDecl, extraReset) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};${extraDecl || ''}`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};${extraReset || ''}`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const SCORE_END = [
    [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
];
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false }`;
module.exports = {
    file: 'planetarygo.html',
    en: 'PLANETARYGO',
    jp: '七曜碁',
    prefix: 'planetarygo',
    desc: '盤を7帯に分け、手数ごとに当番の曜が巡る。当番帯への着手+2。',
    kind: 'stone',
    icon: 'planetarygo',
    spec: [
        ...K.rb('PLANETARYGO', '七曜碁', 'planetarygo'),
        K.params([{ key: 'band_n', label: '曜の帯数', min: 3, max: 9, def: 7, unit: '帯' }, { key: 'band_pts', label: '当番帯ボーナス', min: 0, max: 10, def: 2, unit: '点' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT, `
        // 七曜: 盤を7つの縦帯に分け、手数%7で当番帯が日→土へ巡る
        const PLANET_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
        const planetBand = (x) => Math.floor(x * (P('band_n') || 7) / BOARD_SIZE);
        const planetNow = () => (history.length - 1) % (P('band_n') || 7);`, ''),
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 当番の曜の帯に置くと+2
            if (planetBand(move.cells[0].x) === planetNow()) st.score[player] += (P('band_pts') || 2);`],
        K.CUE_GRID(`            // 七曜: 当番帯を淡く照らす
            {
                const b = planetNow();
                ctx.fillStyle = 'rgba(245,158,11,0.12)';
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (planetBand(x) !== b) continue;
                    ctx.fillRect(padding + x * cellSize - cellSize / 2, padding - cellSize / 2, cellSize, cellSize * BOARD_SIZE);
                }
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'七曜 ' + ((PLANET_NAMES[planetNow()] || '星') || '星') + 'の帯'`),
        [K.ONE, K.INFO_ALGO, `                        七曜碁: 盤の縦7帯に日曜〜土曜が順に当番 (手数%7)。当番の帯への着手で+2点。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は縦に7帯。手数%7で当番の曜 (日→月→火→水→木→金→土) が帯を巡る。',
            '当番の帯に置くと+2。手数が進むごとに当番は1つずつ西へ移る。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '当番は手数だけで決まる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        assert('帯は7つ', planetBand(0) === 0 && planetBand(BOARD_SIZE - 1) === 6);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('日の帯で+2', st.score[1] === 2);
        executeMove({ cells: [{ x: Math.floor(BOARD_SIZE / 2), y: 0 }] }, 2);
        assert('帯の外は+0', st.score[2] === 0);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        assert('翌手は当番が移る', st.score[1] === 2);
    `,
};
