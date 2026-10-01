// SUBSIDENCEGO — 沈降碁: 20手ごとに盤の外周が1列ずつ沈み、盤は徐々に小さくなる
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
    file: 'subsidencego.html',
    en: 'SUBSIDENCEGO',
    jp: '沈降碁',
    prefix: 'subsidencego',
    desc: '20手ごとに盤の外周が1列ずつ海に沈む。石ごと沈み、盤は徐々に小さくなる。',
    kind: 'stone',
    icon: 'subsidencego',
    spec: [
        ...K.rb('SUBSIDENCEGO', '沈降碁', 'subsidencego'),
        K.params([
            { key: 'sink_interval', label: '沈降の間隔', min: 5, max: 50, def: 20, unit: '手' },
            { key: 'keep_size', label: '残る中央列の幅', min: 1, max: 9, def: 3, unit: '列' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { ring: 0, lastSink: 0 }; // 沈んだ輪の数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { ring: 0, lastSink: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { ring: 0, lastSink: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { ring: 0, lastSink: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { ring: 0, lastSink: 0 };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 沈降: 20手ごとに外周が1列沈む (石ごと海へ — アゲハマにならない)
            {
                const sink = Math.floor(history.length / (P('sink_interval') || 20));
                const maxRing = Math.floor((BOARD_SIZE - (P('keep_size') || 3)) / 2); // 中央N列は残す
                if (sink !== st.lastSink && history.length % (P('sink_interval') || 20) === 0 && st.ring < maxRing) {
                    st.lastSink = sink;
                    st.ring++;
                    const r = st.ring - 1; // 今回沈む輪 (0=最外周)
                    let sunk = 0;
                    board.forEach((v, i) => {
                        const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                        const d = Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
                        if (d === r) {
                            if (v === 1 || v === 2) { sunk++; fxSplash(i, '#0ea5e9', 8); }
                            board[i] = 4; // 海に沈む
                        }
                    });
                    fxShake(7, 600);
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '沈降! 外周が海へ', '#0ea5e9', 1400);
                    if (sunk) cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 沈んだ海の描画: 青い水面
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        obstaclePainter = (val, cx, cy, cs, idx) => {
            if (val !== 4) return false;
            ctx.save();
            const g = ctx.createLinearGradient(cx, cy - cs * 0.5, cx, cy + cs * 0.5);
            g.addColorStop(0, 'rgba(14,165,233,0.55)');
            g.addColorStop(1, 'rgba(12,74,110,0.75)');
            ctx.fillStyle = g;
            ctx.fillRect(cx - cs * 0.5, cy - cs * 0.5, cs, cs);
            const now = fxNow();
            const ph = Math.sin(now / 800 + idx * 0.7) * cs * 0.04;
            ctx.strokeStyle = 'rgba(224,242,254,0.7)';
            ctx.lineWidth = Math.max(1, cs * 0.03);
            ctx.beginPath();
            ctx.moveTo(cx - cs * 0.3, cy + ph);
            ctx.quadraticCurveTo(cx - cs * 0.15, cy + ph - cs * 0.06, cx, cy + ph);
            ctx.quadraticCurveTo(cx + cs * 0.15, cy + ph + cs * 0.06, cx + cs * 0.3, cy + ph);
            ctx.stroke();
            ctx.restore();
            return true;
        };`],
        ...K.EVENT_CHIP_SPEC(`'沈降まで' + ((P('sink_interval') || 20) - (history.length % (P('sink_interval') || 20))) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            沈降碁: 20手ごとに外周が海に沈み、盤が縮む<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '地盤が沈降していく — 20手ごとに盤の外周が1列ずつ海に沈み、石もろとも失われる (アゲハマにならない)。',
            '中央3列だけは残る。盤は確実に小さくなる — 早めに中央へ地を作れ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { ring: 0, lastSink: 0 };
        board[I(3, 0)] = 1;  // 最外周の黒石
        board[I(6, 6)] = 1;  // 中央の黒石
        history.length = 19;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 20手目で沈降
        assert('外周が海に沈む', board[I(3, 0)] === 4 && board[I(0, 5)] === 4);
        assert('石ごと沈む', board[I(6, 6)] === 1 && captures[2] === 0);
        assert('沈んだ所には置けない', isValidPlacement([{ x: 3, y: 0 }], 1) === false);
        assert('輪が記録される', st.ring === 1);
        board.fill(0); st = { ring: 0, lastSink: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
