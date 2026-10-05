// SHINKIROGO — 蜃気碁: 相手の視界にだけ蜃気楼の幻影が現れる。石を打つと幻影が1つ実体化する
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ mir: [], ply: 0 }`;
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { mir: [...st.mir], ply: st.ply },
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? { mir: [...(snap.st.mir || [])], ply: snap.st.ply || 0 } : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st: { mir: [...st.mir], ply: st.ply },
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? { mir: [...(s.st.mir || [])], ply: s.st.ply || 0 } : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st: { mir: [...st.mir], ply: st.ply },
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? { mir: [...(data.st.mir || [])], ply: data.st.ply || 0 } : ${init};`],
];
module.exports = {
    file: 'shinkirogo.html',
    en: 'SHINKIROGO',
    jp: '蜃気碁',
    prefix: 'shinkirogo',
    desc: '相手の視界にだけ現れる蜃気楼の幻影。石を打つたび幻影が1つ実体化する。',
    kind: 'stone',
    icon: 'shinkirogo',
    spec: [
        ...K.rb('SHINKIROGO', '蜃気碁', 'shinkirogo'),
        K.params([
            { key: 'mirage_range', label: '蜃気楼の出現範囲', min: 1, max: 3, def: 2, unit: 'マス' },
        ]),
        ...ST(ST_INIT),
        // 蜃気楼: 双方の着手後に空点へ蜃気楼候補が1つ湧き、次の着手でそれが実体化する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            st.ply++;
            const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            // 蜃気楼の実体化: 表示されていた蜃気楼が相手の色の石になる
            if (st.mir.length > 0) {
                const mi = st.mir.shift();
                if (board[mi] === 0) {
                    board[mi] = opponent;
                    // 幻影は脆い: 着地して呼吸点がなければ即消滅する
                    if (getLiberties(board, mi) === 0) {
                        board[mi] = 0;
                        fxText(mi, '霧散…', '#67e8f9', 1200);
                    } else {
                        fxText(mi, '蜃気楼!', '#67e8f9', 1400);
                    }
                }
            }
            // 新しい蜃気楼候補を湧かせる (着手点の周辺の空点)
            {
                const ring1 = getNeighbors(pi);
                let ring = ring1;
                const cand = [...ring1];
                for (let r = 1; r < Math.max(1, P('mirage_range') || 2); r++) {
                    ring = ring.flatMap(n => getNeighbors(n));
                    cand.push(...ring);
                }
                const opts = cand.filter(i => i >= 0 && i < BOARD_SIZE * BOARD_SIZE && board[i] === 0);
                if (opts.length > 0) st.mir.push(opts[(st.ply * 7 + pi) % opts.length]);
            }
            turn = opponent;`],
        // 蜃気楼を揺らぐ水色の輪郭で描く (着手側からは次に実体化する幻影として見える)
        ...K.STONE_MARKS_SPEC(`            st.mir.forEach(i => {
                const cx = padding + (i % BOARD_SIZE) * cellSize;
                const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(103,232,249,0.75)';
                ctx.setLineDash([cellSize * 0.14, cellSize * 0.12]);
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            })`),
        ...K.EVENT_CHIP_SPEC(`st.mir.length > 0 ? '蜃気楼が揺れている' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            蜃気碁: 石を打つたび周辺に蜃気楼の幻影が現れ、相手の着手で実体化する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を打つとその周辺の空点に蜃気楼の幻影 (水色の破線) が現れる。',
            '次の相手の着手で幻影は実体化し、相手の色の石として盤に刻まれる。',
            '幻影は盤面を撹乱し、意図しない地点に相手の石を増やす。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.mir = []; st.ply = 0;
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('着手で蜃気楼候補が湧く', st.mir.length === 1);
        const mi = st.mir[0];
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('蜃気楼が実体化する', board[mi] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('蜃気楼の生成が続く', st.mir.length === 1);
    `,
};
