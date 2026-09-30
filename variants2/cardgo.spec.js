// CARDGO — 札碁: 手番ごとに札が引かれ、その手の取りルールが変わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'cardgo.html',
    en: 'CARDGO',
    jp: '札碁',
    prefix: 'cardgo',
    desc: '手番ごとに札を引く。恵みは取り2倍、呪いは取り不可。',
    kind: 'card',
    spec: [
        ...K.rb('CARDGO', '札碁', 'cardgo'),
        [K.ONE, '        function executeMove(move, player) {',
`        // 札碁: 手数 mod 3 でその手の札が決まる (1=恵み:取り2倍, 2=呪い:取り不可, 0=通常)
        function currentCard(n) { return (n === undefined ? history.length : n) % 3; }
        function cardName(c) { return c === 1 ? '恵みの札 (取り2倍)' : c === 2 ? '呪いの札 (取り不可)' : '通常の札'; }

        function executeMove(move, player) {`],
        // 札の効果: 恵みなら取り点2倍、呪いならその手では取れない
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            const card = currentCard();
            if (captured.length > 0 && card !== 2) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length * (card === 1 ? 2 : 1);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        ...K.EVENT_CHIP_SPEC(`'札: ' + cardName(currentCard())`),
        K.CUE_STARS(`            // 呪いの手は盤を薄暗く、恵みの手は金色に照らす
            {
                const c = currentCard();
                if (c !== 0) {
                    const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                    ctx.save();
                    ctx.fillStyle = c === 2 ? 'rgba(88, 28, 135, 0.14)' : 'rgba(250, 204, 21, 0.10)';
                    ctx.fillRect(0, 0, w, w);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            札碁: 手番ごとに札が引かれる。恵み=取り2倍、呪い=取り不可、通常=そのまま<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '手番ごとに札が巡る: 恵みの札 (取り点2倍) → 呪いの札 (その手は取れない) → 通常の札。',
            '取りたい手が呪いに当たると涙を飲む — 取り切りのタイミング読みが運命を分ける。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('1手目は恵みの札', currentCard(1) === 1);
        assert('2手目は呪いの札', currentCard(2) === 2);
        assert('3手目は通常の札', currentCard(3) === 0);
        // 恵みの手で白単石を取る → 2倍の2点
        board[1 * BOARD_SIZE + 1] = 2;
        board[0 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 0] = 1; board[1 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: 1, y: 2 }] }, 1); // history.length=1 → 恵み
        assert('恵みで2倍の取り', captures[1] === 2);
        // 呪いの手では取れない
        board[5 * BOARD_SIZE + 5] = 2;
        board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 4] = 1; board[6 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 1); // history.length=2 → 呪い
        assert('呪いでは取れない', board[5 * BOARD_SIZE + 5] === 2 && captures[1] === 2);
    `,
};
