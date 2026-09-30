// DROPLETGO — 雫碁: 石は水滴。置いた雫は隣の自滴と合体するが、3面以上の合体は表面張力で弾ける
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'dropletgo.html',
    en: 'DROPLETGO',
    jp: '雫碁',
    prefix: 'dropletgo',
    desc: '石は水滴。同色に2面までなら合体できるが、3面以上の合体は表面張力で弾けて置けない。',
    kind: 'stone',
    icon: 'dropletgo',
    spec: [
        ...K.rb('DROPLETGO', '雫碁', 'dropletgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 表面張力: 同色の隣接は2面まで。3面目を同時に触れると弾ける
        function ownContacts(idx, p) {
            return getNeighbors(idx).filter(n => board[n] === p).length;
        }`],
        [K.ONE, K.VALID_BOUNDS, `            {
                const p0 = cells[0];
                if (p0.x < 0 || p0.x >= BOARD_SIZE || p0.y < 0 || p0.y >= BOARD_SIZE) return false;
                const i0 = p0.y * BOARD_SIZE + p0.x;
                if (board[i0] !== 0) return false;
                if (ownContacts(i0, player) >= 3) return false; // 表面張力で弾ける
            }`],
        // 合体のエフェクト: 2面以上に触れて置いたとき水しぶき
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            if (move.cells.length === 1 && ownContacts(move.cells[0].y * BOARD_SIZE + move.cells[0].x, player) >= 2) {
                fxSplash(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#7dd3fc');
            }`],
        // 水滴のハイライト (石は丸みのある水滴)
        ...K.STONE_MARKS_SPEC(`            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(cx - cellSize * 0.13, cy - cellSize * 0.15, cellSize * 0.09, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        [K.ONE, K.INFO_ALGO, `            雫碁: 水滴の石。同色に2面まで合体可、3面以上は表面張力で弾ける<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は水滴 — 隣の自滴と合体する (通常の連結)。',
            'ただし一度に3面以上の同色に触れる手は表面張力で弾けて置けない (双方同じ)。',
            '塊を維持するには順番が大事 — 敵石はいくら触れても弾けない。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board[I(3, 3)] = 1; board[I(4, 3)] = 1;
        assert('2面合体は置ける', isValidPlacement([{ x: 3, y: 4 }], 1) === true);
        board[I(3, 4)] = 1; board[I(5, 4)] = 1;
        assert('3面の合体は弾ける', isValidPlacement([{ x: 4, y: 4 }], 1) === false);
        assert('敵石は弾かない', isValidPlacement([{ x: 4, y: 4 }], 2) === true);
    `,
};
