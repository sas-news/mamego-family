// RADARGO — 探知碁: 敵石は普段ほぼ不可視。3手ごとのレーダー照射で一瞬可視化
const K = require('../gen_kit.js');
module.exports = {
    file: 'radargo.html',
    en: 'RADARGO',
    jp: '探知碁',
    prefix: 'radargo',
    desc: '敵石は霧の中。3手ごとのレーダーで一瞬だけ全て見える。',
    kind: 'radar',
    spec: [
        ...K.rb('RADARGO', '探知碁', 'radargo'),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 探知碁: 着手数が3の倍数の局面でレーダー照射 → 敵石が可視化される
        function isRadarOn() { return history.length > 0 && history.length % 3 === 0; }
        // 手番側から見た敵石の濃さ (レーダー中は実色、普段は幽霊)
        function fogAlphaFor(pl) { return (pl !== turn && !isRadarOn()) ? 0.10 : 1; }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const visA = fogAlphaFor(pc.player);
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : visA);`],
        ...K.STONE_MARKS_SPEC(`            // レーダー照射中: 敵石にソナーリング
            if (isRadarOn()) {
                ctx.save();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                board.forEach((v, i) => {
                    if (v === 0 || v === turn) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.14, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`isRadarOn() ? 'レーダー照射中' : 'レーダーまで ' + (3 - history.length % 3) + '手'`),
        [K.ONE, K.INFO_ALGO, `            探知碁: 手番でない側の石は霧の中に隠れる。3手ごとにレーダーが敵石を照らす<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '相手の石は薄い影でしか見えない (自分の石は常にはっきり見える)。',
            '3手ごとの着手直後にレーダーが走り、その局面だけ敵石が全て可視化される。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        // レーダー照射の瞬間: 全敵石が発光し、中央にソナーのピンが立つ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 探知碁: 3の倍数手でレーダー照射 → 敵石が光って見える合図
            if (history.length % 3 === 0) {
                board.forEach((v, i) => { if (v === opponent) fxGlow(i, '#38bdf8', 700); });
                const mc = move.cells[0];
                if (mc) fxText(mc.y * BOARD_SIZE + mc.x, 'レーダー', '#7dd3fc', 1100);
            }

            turn = opponent;`],
        // 常に回るレーダースコープの掃引線 — 「この盤は探知機の中」を演出
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 探知碁: 盤中央から回るレーダー掃引線 + 微かな同心円 (常時オーバーレイ)
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const cx = w / 2, cy = w / 2;
            ctx2.save();
            ctx2.globalAlpha = 0.10;
            ctx2.strokeStyle = '#38bdf8';
            ctx2.lineWidth = Math.max(1, cs * 0.03);
            [0.25, 0.5, 0.75].forEach(rr => {
                ctx2.beginPath();
                ctx2.arc(cx, cy, w * 0.5 * rr, 0, Math.PI * 2);
                ctx2.stroke();
            });
            const ang = now / 2400 * Math.PI * 2;
            const g = ctx2.createLinearGradient(cx, cy, cx + Math.cos(ang) * w * 0.6, cy + Math.sin(ang) * w * 0.6);
            g.addColorStop(0, 'rgba(56,189,248,0.35)');
            g.addColorStop(1, 'rgba(56,189,248,0)');
            ctx2.globalAlpha = isRadarOn() ? 0.55 : 0.18;
            ctx2.strokeStyle = g;
            ctx2.lineWidth = Math.max(1.5, cs * 0.06);
            ctx2.beginPath();
            ctx2.moveTo(cx, cy);
            ctx2.lineTo(cx + Math.cos(ang) * w * 0.6, cy + Math.sin(ang) * w * 0.6);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('初期はレーダーOFF', isRadarOn() === false);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2);
        assert('2手目でもOFF', isRadarOn() === false);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1);
        assert('3手目でレーダーON', isRadarOn() === true);
        assert('レーダー中は敵石が実色', fogAlphaFor(2) === 1);
        executeMove({ cells: [{ x: 2, y: 2 }] }, 2);
        assert('4手目でOFFに戻る', isRadarOn() === false);
        assert('OFF時の敵石は薄い', fogAlphaFor(2) === 0.10);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
