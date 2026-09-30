// JADEGO — 翡翠碁: 石は翡翠。盤上で生き延びるほど深い緑に磨かれ、終局時に磨きボーナス
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
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
module.exports = {
    file: 'jadego.html',
    en: 'JADEGO',
    jp: '翡翠碁',
    prefix: 'jadego',
    desc: '生き残った石ほど深い緑に磨かれる。8手超で+1目、16手超で+2目の磨きボーナス。',
    kind: 'stone',
    icon: 'jadego',
    spec: [
        ...K.rb('JADEGO', '翡翠碁', 'jadego'),
        ...ST('{ born: {} }'),
        // 着手時に石の生成手を記録する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 翡翠碁: 石の生成手を記録 (磨き = 盤上で生き延びた手数)
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.born[mi] = history.length;
                for (const k in st.born) if (board[k] === 0 || board[k] === 3) delete st.born[k];
            }

            turn = opponent;`],
        // 磨かれた翡翠は緑の光輪で示す (年季ほど濃く)
        ...K.STONE_MARKS_SPEC(`            // 磨き翡翠: 生き延びた石ほど深い緑の光輪
            {
                ctx.save();
                for (const k in st.born) {
                    const idx = +k;
                    if (board[idx] !== 1 && board[idx] !== 2) continue;
                    const age = history.length - st.born[k];
                    if (age < 8) continue;
                    const x = idx % BOARD_SIZE, y = (idx / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = age >= 16 ? 'rgba(16,185,129,0.95)' : 'rgba(52,211,153,0.65)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (age >= 16 ? 0.34 : 0.27), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        // 終局時に磨きボーナスを地に加算
        [K.ONE, `        function endGameByScore() {`,
`        // 翡翠の磨き: 8手超の石は+1目、16手超の石は+2目
        function jadeBonus(p) {
            let b = 0;
            for (const k in st.born) {
                if (board[k] !== p) continue;
                const age = history.length - st.born[k];
                if (age >= 16) b += 2; else if (age >= 8) b += 1;
            }
            return b;
        }
        function endGameByScore() {`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            territory.black += jadeBonus(1);
            territory.white += jadeBonus(2);`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            翡翠碁: 石は生き残るほど深い緑に磨かれる。8手超+1目・16手超+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いた石は翡翠 — 盤上で生き延びるほど深い緑に磨かれる。',
            '終局時、8手を超えて残った石は+1目、16手を超えた石は+2目の磨きボーナス。',
            '石を守り抜く持久戦が光る。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.born = {}; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        const mi = I(4, 4);
        assert('生成手を記録', st.born[mi] === 1);
        assert('若い石はボーナスなし', jadeBonus(1) === 0);
        history.length = 20;
        assert('16手超で+2', jadeBonus(1) === 2);
        board[mi] = 0;
        assert('取られた石は無効', jadeBonus(1) === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
