// BIDGO — 入札碁: 星点は入札点。占めるにはアゲハマで代価を支払い、値段は取るたびに吊り上がる
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
const ST_INIT = `{ level: 0 }`;
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
module.exports = {
    file: 'bidgo.html',
    en: 'BIDGO',
    jp: '入札碁',
    prefix: 'bidgo',
    desc: '星点は入札点。占めるたびにアゲハマで代価を払い、値段は吊り上がる。',
    kind: 'stone',
    icon: 'bidgo',
    spec: [
        ...K.rb('BIDGO', '入札碁', 'bidgo'),
        ...ST(ST_INIT),
        // 入札: 星点に打つと現在の競り値 (1,2,3...) をアゲハマで相手に支払う。値は取るたび+1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const onStar = getStarPoints(BOARD_SIZE).some(pt => pt.y * BOARD_SIZE + pt.x === pi);
                if (onStar) {
                    const cost = st.level + 1;
                    st.level++;
                    captures[opponent] += cost;
                    fxText(pi, '入札 ' + cost + '石', '#f59e0b', 1300);
                    fxGlow(pi, '#f59e0b', 850);
                }
            }

            turn = opponent;`],
        // 入札点を金の槌マークで強調 (星点は STONE_SPEC で描かれるが競り対象と分かるようリング)
        ...K.STONE_MARKS_SPEC(`            getStarPoints(BOARD_SIZE).forEach(pt => {
                const i = pt.y * BOARD_SIZE + pt.x;
                if (board[i] !== 0) return;
                const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(245,158,11,0.55)';
                ctx.lineWidth = Math.max(1, cellSize * 0.045);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`'次の入札 ' + (st.level + 1) + '石'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            入札碁: 星点に打つと入札成立 — 競り値分のアゲハマを相手に支払う。値は取るたびに上がる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の星点は「入札点」。そこに石を置くと、今の競り値だけアゲハマを相手に支払う。',
            '競り値は1石から始まり、入札が成立するたびに+1石ずつ吊り上がる (両者共通)。',
            '高値でも星点を取るか、安い他の点で我慢するか — 石数を消費する争奪戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.level = 0;
        const star = getStarPoints(BOARD_SIZE)[0];
        executeMove({ cells: [star] }, 1);
        assert('初回入札は1石', captures[2] === 1);
        assert('競り値が上がる', st.level === 1);
        const star2 = getStarPoints(BOARD_SIZE)[1];
        executeMove({ cells: [star2] }, 2);
        assert('2回目は2石を支払う', captures[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('星点以外は無料', captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
    `,
};
