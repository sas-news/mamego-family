// WEATHERINGGO — 風化碁: 石は置いてから30手で風化して砂(4)になり、砂は12手で空に還る
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= (P('cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'weatheringgo.html',
    en: 'WEATHERINGGO',
    jp: '風化碁',
    prefix: 'weatheringgo',
    desc: '石は30手で風化して砂になり、砂は12手で空に還る。永遠の地はない。',
    kind: 'stone',
    icon: 'weatheringgo',
    spec: [
        ...K.rb('WEATHERINGGO', '風化碁', 'weatheringgo'),
        K.params([
            { key: 'weather_age', label: '風化までの手数', min: 8, max: 90, def: 30, unit: '手' },
            { key: 'sand_age', label: '砂の寿命', min: 4, max: 40, def: 12, unit: '手' },
            { key: 'cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { age: {}, sand: {} }; // 石の誕生手数・砂の生成手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { age: {}, sand: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { age: {}, sand: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { age: {}, sand: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { age: {}, sand: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 風化: 置いた石に年齢を刻み、30手で砂に、砂は12手で空に還る
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.age[li] = history.length;
                Object.keys(st.age).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) { delete st.age[i]; return; }
                    if (history.length - st.age[i] >= (P('weather_age') || 30)) {
                        board[i] = 4; // 風化して砂になる
                        st.sand[i] = history.length;
                        delete st.age[i];
                        fxSplash(i, '#d6d3d1', 7);
                    }
                });
                Object.keys(st.sand).forEach(k => {
                    const i = +k;
                    if (board[i] !== 4) { delete st.sand[i]; return; }
                    if (history.length - st.sand[i] >= (P('sand_age') || 12)) {
                        board[i] = 0;
                        delete st.sand[i];
                        fxGlow(i, '#d6d3d1', 500);
                    }
                });
                if (Object.keys(st.sand).length || Object.keys(st.age).length) cleanUpPieces();
            }

            turn = opponent;`],
        // 砂の描画: 小さな砂の山
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            ctx.fillStyle = '#e7e5e4';
            ctx.beginPath();
            ctx.moveTo(cx - cs * 0.28, cy + cs * 0.18);
            ctx.quadraticCurveTo(cx - cs * 0.1, cy - cs * 0.15, cx, cy - cs * 0.2);
            ctx.quadraticCurveTo(cx + cs * 0.1, cy - cs * 0.15, cx + cs * 0.28, cy + cs * 0.18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#a8a29e';
            ctx.lineWidth = Math.max(1, cs * 0.03);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        // 風化間近の石にひび
        ...K.STONE_MARKS_SPEC(`            // 風化間近 (残り10手) の石にひびマーク
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(120,113,108,0.9)';
                ctx.lineWidth = Math.max(1, cellSize * 0.035);
                Object.keys(st.age || {}).forEach(k => {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) return;
                    if (history.length - st.age[i] < (P('weather_age') || 30) - 10) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.12, cy - cellSize * 0.15);
                    ctx.lineTo(cx - cellSize * 0.02, cy);
                    ctx.lineTo(cx - cellSize * 0.1, cy + cellSize * 0.12);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            風化碁: 石は30手で砂になり、砂は12手で空に還る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '全ての石は時間とともに風化する — 置いてから30手で砂の山になり (置けない)、砂は12手で空に還る。',
            'ひびの入った石は風化間近。長持ちする地はなく、守りも攻めも時間との勝負。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { age: {}, sand: {} };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('誕生手数が刻まれる', st.age[I(4, 4)] === 1);
        history.length = 31;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 32手目: (4,4)は31手経過
        assert('30手で風化する', board[I(4, 4)] === 4);
        history.length = 43;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // 44手目: 砂も12手経過
        assert('砂は空に還る', board[I(4, 4)] === 0);
        board.fill(0); st = { age: {}, sand: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
