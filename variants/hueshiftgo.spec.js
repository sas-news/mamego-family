// HUESHIFTGO — 色違碁: 打つたび石の色合いが微妙にずれ、淡色石は取られたとき取った側に+1ボーナス
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
const ST_INIT = `{ hue: {}, pale: new Set() }`;
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { hue: { ...st.hue }, pale: [...st.pale] },
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? { hue: { ...(snap.st.hue || {}) }, pale: new Set(snap.st.pale || []) } : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st: { hue: { ...st.hue }, pale: [...st.pale] },
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? { hue: { ...(s.st.hue || {}) }, pale: new Set(s.st.pale || []) } : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st: { hue: { ...st.hue }, pale: [...st.pale] },
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? { hue: { ...(data.st.hue || {}) }, pale: new Set(data.st.pale || []) } : ${init};`],
];
module.exports = {
    file: 'hueshiftgo.html',
    en: 'HUESHIFTGO',
    jp: '色違碁',
    prefix: 'hueshiftgo',
    desc: '打つたび石の色合いが微妙にずれる。淡色石は取られると取った側に+1ボーナス。',
    kind: 'stone',
    icon: 'hueshiftgo',
    spec: [
        ...K.rb('HUESHIFTGO', '色違碁', 'hueshiftgo'),
        K.params([
            { key: 'pale_interval', label: '逸品石の間隔', min: 2, max: 12, def: 4, unit: '手' },
            { key: 'pale_bonus', label: '逸品ボーナス', min: 0, max: 4, def: 1, unit: '目' },
        ]),
        ...ST(ST_INIT),
        // 色違い: 着手ごとに色相がずれ、4回に1度は淡色石。淡色石を取ると+1ボーナス
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(cell => {
                board[cell.y * BOARD_SIZE + cell.x] = player;
                const ci = cell.y * BOARD_SIZE + cell.x;
                st.hue[ci] = (st.hue[ci] || 0) + 60 + (history.length * 37) % 120;
                // 4手ごとに淡色の逸品石が現れる (色相が淡い側に振り切れる)
                if (history.length % Math.max(1, P('pale_interval') || 4) === 0) st.pale.add(ci);
            });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                let bonus = 0;
                captured.forEach(idx => {
                    board[idx] = 0;
                    if (st.pale.has(idx)) { st.pale.delete(idx); bonus += (P('pale_bonus') ?? 1); }
                    delete st.hue[idx];
                });
                captures[player] += captured.length + bonus;
                if (bonus > 0) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '逸品!', '#fb7185', 1300);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 淡色石をピンクの輪で示す
        ...K.STONE_MARKS_SPEC(`            st.pale.forEach(i => {
                const cx = padding + (i % BOARD_SIZE) * cellSize;
                const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(251,113,133,0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.38, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            })`),
        ...K.EVENT_CHIP_SPEC(`st.pale.size > 0 ? '淡色石 ' + st.pale.size + '個' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            色違碁: 4手ごとに淡色の逸品石が現れる。逸品石を取ると+1のボーナスアゲハマ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '4手ごとの着手 (4,8,12手目) は色合いの淡い「逸品石」になる (ピンクの輪)。',
            '逸品石が取られると、取った側は通常のアゲハマに加えて+1のボーナスを得る。',
            '逸品を守る/狙う駆引が双方に同じ周期で生まれる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.hue = {}; st.pale = new Set();
        const B = BOARD_SIZE;
        for (let i = 0; i < 3; i++) { executeMove({ cells: [{ x: 0, y: i }] }, 1); }
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2); // 盤の4手目 → 淡色石 (白)
        assert('4手目は淡色石', st.pale.has(4 * B + 4));
        board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1; // 白の淡色石を黒で囲む
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 黒が囲いを閉じる → 白の淡色石を取る
        assert('淡色石を取ると+1ボーナス', captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 1) === true);
    `,
};
