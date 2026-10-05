// BATTLELINEGO — 陣形碁: 布陣(連の形)で強さが決まる。直線4連の槍陣・2x2の方陣で得点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'battlelinego.html',
    en: 'BATTLELINEGO',
    jp: '陣形碁',
    prefix: 'battlelinego',
    desc: '布陣で得点。直線4連の「槍陣」と2x2の「方陣」を完成させると各+1目。',
    kind: 'stone',
    icon: 'battlelinego',
    spec: [
        ...K.rb('BATTLELINEGO', '陣形碁', 'battlelinego'),
        K.params([
            { key: 'line_len', label: '槍陣の連数', min: 3, max: 6, def: 4, unit: '連' },
            { key: 'line_pts', label: '槍陣の得点', min: 1, max: 5, def: 1, unit: '目' },
            { key: 'square_pts', label: '方陣の得点', min: 1, max: 5, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.1, hint: '交点数×倍率' },
        ]),
        // 陣形ルール: 着手で直線4連(槍陣)や2x2(方陣)が完成すると各+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 陣形: 直線4連(槍陣) +1 / 2x2ブロック(方陣) +1
            {
                const mx = move.cells[0].x, my = move.cells[0].y;
                const at = (x, y) => (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) ? board[y * BOARD_SIZE + x] : -1;
                // 横・縦の直線ラン
                let runH = 1;
                for (let d = 1; at(mx - d, my) === player; d++) runH++;
                for (let d = 1; at(mx + d, my) === player; d++) runH++;
                let runV = 1;
                for (let d = 1; at(mx, my - d) === player; d++) runV++;
                for (let d = 1; at(mx, my + d) === player; d++) runV++;
                if (runH >= (P('line_len') || 4) || runV >= (P('line_len') || 4)) {
                    captures[player] += (P('line_pts') || 1);
                    fxText(my * BOARD_SIZE + mx, '槍陣 +1', '#f87171', 1200);
                    fxShake(4, 280);
                }
                // 2x2ブロック (着手石を含む4候補)
                let square = false;
                [[0, 0], [-1, 0], [0, -1], [-1, -1]].forEach(([ox, oy]) => {
                    if (at(mx + ox, my + oy) === player && at(mx + ox + 1, my + oy) === player &&
                        at(mx + ox, my + oy + 1) === player && at(mx + ox + 1, my + oy + 1) === player) square = true;
                });
                if (square) {
                    captures[player] += (P('square_pts') || 1);
                    fxGlow(my * BOARD_SIZE + mx, '#facc15', 700);
                    fxText(my * BOARD_SIZE + mx, '方陣 +1', '#facc15', 1200);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'直線4連=槍陣 / 2x2=方陣'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            陣形碁: 着手で直線4連の「槍陣」や2x2の「方陣」が完成すると各+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '直線に4連以上並ぶ「槍陣」が完成すると+1目。2x2の「方陣」が完成しても+1目 (1手で両方なら+2)。',
            '布陣の形がそのまま得点になる。陣を組むか、敵の布陣を崩すか。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[4 * BOARD_SIZE + 6] = 1;
        executeMove({ cells: [{ x: 7, y: 4 }] }, 1);
        assert('直線4連で槍陣+1', captures[1] === 1);
        captures = { 1: 0, 2: 0 };
        board[8 * BOARD_SIZE + 8] = 1; board[8 * BOARD_SIZE + 9] = 1; board[9 * BOARD_SIZE + 8] = 1;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('2x2完成で方陣+1', captures[1] >= 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
