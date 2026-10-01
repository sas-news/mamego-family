// DECOMPOSEGO — 腐生碁: 取られた石は菌に分解され土壌(4)になり、25手後に肥えた空点へ還る
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
            if (!capFired && history.length >= (P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'decomposego.html',
    en: 'DECOMPOSEGO',
    jp: '腐生碁',
    prefix: 'decomposego',
    desc: '取られた石は菌に分解され土壌になる。25手で肥えた空点に還る。',
    kind: 'stone',
    icon: 'decomposego',
    spec: [
        ...K.rb('DECOMPOSEGO', '腐生碁', 'decomposego'),
        K.params([
            { key: 'soil_turns', label: '土壌が還るまでの手数', min: 5, max: 60, def: 25, unit: '手' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 300, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { soil: {} }; // 土壌セル idx→生成手数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { soil: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { soil: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { soil: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { soil: {} };`],
        // 取られた石はその場で土壌 (値4) に分解される
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 4; // 菌に分解されて土壌になる
                    st.soil[idx] = history.length;
                    captures[player]++;
                    fxSplash(idx, '#a16207', 8);
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 腐熟: 25手経った土壌は肥えた空点に還る
            {
                Object.keys(st.soil).forEach(k => {
                    const i = +k;
                    if (board[i] !== 4) { delete st.soil[i]; return; }
                    if (history.length - st.soil[i] >= (P('soil_turns') || 25)) {
                        board[i] = 0;
                        delete st.soil[i];
                        fxGlow(i, '#84cc16', 700);
                        fxText(i, '肥えた', '#84cc16', 900);
                    }
                });
            }

            turn = opponent;`],
        // 土壌の描画: 茶色い土に小さな芽
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            const g = ctx.createRadialGradient(cx, cy - cs * 0.05, cs * 0.05, cx, cy, cs * 0.5);
            g.addColorStop(0, '#92600e'); g.addColorStop(1, '#5c3d0b');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(cx, cy + cs * 0.08, cs * 0.4, cs * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3f2a06';
            ctx.lineWidth = Math.max(1, cs * 0.04);
            ctx.stroke();
            // 芽
            const now = fxNow();
            const sway = Math.sin(now / 700 + idx) * cs * 0.03;
            ctx.strokeStyle = '#84cc16';
            ctx.lineWidth = Math.max(1, cs * 0.05);
            ctx.beginPath();
            ctx.moveTo(cx, cy + cs * 0.05);
            ctx.quadraticCurveTo(cx + sway, cy - cs * 0.1, cx + sway * 2, cy - cs * 0.22);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            腐生碁: 取られた石は土壌になり、25手後に肥えた空点へ還る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '取られた石はその場で菌に分解され「土壌」になる — 土壌には誰も置けない。',
            '土壌は25手で分解し尽くされ、肥えた空点として再び使えるようになる。',
            '戦場の跡が一時的に使えなくなる。取り合いの場所取りが変わる。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { soil: {} };
        board[I(4, 4)] = 2;
        board[I(3, 4)] = 1; board[I(5, 4)] = 1; board[I(4, 3)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('取られた場所は土壌', board[I(4, 4)] === 4 && captures[1] === 1);
        assert('土壌には置けない', isValidPlacement([{ x: 4, y: 4 }], 2) === false);
        history.length = 30;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('25手で土壌が還る', board[I(4, 4)] === 0);
        assert('還った後は置ける', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
    `,
};
