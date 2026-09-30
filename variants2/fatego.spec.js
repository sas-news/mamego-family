// FATEGO — 運命碁: 10手ごとに「運命」が訪れ、着手した側に加護 (+2目) が降る。5手前から予告される
const K = require('../gen_kit.js');
module.exports = {
    file: 'fatego.html',
    en: 'FATEGO',
    jp: '運命碁',
    prefix: 'fatego',
    desc: '10手ごとの運命の手で着手側に+2目。5手前から告知される。',
    kind: 'fate',
    spec: [
        ...K.rb('FATEGO', '運命碁', 'fatego'),
        // 運命イベント: 10の倍数手の着手者に加護+2 (アゲハマに加算)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 運命碁: 10の倍数手に運命の加護 — その手を打った側に+2目
            if (history.length % 10 === 0) {
                captures[player] += 2;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`history.length % 10 === 0 ? '運命の加護 +2!' : ((10 - history.length % 10) <= 5 ? '運命まで ' + (10 - history.length % 10) + '手' : '')`),
        K.CUE_STARS(`            // 運命: 直前の手を打った位置に運命の輪 (イベント5手前から脈動)
            if (lastMove && (10 - history.length % 10) <= 5) {
                const lc = lastMove.cells[0];
                const cx = padding + lc.x * cellSize, cy = padding + lc.y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.09]);
                ctx.lineWidth = Math.max(1.4, cellSize * 0.055);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            運命碁: 10手ごとに「運命」— その手を打った側に+2目の加護。5手前から告知<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '10・20・30…手目は「運命の手」— その手を打った側に+2目の加護が降る。',
            '運命の5手前からイベント予告が出る。誰が運命手を拾うかの駆け引きが勝敗を分ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        history.length = 9;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 10手目 → 運命
        assert('10手目の着手者に加護', captures[2] === 2);
        assert('相手には降らない', captures[1] === 0);
        history.length = 19;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // 20手目 → 運命
        assert('20手目は黒の加護', captures[1] === 2);
        assert('白は変わらず', captures[2] === 2);
    `,
};
