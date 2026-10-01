// ESCAPEGO2 — 脱走碁: 自分の連を自陣端から敵陣端まで1本に繋げた側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'escapego2.html',
    en: 'ESCAPEGO2',
    jp: '脱走碁',
    prefix: 'escapego2',
    desc: '自分の連で盤の上下端を縦断すれば即勝ち。繋がらなければ地取り勝負。',
    kind: 'stone',
    icon: 'escapego2',
    spec: [
        ...K.rb('ESCAPEGO2', '脱走碁', 'escapego2'),
        K.params([
            { key: 'span_dir', label: '縦断の方向', options: [{ v: 'v', l: '縦断のみ' }, { v: 'h', l: '横断のみ' }, { v: 'any', l: '縦横どちらでも' }], def: 'v' },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 140, unit: '手' },
        ]),
        // winByRule + 縦断判定ヘルパー
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 自分の連が上端(y=0)と下端(y=N-1)の両方に達しているか
        function spansBoard(player) {
            const visited = Array(board.length).fill(false);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || visited[i]) continue;
                const group = [];
                const queue = [i];
                visited[i] = true;
                let top = false, bottom = false;
                let left = false, right = false;
                while (queue.length > 0) {
                    const cur = queue.shift();
                    group.push(cur);
                    const cx = cur % BOARD_SIZE, cy = Math.floor(cur / BOARD_SIZE);
                    if (cy === 0) top = true;
                    if (cy === BOARD_SIZE - 1) bottom = true;
                    if (cx === 0) left = true;
                    if (cx === BOARD_SIZE - 1) right = true;
                    getNeighbors(cur).forEach(n => {
                        if (board[n] === player && !visited[n]) { visited[n] = true; queue.push(n); }
                    });
                }
                const dir = P('span_dir') || 'v';
                const spanned = dir === 'v' ? (top && bottom)
                    : dir === 'h' ? (left && right)
                    : ((top && bottom) || (left && right));
                if (spanned) return group[0];
            }
            return -1;
        }

        function endGameByScore() {`],
        // 手番交代直前: 縦断判定 & 長期戦打ち切り
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 脱走碁ルール: 自分の連が上下端を縦断したら即勝ち
            {
                const gi = spansBoard(player);
                if (gi >= 0) {
                    fxGlow(gi, '#facc15', 1000);
                    fxText(gi, '縦断!', '#facc15', 1500);
                    fxShake(6, 380);
                    winByRule(player, '脱走勝ち', '連を自陣端から敵陣端まで繋げました'); return;
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= Math.max(1, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の連が盤の上端と下端の両方に到達 (縦断) した側が即勝ち。',
            '黒白とも縦方向に繋ぐ。縦断できなければ通常の地取り勝負。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        for (let y = 0; y < BOARD_SIZE; y++) executeMove({ cells: [{ x: 2, y }] }, 1);
        assert('縦断で即勝ち', gameOver === true);
        assert('脱走勝ち表示', !!gameResultData && gameResultData.title.includes('脱走'));
        board.fill(0); gameOver = false; gameResultData = null; history.length = 0;
        for (let y = 0; y < BOARD_SIZE - 1; y++) executeMove({ cells: [{ x: 5, y }] }, 1);
        assert('半分の縦断では続行', gameOver === false);
    `,
};
