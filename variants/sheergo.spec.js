// SHEERGO — 透け碁: 手番でない側の石は半透明に透け、アゲハマ表示も「約」で曖昧になる
const K = require('../gen_kit.js');
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
    file: 'sheergo.html',
    en: 'SHEERGO',
    jp: '透け碁',
    prefix: 'sheergo',
    desc: '手番でない側の石は半透明に透け、アゲハマ表示も「約」の曖昧表示。正確な形勢は読めない。',
    kind: 'stone',
    icon: 'sheergo',
    spec: [
        ...K.rb('SHEERGO', '透け碁', 'sheergo'),
        K.params([
            { key: 'cap_round', label: 'アゲハマ表示の丸め単位', min: 1, max: 10, def: 4, hint: '大きいほど曖昧' },
            { key: 'foe_alpha', label: '相手石の透明度', min: 0.1, max: 1, def: 0.5, step: 0.1 },
        ]),
        // 手番でない側の石を半透明に (ピース描画)
        [K.ONE, `                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                drawPieceShape(alive, padding, cellSize, fill, stroke, (isDead ? 0.35 : 1) * (pc.player !== turn ? Math.max(0, Math.min(1, P('foe_alpha') || 0.5)) : 1));`],
        // フォールバック描画も半透明に
        [K.ONE, `                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, isDead ? 0.35 : 1);`,
`                    drawPieceShape([{ x, y }], padding, cellSize, fill, stroke, (isDead ? 0.35 : 1) * (val !== turn ? Math.max(0, Math.min(1, P('foe_alpha') || 0.5)) : 1));`],
        // アゲハマ表示は「約」で曖昧に
        [K.ONE, `            blackCapturesEl.textContent = captures[1];
            whiteCapturesEl.textContent = captures[2];`,
`            blackCapturesEl.textContent = '~' + Math.round(captures[1] / Math.max(1, P('cap_round') || 4)) * Math.max(1, P('cap_round') || 4);
            whiteCapturesEl.textContent = '~' + Math.round(captures[2] / Math.max(1, P('cap_round') || 4)) * Math.max(1, P('cap_round') || 4);`],
        ...K.EVENT_CHIP_SPEC(`'手番側だけ実色'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            透け碁: 手番でない側の石は半透明に透け、アゲハマも「約」表示で正確な数が読めない<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の手番には相手の石が半透明に透ける。数や形を正確に読むのは難しい。',
            'アゲハマ表示も「~約数」の曖昧表示 (内部計算は正確)。',
            '見た目の曖昧さを補うため、呼吸や取りのルール自体は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 5 }] }, 2);
        assert('起動して着手できる', board[5 * BOARD_SIZE + 5] === 1);
        assert('白も着手', board[5 * BOARD_SIZE + 6] === 2);
        assert('手番は戻る', turn === 1);
        // アゲハマは約表示 (UI 側の関数が存在するなら)
        if (typeof updateUI === 'function') {
            updateUI();
            assert('アゲハマは曖昧表示', String(blackCapturesEl.textContent).startsWith('~'));
        }
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
