// SKIMMINGGO — 水切碁: 石は水切り石。置いた時の空き隣接数+1回だけ「跳ねる」(取られても耐える)
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
const ST_INIT = `{ hp: {} }`;
module.exports = {
    file: 'skimminggo.html',
    en: 'SKIMMINGGO',
    jp: '水切碁',
    prefix: 'skimminggo',
    desc: '石は水切り石。置いた時の空き隣接数+1回だけ捕獲に耐える (跳ねる)。',
    kind: 'stone',
    icon: 'skimminggo',
    spec: [
        ...K.rb('SKIMMINGGO', '水切碁', 'skimminggo'),
        K.params([
            { key: 'skim_bonus', label: '跳ね数ボーナス (空き隣+この値)', min: 0, max: 4, def: 1 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 水切り: 置いた時の空き隣接数+1が跳ね数 (耐久)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 水切り: 周りに空きが多いほど多く跳ねる (耐久 = 空き隣接数+1)
            move.cells.forEach(p => {
                const si = p.y * BOARD_SIZE + p.x;
                const open = getNeighbors(si).filter(n => board[n] === 0).length;
                st.hp[si] = open + (P('skim_bonus') ?? 1);
            });`],
        // 捕獲: 跳ね数が残る石は取られず跳ね数だけ減る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let removed = 0;
                captured.forEach(idx => {
                    if (st.hp[idx] !== undefined && st.hp[idx] > 1) {
                        st.hp[idx]--; // 水面を跳ねて耐える
                        fxSplash(idx, '#7dd3fc', 8);
                    } else {
                        board[idx] = 0;
                        delete st.hp[idx];
                        removed++;
                    }
                });
                captures[player] += removed;
                if (removed > 0) { soundManager.playCapture(); cleanUpPieces(); }
                else soundManager.playPlace();
            } else {
                soundManager.playPlace();
            }`],
        ...K.STONE_MARKS_SPEC(`            // 跳ね残り回数を波紋で描く
            {
                ctx.save();
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && st.hp[i] !== undefined && st.hp[i] > 1) {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.strokeStyle = 'rgba(56,189,248,0.7)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.04);
                        for (let k = 0; k < st.hp[i] - 1; k++) {
                            ctx.beginPath();
                            ctx.arc(cx, cy + cellSize * 0.30, cellSize * (0.50 + k * 0.18), Math.PI * 0.15, Math.PI * 0.85);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'水切り: 空き隣+1回だけ捕獲に耐える'`),
        [K.ONE, K.INFO_ALGO, `            水切碁: 石は水切り石。置いた時の空き隣接数+1回だけ捕獲に耐える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は「跳ね数」を持つ — 置いた時の空いている隣接数+1。',
            '取られるべき時に跳ね数が1より大きければ取られず、跳ね数が1減る。',
            '開けた場所の石ほど強い。跳ね数は石の下の波紋で確認できる。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.hp = {};
        // 開けた場所に置くと跳ね数が多い
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('空き4方向+1で跳ね5', st.hp[I(6, 6)] === 5);
        // 白石を囲んで取る: 跳ね数2以上なら耐える
        board[I(4, 3)] = 1; board[I(3, 4)] = 1; board[I(5, 4)] = 1;
        board[I(4, 4)] = 2; st.hp[I(4, 4)] = 3;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('跳ねて耐える', board[I(4, 4)] === 2);
        assert('跳ね数が減る', st.hp[I(4, 4)] === 2);
        st.hp[I(4, 4)] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('跳ね切れで取られる', board[I(4, 4)] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
