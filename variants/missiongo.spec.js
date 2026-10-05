// MISSIONGO — 布教碁: 呼吸点を全て塞がれた敵石は取られずに改宗し、攻めた側の色に変わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'missiongo.html',
    en: 'MISSIONGO',
    jp: '布教碁',
    prefix: 'missiongo',
    desc: '取られる石は盤を離れず改宗して攻めた側の色に変わる。地取り布教合戦。',
    kind: 'stone',
    icon: 'missiongo',
    spec: [
        ...K.rb('MISSIONGO', '布教碁', 'missiongo'),
        K.params([
            { key: 'cap', label: '打ち切り手数', min: 50, max: 300, def: 140, unit: '手' },
        ]),
        // 捕獲を「改宗」に置き換え: 取られた敵石は player 色に変わる
        [K.ONE, K.CAPTURE_BLOCK, `            // 布教: 取られた敵石は盤を離れず、player色に改宗する
            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(i => { board[i] = player; });
                captures[player] += captured.length;
                captured.forEach(i => fxText(i, '改宗', '#22d3ee', 900));
                fxShake(Math.min(6, captured.length), 280);
                cleanUpPieces(); // 改宗で色が変わった分を描画に反映
            }`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 全改宗判定: 敵石が打たれたことがあり、かつ盤上に残っていなければ布教完了
            if (history.filter(h => h.turn === opponent).length > 0 && !board.includes(opponent)) {
                winByRule(player, '布教完了', '盤上の全ての敵石が改宗しました'); return;
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, K.INFO_BASE, `            布教碁: 呼吸点を全て塞がれた敵石は取られずに改宗し、攻めた側の色に変わる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '呼吸点を全て塞がれた敵石は盤から取られず、その場で打った側の色に改宗する (アゲハマとしては数える)。',
            '敵石を囲んで改宗させると自分の勢力がそのまま増える — 布教の連鎖を狙おう。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 黒の初手では布教完了にならない
        assert('初手では終わらない', gameOver === false);
        board.fill(0); pieces = []; history.length = 1; turn = 2; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 2, y: 2 }] }, 2); // 白が1手打つ (履歴あり)
        board.fill(0);
        board[2 * BOARD_SIZE + 2] = 2;
        board[2 * BOARD_SIZE + 1] = 1; board[1 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1); // 白を囲む
        assert('白石は取られず改宗', board[2 * BOARD_SIZE + 2] === 1);
        assert('改宗はアゲハマとして数える', captures[1] === 1);
        assert('盤上に敵石ゼロで布教完了', gameOver === true && gameResultData && gameResultData.title.includes('布教'));
    `,
};
