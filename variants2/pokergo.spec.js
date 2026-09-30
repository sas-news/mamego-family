// POKERGO — 扑克碁: 行の並びでポーカー役を作り終局時に加算勝負
const K = require('../gen_kit.js');
module.exports = {
    file: 'pokergo.html',
    en: 'POKERGO',
    jp: '扑克碁',
    prefix: 'pokergo',
    desc: '各行の並びでポーカー役を作る。フルハウス+10、ファイブカード+20。',
    kind: 'stone',
    spec: [
        ...K.rb('POKERGO', '扑克碁', 'pokergo'),
        [K.ONE, `        function endGameByScore() {`,
`        // 扑克碁: 各行の同色の連続した並びでポーカー役を作りボーナスを返す
        function pokerBonus(player) {
            const cnt = { 2: 0, 3: 0, 4: 0, 5: 0 };
            for (let y = 0; y < BOARD_SIZE; y++) {
                let run = 0;
                for (let x = 0; x <= BOARD_SIZE; x++) {
                    const v = x < BOARD_SIZE ? board[y * BOARD_SIZE + x] : 0;
                    if (v === player) { run++; }
                    else {
                        if (run >= 2) cnt[Math.min(run, 5)]++;
                        run = 0;
                    }
                }
            }
            if (cnt[5] >= 1) return 20;                    // ファイブカード
            if (cnt[4] >= 1) return 12;                    // フォーカード
            if (cnt[3] >= 1 && cnt[2] >= 1) return 10;     // フルハウス
            if (cnt[3] >= 1) return 6;                     // スリーカード
            if (cnt[2] >= 2) return 4;                     // ツーペア
            if (cnt[2] >= 1) return 2;                     // ワンペア
            return 0;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const pbonus = { 1: pokerBonus(1), 2: pokerBonus(2) };
            const blackTotal = territory.black + captures[1] + pbonus[1];
            const whiteTotal = territory.white + captures[2] + komi + pbonus[2];`],
        [K.ONE, `<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="flex justify-between"><span>ポーカー役:</span> <strong>黒+\${pbonus[1]} / 白+\${pbonus[2]}</strong></div>`],
        [K.ONE, K.INFO_ALGO, `            扑克碁: 行の並びでポーカー役を作り終局時に加算勝負<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '終局時、各行の自分色の並びがポーカーの役になる (最も強い役だけ加算)。',
            'ワンペア+2/ツーペア+4/スリーカード+6/フルハウス+10/フォーカード+12/ファイブカード+20目。',
            '横一線に並べる強欲さと、地を確保する堅実さのバランスが問われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[0] = 1; board[1] = 1;
        board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1;
        assert('ツーペア', pokerBonus(1) === 4);
        board[3] = 1; board[4] = 1; board[5] = 1;
        assert('フルハウス', pokerBonus(1) === 10);
        assert('白は役なし', pokerBonus(2) === 0);
    `,
};
