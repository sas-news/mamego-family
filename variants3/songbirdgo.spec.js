// SONGBIRDGO — 鳴禽碁: 開けた場所に置いた石は鳴き石となり縄張りを主張する (+1目)
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
const ST_INIT = `{ song: [] }`;
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
    file: 'songbirdgo.html',
    en: 'SONGBIRDGO',
    jp: '鳴禽碁',
    prefix: 'songbirdgo',
    desc: '敵石のいない開けた場所に置くと石が囀り、縄張りを主張して+1目。',
    kind: 'stone',
    icon: 'songbirdgo',
    spec: [
        ...K.rb('SONGBIRDGO', '鳴禽碁', 'songbirdgo'),
        K.params([
            { key: 'open_need', label: '鳴き石に必要な空点数', min: 1, max: 4, def: 2, unit: '点' },
            { key: 'song_pts', label: '囀りの得点', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 鳴き石ルール: 隣接に敵石がなく空点が2つ以上あれば囀って縄張り主張 (+1目)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鳴禽: 敵石に触れず空気の開けた場所に置くと鳴き石になる (+1目)
            {
                st.song = st.song.filter(i => board[i] !== 0);
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const nb = getNeighbors(mi);
                const empties = nb.filter(i => board[i] === 0).length;
                const foes = nb.filter(i => board[i] === opponent).length;
                if (foes === 0 && empties >= (P('open_need') || 2)) {
                    st.song.push(mi);
                    captures[player] += (P('song_pts') ?? 1);
                    fxGlow(mi, '#4ade80', 700);
                    fxText(mi, 'さえずり +' + (P('song_pts') ?? 1), '#4ade80', 1200);
                }
            }

            turn = opponent;`],
        // 鳴き石の上に小さな音符マーク
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                (st.song || []).forEach(i => {
                    if (board[i] !== 1 && board[i] !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = '#4ade80';
                    ctx.font = 'bold ' + Math.max(8, cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('♪', cx + cellSize * 0.24, cy - cellSize * 0.22);
                    ctx.strokeStyle = 'rgba(74,222,128,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.52, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鳴き石 ' + st.song.filter(i => board[i] !== 0).length + '個'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            鳴禽碁: 敵石に触れず空点2つ以上の開けた場所に置くと、石が囀って+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した石の隣に敵石がなく、空点が2つ以上あれば「鳴き石」になり+1目。',
            '鳴き石は囀りで縄張りを主張する。取られると音符は消える。両者同じ条件の対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.song = [];
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('開けた場所で鳴き石', st.song.includes(4 * BOARD_SIZE + 4));
        assert('囀りで+1目', captures[1] === 1);
        // 空点が1つしかない所では鳴かない
        board[2 * BOARD_SIZE + 9] = 1; board[1 * BOARD_SIZE + 10] = 1; board[2 * BOARD_SIZE + 11] = 1;
        executeMove({ cells: [{ x: 10, y: 2 }] }, 1);
        assert('空点が足りないと鳴かない', st.song.length === 1 && captures[1] === 1);
        // 敵に隣接しても鳴かない
        board[9 * BOARD_SIZE + 9] = 2;
        executeMove({ cells: [{ x: 9, y: 8 }] }, 1);
        assert('敵に隣接しても鳴かない', captures[1] === 1 && !st.song.includes(8 * BOARD_SIZE + 9));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
