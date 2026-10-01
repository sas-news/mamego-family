// INVERSIONGO — 逆転碁: 地+アゲハマの合計が「少ない」側が勝ち。取りすぎ・囲いすぎは敗北に繋がる
const K = require('../gen_kit.js');
// 終局保証 (全バリアント共通): 連続パス→採点終局 + 手数打ち切り
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
module.exports = {
    file: 'inversiongo.html',
    en: 'INVERSIONGO',
    jp: '逆転碁',
    prefix: 'inversiongo',
    desc: '地とアゲハマの合計が少ない側が勝つ逆転ルール。取りすぎると負ける。',
    kind: 'stone',
    icon: 'inversiongo',
    spec: [
        ...K.rb('INVERSIONGO', '逆転碁', 'inversiongo'),
        K.params([
            { key: 'win_rule', label: '勝敗ルール', options: [{ v: 'less', l: '少ない側が勝ち' }, { v: 'more', l: '多い側が勝ち(通常)' }], def: 'less' },
        ]),
        // 勝者判定を反転: 合計が少ない側の勝ち (設定で通常判定にも戻せる)
        [K.ONE, `            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`,
`            let winnerTitle = '';
            // 逆転ルール: 合計が「少ない」側の勝ち (win_rule 設定で通常判定にできる)
            const invLess = (P('win_rule') || 'less') === 'less';
            if (invLess ? blackTotal < whiteTotal : blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (invLess ? whiteTotal < blackTotal : whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="mt-1 text-xs">逆転ルール: 合計が少ない側の勝ち</div>`],
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            逆転碁: 地とアゲハマの合計が「少ない」側の勝ち (逆転ルール)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '逆転ルール: 終局時、地+アゲハマ+コミの合計が「少ない」側が勝者になる。',
            '石を取りすぎても地を囲いすぎても負けに近づく。相手に取らせ・囲わせる読み合いの碁。',
            '着手・取り・コウ・パス終局は通常の囲碁と同じ。コミ6.5目も白の加点として働く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); captures = { 1: 0, 2: 0 };
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('少ない側 (黒0<白6.5) が勝ち', gameResultData && gameResultData.title.includes('黒の勝ち'));
        assert('逆転ルール明記', gameResultData.details.includes('逆転'));
        assert('通常着手は有効', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
