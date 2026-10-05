// THREEWAYGO — 三方碁: 黒・白・赤の3人対局。順番に打ち、2人連続パスで終局。2・3番手は順位コミ付き
const K = require('../gen_kit.js');
const ST_INIT = `{ }`;
module.exports = {
    file: 'threewaygo.html',
    en: 'THREEWAYGO',
    jp: '三方碁',
    prefix: 'threewaygo',
    desc: '黒・白・赤の3人対局。順番に打ち、3人連続パスで終局。順位コミで後手を補正。',
    kind: 'stone',
    icon: 'threewaygo',
    spec: [
        ...K.rb('THREEWAYGO', '三方碁', 'threewaygo'),
        K.params([
            { key: 'komi2', label: '白 (2番手) の順位コミ', min: 0, max: 13, step: 0.25, def: 3.25, unit: '目' },
            { key: 'komi3', label: '赤 (3番手) の順位コミ', min: 0, max: 13, step: 0.25, def: 6.5, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        // アゲハマは3人分 (宣言時とリセット時の両方)
        [K.ALL, 'captures = { 1: 0, 2: 0 };', 'captures = { 1: 0, 2: 0, 3: 0 };'],
        // 有効判定: 他の2勢力の死に連を両方捕獲判定
        [K.ONE, `            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);`,
`            const opponents = [1, 2, 3].filter(o => o !== player);
            const captured = opponents.flatMap(o => getCapturedStones(tempBoard, o));`],
        // 実行時の捕獲も2勢力分
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = [1, 2, 3].filter(o => o !== player).flatMap(o => getCapturedStones(board, o));
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 3人順番に手番を回す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = player % 3 + 1;`],
        // パスは3人連続で終局
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 3) {
                // 簡略化: 3人連続パスで採点終局
                endGameByScore();`],
        // パス後の手番も3人順番 (handlePass内の turn = player===1?2:1 は最後の opponent 宣言を使う)
        [K.ONE, `            turn = turn === 1 ? 2 : 1;`,
`            turn = turn % 3 + 1;`],
        // 赤石 (値3) の描画
        [K.ONE, `                    if (val >= 3) { drawObstacleCell(val, cx, cy, cellSize, idx); continue; }`,
`                    if (val === 3) { drawPieceShape([{ x, y }], padding, cellSize, '#dc2626', '#7f1d1d', 1); continue; }
                    if (val > 3) { drawObstacleCell(val, cx, cy, cellSize, idx); continue; }`],
        [K.ONE, `                const fill = pc.player === 1 ? currentTheme.p1Fill : currentTheme.p2Fill;
                const stroke = pc.player === 1 ? currentTheme.p1Stroke : currentTheme.p2Stroke;`,
`                const fill = pc.player === 1 ? currentTheme.p1Fill : (pc.player === 3 ? '#dc2626' : currentTheme.p2Fill);
                const stroke = pc.player === 1 ? currentTheme.p1Stroke : (pc.player === 3 ? '#7f1d1d' : currentTheme.p2Stroke);`],
        // 手番表示は3人用
        [K.ONE, K.TURN_LINE, `            turnIndicator.textContent = ['', '黒 (1P)', '白 (2P)', '赤 (3P)'][turn] || turn;`],
        // 手数打ち切り
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        // 3人採点: endGameByScore を差し替え
        [K.ONE, `        function endGameByScore() {`,
`        function calculateTerritory3() {
            const visited = Array(board.length).fill(false);
            const terr = { 1: 0, 2: 0, 3: 0 };
            for (let i = 0; i < board.length; i++) {
                if (visited[i] || board[i] !== 0) continue;
                const region = [];
                const touches = new Set();
                const q = [i];
                visited[i] = true;
                while (q.length) {
                    const c2 = q.pop();
                    region.push(c2);
                    getNeighbors(c2).forEach(n2 => {
                        const v = board[n2];
                        if (v === 0 && !visited[n2]) { visited[n2] = true; q.push(n2); }
                        else if (v >= 1 && v <= 3) touches.add(v);
                    });
                }
                if (touches.size === 1) terr[[...touches][0]] += region.length;
            }
            return terr;
        }

        function endGameByScore3() {
            gameOver = true;
            const terr = calculateTerritory3();
            // 順位コミ: 2番手+3.25・3番手+6.5 (先手のみ有利にならない対称補正)
            const komi3 = { 1: 0, 2: (P('komi2') ?? 3.25), 3: (P('komi3') ?? 6.5) };
            const names = { 1: '黒', 2: '白', 3: '赤' };
            const totals = { 1: terr[1] + captures[1], 2: terr[2] + captures[2] + komi3[2], 3: terr[3] + captures[3] + komi3[3] };
            let winner = 1;
            if (totals[2] > totals[winner]) winner = 2;
            if (totals[3] > totals[winner]) winner = 3;
            const sorted = [1, 2, 3].sort((a, b) => totals[b] - totals[a]);
            const diff = Math.abs(totals[sorted[0]] - totals[sorted[1]]);

            gameResultData = {
                title: names[winner] + 'の勝ち (' + diff + ' 目差)',
                details:
                    '<div class="flex justify-between"><span>黒の地:</span> <strong>' + terr[1] + '</strong></div>' +
                    '<div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>' + captures[1] + '</strong></div>' +
                    '<div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>' + totals[1] + '</span></div>' +
                    '<div class="my-1 border-b border-current/10"></div>' +
                    '<div class="flex justify-between"><span>白の地:</span> <strong>' + terr[2] + '</strong></div>' +
                    '<div class="flex justify-between"><span>白のアゲハマ:</span> <strong>' + captures[2] + '</strong></div>' +
                    '<div class="flex justify-between"><span>コミ:</span> <strong>' + komi3[2] + '</strong></div>' +
                    '<div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>' + totals[2] + '</span></div>' +
                    '<div class="my-1 border-b border-current/10"></div>' +
                    '<div class="flex justify-between"><span>赤の地:</span> <strong>' + terr[3] + '</strong></div>' +
                    '<div class="flex justify-between"><span>赤のアゲハマ:</span> <strong>' + captures[3] + '</strong></div>' +
                    '<div class="flex justify-between"><span>コミ:</span> <strong>' + komi3[3] + '</strong></div>' +
                    '<div class="flex justify-between font-bold border-t pt-1"><span>赤合計:</span> <span>' + totals[3] + '</span></div>'
            };

            soundManager.playWin();
            showResultModal();

            if (gameMode === 'online' && onlineRoomId) {
                syncOnlineState();
            }
            saveState();
        }

        function endGameByScore() {
            // 三方碁: 採点は3人用に委譲
            endGameByScore3();
            return;`],
        [K.ONE, K.INFO_BASE, `            三方碁: 黒・白・赤の3人対局。順番に打ち、3人連続パスで終局<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '黒・白・赤の3人で順番に打つ三つ巴の碁。石は3勢力で取り合う。',
            'コミは順位補正: 黒0・白+3.25・赤+6.5 (後手ほど有利)。',
            '3人連続パスで終局。誰かを利する打ちが緩衝になる読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0, 3: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('黒の次は白', turn === 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('白の次は赤', turn === 3);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 3);
        assert('赤の次は黒に戻る', turn === 1);
        assert('赤石が置ける', board[10 * BOARD_SIZE + 10] === 3);
        assert('通常着手は有効', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
        endGameByScore();
        assert('3人採点で終局できる', gameOver === true && gameResultData.details.includes('赤合計'));
    `,
};
