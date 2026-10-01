// DOMINIONGO — 版図碁: 終局時、最大連結区域(最大の連)を持つ側が勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'dominiongo.html',
    en: 'DOMINIONGO',
    jp: '版図碁',
    prefix: 'dominiongo',
    desc: '終局時、盤上で最も大きな連結区域(連)を持つ側が勝ち。地より「繋がり」が全て。',
    kind: 'stone',
    icon: 'dominiongo',
    spec: [
        ...K.rb('DOMINIONGO', '版図碁', 'dominiongo'),
        K.params([
            { key: 'dom_margin', label: '版図勝ちの必要差', min: 0, max: 5, def: 0, unit: '点', hint: '0で1差でも勝ち' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, `        function endGameByScore() {`,
`        // 最大連結区域の大きさ
        function largestGroup(player) {
            const seen = new Set();
            let best = 0;
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const q = [i]; seen.add(i);
                let n = 0;
                while (q.length) {
                    const cur = q.shift(); n++;
                    getNeighbors(cur).forEach(m => {
                        if (board[m] === player && !seen.has(m)) { seen.add(m); q.push(m); }
                    });
                }
                if (n > best) best = n;
            }
            return best;
        }

        function endGameByScore() {
            // 版図ルール: 最大連結区域が大きい側が勝ち (同数なら通常地数判定)
            {
                const lb = largestGroup(1), lw = largestGroup(2);
                if (Math.abs(lb - lw) > (P('dom_margin') ?? 0)) {
                    gameOver = true;
                    const name = lb > lw ? '黒' : '白';
                    gameResultData = {
                        title: name + 'の版図勝ち',
                        details: '最大連結区域: 黒 ' + lb + ' / 白 ' + lw
                    };
                    updateUI();
                    soundManager.playWin();
                    showResultModal();
                    if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                    saveState();
                    return;
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 現在の最大連結数をステータスチップに表示
        ...K.EVENT_CHIP_SPEC(`'版図 黒' + largestGroup(1) + ' / 白' + largestGroup(2)`),
        [K.ONE, K.RV_ALGO, K.rv([
            '終局時、盤上で最も大きい連結区域 (最大の連) を持つ側が勝ち。',
            '同サイズなら通常の地数判定にフォールバックする。',
            '140手を超えた時点で即座に地数判定する (版図優先)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 1));
        [[8, 8], [9, 8]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 2));
        assert('最大連結は黒5', largestGroup(1) === 5 && largestGroup(2) === 2);
        endGameByScore();
        assert('版図勝ちで終局', gameOver === true);
        assert('黒の版図勝ち', !!gameResultData && gameResultData.title.includes('黒の版図'));
    `,
};
