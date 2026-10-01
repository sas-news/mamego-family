// PENDULUM2GO — 振子碁2: 着手ごとに全ての石が水平に揺れ動く (偶数手=右、奇数手=左)
const K = require('../gen_kit.js');
module.exports = {
    file: 'pendulum2go.html',
    en: 'PENDULUM2GO',
    jp: '振子碁2',
    prefix: 'pendulum2go',
    desc: '着手ごとに全ての石が水平に1マス揺れる。偶数手は右、奇数手は左。端や他石で止まる。',
    kind: 'stone',
    icon: 'pendulum2go',
    spec: [
        ...K.rb('PENDULUM2GO', '振子碁2', 'pendulum2go'),
        K.params([
            { key: 'swing_dist', label: '振子の揺れ幅', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'move_cap', label: '打ち切り手数', min: 40, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 振子ルール: 偶数手は右、奇数手は左へ全石が揺れる (揺れ幅は設定で調整)
            {
                const dir = (history.length % 2 === 0) ? 1 : -1;
                const dist = Math.max(1, P('swing_dist') || 1);
                // 進行方向の先から処理して取りこぼしを防ぐ
                const order = [];
                for (let i = 0; i < board.length; i++) if (board[i] === 1 || board[i] === 2) order.push(i);
                order.sort((a, b) => dir === 1 ? (b % BOARD_SIZE) - (a % BOARD_SIZE) : (a % BOARD_SIZE) - (b % BOARD_SIZE));
                let swung = 0;
                order.forEach(i => {
                    let cur = i;
                    for (let s = 0; s < dist; s++) {
                        const x = cur % BOARD_SIZE;
                        const nx = x + dir;
                        if (nx < 0 || nx >= BOARD_SIZE) break;
                        const t = cur + dir;
                        if (board[t] !== 0) break; // 他石に遮られたら揺れない
                        board[t] = board[cur]; board[cur] = 0;
                        cur = t;
                        swung++;
                    }
                    if (cur !== i) fxSlide(i, cur, 260);
                });
                if (swung) cleanUpPieces();
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('move_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 振子の向きをステータスチップに表示
        ...K.EVENT_CHIP_SPEC(`'振子 ' + ((history.length % 2 === 0) ? '→' : '←')`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手のたびに全ての石が水平に1マス揺れる。偶数手は右へ、奇数手は左へ。',
            '盤端や他の石に遮られた石は揺れない。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 1手目=奇数 → 左へ揺れる
        assert('奇数手は左へ揺れる', board[4 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 3] === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 2手目=偶数 → 右へ揺れる
        assert('偶数手は右へ揺れる', board[4 * BOARD_SIZE + 4] === 1 && board[8 * BOARD_SIZE + 9] === 1);
        executeMove({ cells: [{ x: 1, y: 12 }] }, 1); // 3手目=奇数 → (4,4)は(3,4)へ
        assert('再往復も揺れる', board[4 * BOARD_SIZE + 3] === 1);
        // 盤端で遮られる: 右端 (N-1,0) の石は偶数手(右揺れ)でも動かない
        board[BOARD_SIZE - 1] = 1;
        executeMove({ cells: [{ x: 5, y: 12 }] }, 1); // 4手目=偶数 → 右揺れ
        assert('盤端の石は揺れない', board[BOARD_SIZE - 1] === 1);
    `,
};
