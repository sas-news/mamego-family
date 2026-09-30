// SMOKEGO — 煙幕碁: 6手ごとの着手点を中心に3x3の煙幕が3手の間立ち込める
const K = require('../gen_kit.js');
module.exports = {
    file: 'smokego.html',
    en: 'SMOKEGO',
    jp: '煙幕碁',
    prefix: 'smokego',
    desc: '6手ごとに煙幕が上がり、区内の石は3手の間見えなくなる。',
    kind: 'smoke',
    spec: [
        ...K.rb('SMOKEGO', '煙幕碁', 'smokego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { smoke: null }; // 煙幕碁: { x, y, at } 発生中の煙幕`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { smoke: null };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { smoke: null };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { smoke: null };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { smoke: null };`],
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 煙幕碁: 煙幕は発生から3手の間有効。その3x3内は不可視
        function inSmoke(x, y) {
            return !!(st.smoke && history.length - st.smoke.at < 3
                && Math.abs(x - st.smoke.x) <= 1 && Math.abs(y - st.smoke.y) <= 1);
        }

        function drawBoardElements(padding, cellSize) {`],
        // 6手ごとの着手点に煙幕を発生させる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 煙幕碁: 6の倍数手の着地点を中心に煙幕を張る
            if (history.length % 6 === 0) {
                const sc = move.cells[0];
                st.smoke = { x: sc.x, y: sc.y, at: history.length };
                // 煙幕の発生: 3x3全区で煙の噴霧 + 盤面の振動 + 「煙幕」表示
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const sx = sc.x + dx, sy = sc.y + dy;
                    if (sx < 0 || sx >= BOARD_SIZE || sy < 0 || sy >= BOARD_SIZE) continue;
                    fxBurst(sy * BOARD_SIZE + sx, 'rgba(148,163,184,0.9)', 6, 0.8);
                }
                fxText(sc.y * BOARD_SIZE + sc.x, '煙幕', '#cbd5e1', 1100);
                fxShake(3, 220);
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const smokeA = (alive.length && inSmoke(alive[0].x, alive[0].y)) ? 0.10 : 1;
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : smokeA);`],
        K.CUE_STARS(`            // 煙幕: 3x3に灰色の煙を描く
            if (st.smoke && history.length - st.smoke.at < 3) {
                const sx = padding + (st.smoke.x - 1.5) * cellSize;
                const sy = padding + (st.smoke.y - 1.5) * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(100, 116, 139, 0.42)';
                ctx.fillRect(sx, sy, cellSize * 3, cellSize * 3);
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
                ctx.setLineDash([cellSize * 0.15, cellSize * 0.12]);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.05);
                ctx.strokeRect(sx, sy, cellSize * 3, cellSize * 3);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.smoke && history.length - st.smoke.at < 3 ? '煙幕 残り' + (3 - (history.length - st.smoke.at)) + '手' : '煙幕まで ' + (history.length % 6 === 0 ? 6 : 6 - history.length % 6) + '手'`),
        [K.ONE, K.INFO_ALGO, `            煙幕碁: 6手ごとの着地点を中心に3x3の煙幕。区内の石は3手の間見えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '6の倍数手で打たれた石の周囲3x3に煙幕が張られ、中の石は3手の間不可視になる。',
            '煙幕内の石も呼吸・取り・地には普通に働く — 霧の中の暗闘を読み合え。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 煙幕内を渦巻く煙の塊 — 静止した灰面ではなく「立ち込める煙」に
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 煙幕碁: 発生中の煙幕内を煙の塊が渦巻く常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            if (!st.smoke || history.length - st.smoke.at >= 3) return;
            ctx2.save();
            for (let k = 0; k < 8; k++) {
                const ph = now / 1600 + k * 1.31;
                const dx = Math.sin(ph * 0.9 + k * 2.4) * 0.9;
                const dy = Math.cos(ph * 0.7 + k * 1.9) * 0.9;
                const cx = pad + (st.smoke.x + dx) * cs, cy = pad + (st.smoke.y + dy) * cs;
                ctx2.globalAlpha = 0.10 + 0.08 * Math.sin(ph * 2.3 + k);
                ctx2.fillStyle = '#94a3b8';
                ctx2.beginPath();
                ctx2.arc(cx, cy, cs * (0.5 + 0.2 * Math.sin(ph + k)), 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.smoke = null;
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i % 3, y: Math.floor(i / 3) }] }, i % 2 === 0 ? 1 : 2);
        assert('6手目で煙幕発生', !!st.smoke && st.smoke.at === 6);
        assert('着地点中心が煙幕', inSmoke(1, 1) === true);
        assert('煙幕外は晴れ', inSmoke(BOARD_SIZE - 1, BOARD_SIZE - 1) === false);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 8 }] }, 1);
        assert('3手後に煙幕は晴れる', inSmoke(1, 1) === false);
    `,
};
