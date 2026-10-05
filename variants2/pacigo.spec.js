// PACIGO — 平和碁: 一度も石を取らなかった側が勝つ (両者取った場合のみ通常採点)
const K = require('../gen_kit.js');
module.exports = {
    file: 'pacigo.html',
    en: 'PACIGO',
    jp: '平和碁',
    prefix: 'pacigo',
    desc: '一度も取らなかった側が勝つ。取り合いになると通常の地取り勝負に戻る。',
    kind: 'peace',
    spec: [
        ...K.rb('PACIGO', '平和碁', 'pacigo'),
        K.params([
            { key: 'peace_cap', label: '平和とみなす取り数上限', min: 0, max: 5, def: 0, unit: '個' },
        ]),
        // 平和判定を endGameByScore 内に組み込む: 勝者決定部を差替
        [K.ONE, `            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';`,
`            let winnerTitle = '';
            const bPeace = captures[1] <= (P('peace_cap') || 0), wPeace = captures[2] <= (P('peace_cap') || 0);
            if (bPeace !== wPeace) {
                // 平和ルール: 一度も取らなかった側が無条件勝ち
                winnerTitle = (bPeace ? '黒' : '白') + 'の平和勝ち';
            } else if (blackTotal > whiteTotal) winnerTitle = \`黒の勝ち (\${diff} 目差)\`;
            else if (whiteTotal > blackTotal) winnerTitle = \`白の勝ち (\${diff} 目差)\`;
            else winnerTitle = '引き分け';`],
        [K.ONE, `                title: \`\${winnerTitle} (\${diff} 目差)\`,`,
`                title: winnerTitle,`],
        // 条約違反: 取った手には赤い警告が立つ (平和維持が破れた合図)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(ci, '#ef4444', 900);
                fxText(ci, '条約違反!', '#ef4444', 1200);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.RV_BASE, K.rv([
            '平和条約: 一度も相手の石を取らなかった側が勝つ (両者取った、または両者無血なら通常採点)。',
            '取ると条約違反 — でも取らなければ地取りでは不利かもしれない。駆け引きの碁。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        captures[1] = 0; captures[2] = 5;
        endGameByScore();
        assert('取らなかった黒の平和勝ち', gameResultData.title.includes('平和') && gameResultData.title.includes('黒'));
        captures[1] = 3; captures[2] = 5;
        endGameByScore();
        assert('両者取れば通常採点', !gameResultData.title.includes('平和'));
        captures[1] = 0; captures[2] = 0;
        endGameByScore();
        assert('両者無血も通常採点', !gameResultData.title.includes('平和'));
        assert('起動着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
